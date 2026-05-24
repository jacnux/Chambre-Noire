// =====================================
//
// photoRoutes.ts Mai 2026
//  v2.3.2
//
// =====================================
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import mongoose from 'mongoose';
import Photo from '../models/Photo';
import Album from '../models/Album';
import User from '../models/User';
import { authenticateToken } from '../middleware/auth';
import exifr from 'exifr';

const router = express.Router();

// --- CONFIGURATION MULTER ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées !'), false);
  }
};

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024;
const uploadMulter = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxFileSize }
});

// --- NORMALISATION TEXTE / TAGS ---

function looksLikeMojibake(value: string): boolean {
  return /Ã|Â|â€™|â€œ|â€|â€“|ã|�/.test(value);
}

function fixMojibake(value: string): string {
  if (!value) return value;
  if (!looksLikeMojibake(value)) return value;

  try {
    const fixed = Buffer.from(value, 'latin1').toString('utf8');
    return fixed || value;
  } catch {
    return value;
  }
}

function normalizeWhitespace(value: string): string {
  return value
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSingleTag(raw: unknown): string {
  let tag = String(raw ?? '');

  tag = fixMojibake(tag);
  tag = normalizeWhitespace(tag);
  tag = tag.normalize('NFC').toLowerCase();

  const tagMap: Record<string, string> = {
    'studo': 'studio',
    'surrealisme': 'surréalisme',
    'a la maniere de': 'a la manière de',
    'a la maniã¨re de': 'a la manière de',
    'cã©zanne': 'cézanne',
    'surrã©alisme': 'surréalisme',
    'nature  morte': 'nature morte'
  };

  return tagMap[tag] || tag;
}

function normalizeStringField(raw: unknown): string {
  let value = String(raw ?? '');
  value = fixMojibake(value);
  value = normalizeWhitespace(value);
  return value.normalize('NFC').trim();
}

function normalizeTags(raw: unknown): string[] {
  if (raw == null) return [];

  const arr = Array.isArray(raw) ? raw : [raw];

  return [...new Set(
    arr
      .flatMap((item) => {
        if (typeof item !== 'string') return [item];
        return item.split(',');
      })
      .map(normalizeSingleTag)
      .filter(Boolean)
  )];
}

// --- ROUTES ---

// 1. UPLOAD PHOTOS
router.post('/', authenticateToken, uploadMulter.array('photos'), async (req: Request, res: Response) => {
  try {
    const { albumId, metadata } = req.body;

    if (!req.files || !Array.isArray(req.files)) {
      throw new Error('Aucun fichier');
    }

    const files = req.files as Express.Multer.File[];
    const meta = metadata ? JSON.parse(metadata) : [];

    const album = await Album.findById(albumId);
    if (!album) return res.status(404).json({ error: 'Album introuvable' });
    if (album.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }
    if (album.isVirtual) {
      return res.status(400).json({ error: 'Impossible d\'ajouter des photos à un album virtuel.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0);

    if (user.quotaUsed + totalUploadSize > user.quotaLimit) {
      files.forEach((f) => {
        try {
          fs.unlinkSync(path.join(__dirname, '../../uploads', f.filename));
        } catch {
          // ignore
        }
      });
      return res.status(403).json({ error: 'Espace insuffisant.' });
    }

    let coverFilename: string | null = null;

    const savedPhotos = await Promise.all(
      files.map(async (file) => {
        const data = meta.find((m: any) => m.originalName === file.originalname) || {};

        const inputPath = path.join(__dirname, '../../uploads', file.filename);
        const outputPath = path.join(__dirname, '../../uploads', `tmp-${file.filename}`);

        let exifKeywords: string[] = [];
        let exifTitle = '';
        let exifDescription = '';

        try {
          const exif = await exifr.parse(inputPath, {
            iptc: true,
            xmp: true,
            tiff: false,
            icc: false,
          });

          if (exif) {
            const rawKeywords = (exif as any).Keywords ?? (exif as any).Subject ?? [];
            exifKeywords = normalizeTags(rawKeywords);

            exifTitle = normalizeStringField(
              (exif as any).ObjectName ?? (exif as any).Title ?? ''
            );

            exifDescription = normalizeStringField(
              (exif as any).Caption ?? (exif as any).Description ?? ''
            );
          }
        } catch (e) {
          console.error('Erreur lecture EXIF:', e);
        }

        const image = sharp(inputPath);
        const sharpMeta = await image.metadata();

        let targetWidth = sharpMeta.width || 1920;
        let targetHeight = sharpMeta.height || 1080;

        if (targetWidth > 1920) {
          const ratio = 1920 / targetWidth;
          targetWidth = 1920;
          targetHeight = Math.round((sharpMeta.height || 1080) * ratio);
        }

        let sharpChain = image.resize(1920, null, {
          fit: 'inside',
          withoutEnlargement: true
        });

        if (data.applyWatermark) {
          const textToPrint = normalizeStringField(data.watermarkText || '© Hélioscope');
          const svgWidth = 300;
          const svgHeight = 50;
          const padding = 20;
          const leftPos = Math.max(0, targetWidth - svgWidth - padding);
          const topPos = Math.max(0, targetHeight - svgHeight - padding);

          const svgText = `
            <svg width="${svgWidth}" height="${svgHeight}">
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" rx="5" ry="5"/>
              <style>
                .title {
                  fill: #ffffff;
                  font-size: 20px;
                  font-weight: bold;
                  font-family: 'DejaVu Sans', sans-serif;
                }
              </style>
              <text x="50%" y="50%" class="title" text-anchor="middle" dominant-baseline="middle">${textToPrint}</text>
            </svg>
          `;

          sharpChain = sharpChain.composite([
            { input: Buffer.from(svgText), top: topPos, left: leftPos }
          ]);
        }

        await sharpChain.jpeg({ quality: 85 }).toFile(outputPath);

        if (fs.existsSync(outputPath)) {
          fs.renameSync(outputPath, inputPath);
        } else {
          throw new Error(`Sharp n'a pas produit le fichier : ${outputPath}`);
        }

        if (data.isCover) {
          coverFilename = file.filename;
        }

        const manualTags = normalizeTags(data.tag);
        const tagsArray = [...new Set([...manualTags, ...exifKeywords])];

        return {
          albumId,
          userId: req.user.userId,
          filename: file.filename,
          index: data.index || 0,
          title: normalizeStringField(data.title || exifTitle || file.originalname),
          description: normalizeStringField(data.description || exifDescription || ''),
          tags: tagsArray,
          size: file.size
        };
      })
    );

    await Photo.insertMany(savedPhotos);

    if (coverFilename) {
      await Album.findByIdAndUpdate(albumId, { coverImage: coverFilename });
    }

    user.quotaUsed += totalUploadSize;
    await user.save();

    res.json({ message: 'Upload réussi', count: savedPhotos.length });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Erreur upload' });
  }
});

// 2. LISTER MES PHOTOS
router.get('/my/photos', authenticateToken, async (req: Request, res: Response) => {
  try {
    const photos = await Photo.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération photos' });
  }
});

// 3. GET ALL TAGS
router.get('/tags', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tags = await Photo.distinct('tags', { userId: req.user.userId });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération tags' });
  }
});

// 4. DEPLACER UNE PHOTO
router.put('/move/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { targetAlbumId } = req.body;
    const photoId = req.params.id;

    if (!targetAlbumId) {
      return res.status(400).json({ error: 'Album cible manquant' });
    }

    const photo = await Photo.findById(photoId);
    if (!photo) return res.status(404).json({ error: 'Photo introuvable' });
    if (photo.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const targetAlbum = await Album.findById(targetAlbumId);
    if (!targetAlbum || targetAlbum.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Album cible non autorisé' });
    }

    photo.albumId = new mongoose.Types.ObjectId(targetAlbumId);
    await photo.save();

    res.json({ message: 'Photo déplacée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du déplacement' });
  }
});

// 5. METTRE A JOUR PHOTO
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: 'Photo introuvable' });
    if (photo.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Interdit' });
    }

    const { index, title, description, tags } = req.body;
    const normalizedTags = tags !== undefined ? normalizeTags(tags) : undefined;

    const updatedPhoto = await Photo.findByIdAndUpdate(
      req.params.id,
      {
        index,
        title: title !== undefined ? normalizeStringField(title) : photo.title,
        description: description !== undefined ? normalizeStringField(description) : photo.description,
        tags: normalizedTags
      },
      { new: true }
    );

    res.json(updatedPhoto);
  } catch (error) {
    res.status(500).json({ error: 'Erreur modification photo' });
  }
});

// 6. SUPPRIMER PHOTO
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: 'Photo introuvable' });
    if (photo.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Interdit' });
    }

    const filePath = path.join(__dirname, '../../uploads', photo.filename);
    let fileSize = photo.size || 0;

    if (!fileSize && fs.existsSync(filePath)) {
      fileSize = fs.statSync(filePath).size;
    }

    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Erreur suppression fichier', err);
    }

    await Photo.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(req.user.userId, { $inc: { quotaUsed: -fileSize } });

    res.json({ message: 'Photo supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

export default router;
