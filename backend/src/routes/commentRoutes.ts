// src/routes/commentRoutes.ts
import express    from 'express';
import nodemailer from 'nodemailer';
import Comment    from '../models/Comment';
import Photo      from '../models/Photo';
import User       from '../models/User';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// ── SMTP — même config que le blog engine ──────────────────────────
const transporterOptions: any = {
  host:   process.env.SMTP_HOST || 'localhost',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
};
if (process.env.SMTP_USER) {
  transporterOptions.auth = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
}
const transporter = nodemailer.createTransport(transporterOptions);

// Helper — extrait l'userId du token quelle que soit la clé
const getUserId = (req: any): string | null =>
  req.user?.id || req.user?._id || req.user?.userId || null;

// ══════════════════════════════════════════════════════════════════
// ⚠️  Les routes statiques (/my, /reply…) AVANT les routes /:param
// ══════════════════════════════════════════════════════════════════

// ── GET /api/comments/my — PRIVÉ, dashboard du propriétaire ──────
router.get('/my', authenticateToken, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Utilisateur non identifié.' });

    const comments = await Comment.find({ photoOwnerId: userId })
      .populate('photoId', 'title filename')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── POST /api/comments/:id/reply — PRIVÉ, répondre par email ─────
router.post('/:id/reply', authenticateToken, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    const { replyMessage } = req.body;

    if (!replyMessage?.trim()) {
      return res.status(400).json({ error: 'Message de réponse requis.' });
    }

    // Vérifier que le commentaire appartient bien à cet utilisateur
    const comment = await Comment.findOne({ _id: req.params.id, photoOwnerId: userId })
      .populate('photoId', 'title filename');

    if (!comment) return res.status(404).json({ error: 'Commentaire introuvable.' });
    if (!comment.authorEmail) return res.status(400).json({ error: 'Cet auteur n\'a pas laissé d\'email.' });

    // Récupérer le nom du photographe (propriétaire)
    const owner = await User.findById(userId).select('name email');
    const photoTitle = (comment.photoId as any)?.title || 'une photo';

    await transporter.sendMail({
      from:    process.env.SMTP_FROM || owner?.email,
      to:      comment.authorEmail,
      replyTo: owner?.email,
      subject: `Re : votre commentaire sur "${photoTitle}"`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <p>Bonjour <strong>${comment.authorName}</strong>,</p>
          <p>${owner?.name || 'Le photographe'} a répondu à votre commentaire sur la photo <em>"${photoTitle}"</em> :</p>
          <blockquote style="border-left:3px solid #4f98a3;padding:12px 16px;background:#f5f5f5;margin:16px 0;border-radius:4px">
            ${replyMessage.replace(/\n/g, '<br>')}
          </blockquote>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
          <p style="color:#999;font-size:12px">
            Votre commentaire original : <em>"${comment.message}"</em>
          </p>
        </div>
      `,
    });

    // Marquer comme lu automatiquement après réponse
    await Comment.findByIdAndUpdate(req.params.id, { isRead: true });

    res.json({ success: true });
  } catch (err) {
    console.error('[comment reply]', err);
    res.status(500).json({ error: 'Erreur envoi email.' });
  }
});

// ── POST /api/comments/:photoId — PUBLIC, depuis portfolio/blog ──
router.post('/:photoId', async (req, res) => {
  try {
    const { authorName, authorEmail, message } = req.body;
    if (!authorName || !message) {
      return res.status(400).json({ error: 'Nom et message requis.' });
    }

    const photo = await Photo.findById(req.params.photoId);
    if (!photo) return res.status(404).json({ error: 'Photo introuvable.' });

    const owner = await User.findById(photo.userId).select('name');

    const comment = await Comment.create({
      photoId:      photo._id,
      photoOwnerId: photo.userId,
      authorName:   authorName.trim().substring(0, 100),
      authorEmail:  authorEmail?.trim() || '',
      message:      message.trim().substring(0, 1000),
    });

    res.status(201).json({
      success:   true,
      comment,
      ownerName: owner?.name || 'le photographe',
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── PATCH /api/comments/:id/read — marquer comme lu ─────────────
router.patch('/:id/read', authenticateToken, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    await Comment.findOneAndUpdate(
      { _id: req.params.id, photoOwnerId: userId },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── DELETE /api/comments/:id — PRIVÉ ────────────────────────────
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    await Comment.findOneAndDelete({ _id: req.params.id, photoOwnerId: userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
