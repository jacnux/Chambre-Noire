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
import Gear from '../models/Gear';
import Film from '../models/Film';
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

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/gif'
];

const fileFilter = (req: any, file: any, cb: any) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WebP, TIFF, GIF.'), false);
  }
};

// Vérification du magic number (le mimetype client est contournable)
function hasAllowedImageSignature(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    if (buf.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return true; // JPEG
    if (buf.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return true; // PNG
    if (buf.slice(0, 3).equals(Buffer.from([0x47, 0x49, 0x46]))) return true; // GIF
    if ((buf.slice(0, 4).equals(Buffer.from([0x49, 0x49, 0x2a, 0x00])) ||
         buf.slice(0, 4).equals(Buffer.from([0x4d, 0x4d, 0x00, 0x2a])))) return true; // TIFF
    if (buf.slice(0, 4).equals(Buffer.from([0x52, 0x49, 0x46, 0x46])) &&
        buf.slice(8, 12).equals(Buffer.from([0x57, 0x45, 0x42, 0x50]))) return true; // WEBP
    return false;
  } catch {
    return false;
  }
}

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

    // B2 — Validation du contenu réel du fichier (magic number)
    const invalidFiles = files.filter(
      (f) => !hasAllowedImageSignature(path.join(__dirname, '../../uploads', f.filename))
    );
    if (invalidFiles.length > 0) {
      invalidFiles.forEach((f) => {
        try { fs.unlinkSync(path.join(__dirname, '../../uploads', f.filename)); } catch { /* ignore */ }
      });
      return res.status(400).json({ error: 'Un ou plusieurs fichiers ne sont pas des images valides.' });
    }

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

        let exposureSettings: any = {
          aperture: '',
          shutterSpeed: '',
          iso: null,
          focalLength: '',
          light: ''
        };
        let captureDate: Date | null = null;
        let gearCameraId: string | null = null;
        let gearLensId: string | null = null;

        try {
          const exif = await exifr.parse(inputPath, {
            iptc: true,
            xmp: true,
            tiff: true,
            exif: true,
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

            // Extraction des paramètres d'exposition
            const aperture = exif.FNumber ? `f/${exif.FNumber}` : '';
            
            let shutterSpeed = '';
            if (exif.ExposureTime) {
              const expTime = Number(exif.ExposureTime);
              if (expTime > 0) {
                if (expTime < 1) {
                  shutterSpeed = `1/${Math.round(1 / expTime)}s`;
                } else {
                  shutterSpeed = `${expTime}s`;
                }
              }
            }

            const iso = exif.ISO ?? exif.ISOSpeedRatings ?? null;
            const focalLength = exif.FocalLength ? `${exif.FocalLength}mm` : '';

            exposureSettings = {
              aperture,
              shutterSpeed,
              iso,
              focalLength,
              light: ''
            };

            if (exif.DateTimeOriginal || exif.CreateDate) {
              captureDate = new Date(exif.DateTimeOriginal || exif.CreateDate);
            }

            // Auto-enregistrement / Liaison du Matériel (Gear)
            let extractedCameraName = '';
            if (exif.Make || exif.Model) {
              extractedCameraName = `${exif.Make || ''} ${exif.Model || ''}`.trim();
            }

            if (extractedCameraName) {
              let cameraGear = await Gear.findOne({
                userId: req.user.userId,
                type: 'camera',
                model: { $regex: new RegExp(extractedCameraName, 'i') }
              });
              if (!cameraGear) {
                cameraGear = new Gear({
                  userId: req.user.userId,
                  type: 'camera',
                  brand: exif.Make || 'Inconnu',
                  model: extractedCameraName,
                  format: 'Plein format' // format par défaut
                });
                await cameraGear.save();
              }
              gearCameraId = cameraGear._id.toString();
            }

            let extractedLensName = '';
            if (exif.LensModel) {
              extractedLensName = String(exif.LensModel).trim();
            }

            if (extractedLensName) {
              let lensGear = await Gear.findOne({
                userId: req.user.userId,
                type: 'lens',
                model: { $regex: new RegExp(extractedLensName, 'i') }
              });
              if (!lensGear) {
                lensGear = new Gear({
                  userId: req.user.userId,
                  type: 'lens',
                  brand: extractedLensName.split(' ')[0] || 'Inconnu',
                  model: extractedLensName,
                  format: 'Plein format'
                });
                await lensGear.save();
              }
              gearLensId = lensGear._id.toString();
            }
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
          size: file.size,
          exposureSettings,
          captureDate,
          gearCameraId: gearCameraId || null,
          gearLensId: gearLensId || null,
          isAnalog: data.isAnalog ?? false,
          projectId: data.projectId || null,
          filmId: data.filmId || null,
          filmFrameNumber: data.filmFrameNumber || null,
          showOnBlog: data.showOnBlog ?? false,
          developmentSettings: data.developmentSettings || {}
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

// 1.5. LISTER LES PHOTOS PUBLIQUES HORS PROJETS
router.get('/public/standalone', async (req: Request, res: Response) => {
  try {
    const photos = await Photo.find({ showOnBlog: true, projectId: null })
      .populate('gearCameraId')
      .populate('gearLensId')
      .populate('filmId')
      .sort({ createdAt: -1 });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération photos publiques' });
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

    const {
      index,
      title,
      description,
      tags,
      projectId,
      isAnalog,
      gearCameraId,
      gearLensId,
      filmId,
      filmFrameNumber,
      showOnBlog,
      exposureSettings,
      developmentSettings,
      shootingIntent,
      location,
      captureDate,
      makingOf
    } = req.body;

    const normalizedTags = tags !== undefined ? normalizeTags(tags) : undefined;

    const updateFields: any = {};
    if (index !== undefined) updateFields.index = index;
    if (title !== undefined) updateFields.title = normalizeStringField(title);
    if (description !== undefined) updateFields.description = normalizeStringField(description);
    if (normalizedTags !== undefined) updateFields.tags = normalizedTags;
    
    // Nouveaux attributs du Carnet de route
    if (projectId !== undefined) updateFields.projectId = projectId || null;
    if (isAnalog !== undefined) updateFields.isAnalog = isAnalog;
    if (gearCameraId !== undefined) updateFields.gearCameraId = gearCameraId || null;
    if (gearLensId !== undefined) updateFields.gearLensId = gearLensId || null;
    if (filmId !== undefined) updateFields.filmId = filmId || null;
    if (filmFrameNumber !== undefined) updateFields.filmFrameNumber = filmFrameNumber || null;
    if (showOnBlog !== undefined) updateFields.showOnBlog = showOnBlog;
    if (exposureSettings !== undefined) updateFields.exposureSettings = exposureSettings;
    if (developmentSettings !== undefined) updateFields.developmentSettings = developmentSettings;
    if (shootingIntent !== undefined) updateFields.shootingIntent = normalizeStringField(shootingIntent);
    if (location !== undefined) updateFields.location = normalizeStringField(location);
    if (captureDate !== undefined) updateFields.captureDate = captureDate ? new Date(captureDate) : null;
    if (makingOf !== undefined) updateFields.makingOf = makingOf;

    const updatedPhoto = await Photo.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
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

// 7. UPLOAD IMAGE "SECRET DE FABRICATION" (making-of)
const makingOfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/making-of');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});
const makingOfUpload = multer({ storage: makingOfStorage, fileFilter, limits: { fileSize: maxFileSize } });

router.post('/making-of/upload', authenticateToken, makingOfUpload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucune image reçue' });
    const relativePath = `making-of/${req.file.filename}`;
    res.json({ filename: relativePath, url: `/uploads/${relativePath}` });
  } catch (error) {
    console.error('Erreur upload making-of:', error);
    res.status(500).json({ error: 'Erreur upload' });
  }
});

export default router;
