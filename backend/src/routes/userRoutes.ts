// ============================================================
// CHAMBRE NOIRE API — userRoutes
// v2.3.0 — Mai 2026
// ============================================================

import express, { Request, Response } from 'express';
import User from '../models/User';
import Album from '../models/Album';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const router = express.Router();

// --- CONFIGURATION MULTER (Avatar + Banner) ---
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/gif'];

function hasAllowedImageSignature(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    if (buf.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return true;
    if (buf.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return true;
    if (buf.slice(0, 3).equals(Buffer.from([0x47, 0x49, 0x46]))) return true;
    if ((buf.slice(0, 4).equals(Buffer.from([0x49, 0x49, 0x2a, 0x00])) ||
         buf.slice(0, 4).equals(Buffer.from([0x4d, 0x4d, 0x00, 0x2a])))) return true;
    if (buf.slice(0, 4).equals(Buffer.from([0x52, 0x49, 0x46, 0x46])) &&
        buf.slice(8, 12).equals(Buffer.from([0x57, 0x45, 0x42, 0x50]))) return true;
    return false;
  } catch {
    return false;
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // On préfixe le fichier selon son type (avatar-... ou banner-...)
    const prefix = file.fieldname === 'banner' ? 'banner-' : 'avatar-';
    cb(null, prefix + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  fileFilter: (req: any, file: any, cb: any) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Type de fichier non autorisé (JPEG, PNG, WebP, TIFF, GIF).'), false);
  }
});

// --- ROUTES ---

// 0. GET Public Profile (No authentication required)
router.get('/public/profile', async (req: Request, res: Response) => {
  try {
    let user = await User.findOne({ isAdmin: true }).select('name avatar bio carnetIntro tagline servicesDescription');
    if (!user) {
      user = await User.findOne().select('name avatar bio carnetIntro tagline servicesDescription');
    }
    if (!user) {
      return res.status(404).json({ error: 'Aucun utilisateur trouvé' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du profil public' });
  }
});

// 1. GET : Lister tous les utilisateurs (ADMIN)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!(req as any).user?.isAdmin) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération utilisateurs' });
  }
});

// 2. GET : Albums d'un utilisateur spécifique (ADMIN)
router.get('/admin/:id/albums', authenticateToken, async (req: Request, res: Response) => {
  if (!(req as any).user?.isAdmin) return res.status(403).json({ error: 'Accès refusé' });

  try {
    const albums = await Album.find({ userId: req.params.id }).select('title coverImage description isPublic');
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération albums' });
  }
});

// 3. GET MON PROFIL (Connecté)
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    console.error("Erreur GET /me:", error);
    res.status(500).json({ error: 'Erreur récupération profil' });
  }
});

// 4. PUT METTRE A JOUR PROFIL
router.put('/me', authenticateToken, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), async (req: Request, res: Response) => {
  try {
    // Récupération des champs textuels
    const { bio, showcaseAlbums, portfolioIntro, servicesDescription, tagline, blogTheme, carnetIntro } = req.body;

    const updates: any = {};

    // Mise à jour des champs texte
    if (bio !== undefined) updates.bio = bio;

    // --- AJOUT INDISPENSABLE ---
    if (portfolioIntro !== undefined) updates.portfolioIntro = portfolioIntro;
    if (servicesDescription !== undefined) updates.servicesDescription = servicesDescription;
    if (tagline !== undefined) updates.tagline = tagline;
    if (blogTheme !== undefined) updates.blogTheme = blogTheme;
    if (carnetIntro !== undefined) updates.carnetIntro = carnetIntro;
    // ---------------------------

    // Gestion des fichiers uploadés
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // B2 — Validation du contenu réel des fichiers uploadés
    const allUploaded = [...(files?.['avatar'] ?? []), ...(files?.['banner'] ?? [])];
    const invalid = allUploaded.filter(
      (f) => !hasAllowedImageSignature(path.join(__dirname, '../../uploads', f.filename))
    );
    if (invalid.length > 0) {
      invalid.forEach((f) => { try { fs.unlinkSync(path.join(__dirname, '../../uploads', f.filename)); } catch { /* ignore */ } });
      return res.status(400).json({ error: 'Un ou plusieurs fichiers ne sont pas des images valides.' });
    }

    if (files && files['avatar']) {
      updates.avatar = files['avatar'][0].filename;
    }
    if (files && files['banner']) {
      updates.bannerImage = files['banner'][0].filename;
    }

    if (showcaseAlbums) updates.showcaseAlbums = JSON.parse(showcaseAlbums);

    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur mise à jour profil' });
  }
});



// 5. GET PROFIL PUBLIC
router.get('/public/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name bio avatar bannerImage showcaseAlbums tagline blogTheme createdAt carnetIntro') // Ajout de bannerImage et carnetIntro
      .populate({
        path: 'showcaseAlbums',
        match: { isPublic: true }
      });

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

// --- CONFIGURATION EMAIL (identique à reportRoutes) ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 6. POST CONTACT (Public — envoie un email au propriétaire du portfolio)
router.post('/contact', async (req: Request, res: Response) => {
    const { toUserId, fromName, fromEmail, message } = req.body;

  if (!toUserId || !fromName || !fromEmail || !message) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
  }

  // B3 — Validation email + protection contre l'injection d'en-têtes / HTML
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(fromEmail) || /[\r\n]/.test(fromEmail) || /[\r\n]/.test(fromName)) {
    return res.status(400).json({ error: 'Adresse email ou nom invalide.' });
  }

  const safeName = escapeHtml(fromName);
  const safeEmail = escapeHtml(fromEmail);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  try {
    const recipient = await User.findById(toUserId).select('email name');
    if (!recipient) return res.status(404).json({ error: 'Utilisateur introuvable' });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: recipient.email,
      replyTo: fromEmail,
      subject: `📩 Message de ${fromName} via Hélioscope`,
      html: `
        <h3>Nouveau message depuis votre portfolio</h3>
        <p><strong>De :</strong> ${safeName} &lt;${safeEmail}&gt;</p>
        <p><strong>Message :</strong></p>
        <p>${safeMessage}</p>
        <hr>
        <p style="color:#999;font-size:12px">Répondez directement à cet email pour contacter ${safeName}.</p>
      `
    });

    res.json({ message: 'Email envoyé avec succès' });
  } catch (error) {
    console.error("Erreur envoi contact:", error);
    res.status(500).json({ error: 'Erreur envoi email' });
  }
});

export default router;
