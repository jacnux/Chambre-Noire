import express, { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Album from '../models/Album';
import Photo from '../models/Photo';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import { sendPasswordResetEmail } from '../utils/emailService'; // Ajouter l'import
const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

// --- GET : Lister les utilisateurs ---
router.get('/users', async (req: Request, res: Response) => {
  try {
    // On récupère tous les champs (y compris quotaLimit et quotaUsed)
    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch (error) { res.status(500).json({ error: 'Erreur récupération users' }); }
});

// --- NOUVEAU : PUT Modifier le quota ---
router.put('/users/:id/quota', async (req: Request, res: Response) => {
  try {
    const { quotaLimit } = req.body;

    // Validation simple
    if (!quotaLimit || typeof quotaLimit !== 'number' || quotaLimit < 0) {
      return res.status(400).json({ error: 'Limite de quota invalide.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { quotaLimit },
      { new: true } // Retourne l'utilisateur mis à jour
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du quota' });
  }
});

// --- PUT : Modifier un utilisateur (Admin) ---
// --- PUT : Modifier un utilisateur (Admin) ---
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    // MODIFICATION ICI : Ajouter 'email' à la déstructuration
    const { quotaLimit, password, email } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    // Mise à jour du quota
    if (quotaLimit !== undefined) user.quotaLimit = quotaLimit;

    // NOUVEAU : Mise à jour de l'email
    if (email) user.email = email;

    // Mise à jour du mot de passe (si fourni)
    if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    // BONNE PRATIQUE : Renvoyer l'objet mis à jour (sans le mot de passe)
    res.json({ message: 'Utilisateur mis à jour', user: user.toObject() });
  } catch (error) {
    // Gestion des erreurs (ex: email déjà utilisé par quelqu'un d'autre)
    console.error(error);
    res.status(500).json({ error: 'Erreur mise à jour' });
  }
});


// 3. POST : Réinitialiser mot de passe
router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const tempPassword = crypto.randomBytes(12).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    user.password = hashedPassword;
    await user.save();

    // ENVOI EMAIL
    console.log(`Tentative d'envoi email à ${user.email}`);
    try {
        await sendPasswordResetEmail(user.email, tempPassword);
        console.log("Email envoyé avec succès (Brevo)");
    } catch (mailError) {
        // On loggue l'erreur mais on ne fait pas échouer la requête
        console.error("ERREUR ENVOI MAIL:", mailError);
    }

    res.json({
      message: 'Mot de passe réinitialisé et email envoyé',
      user: user.email
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur reset password' });
  }
});

// --- DELETE : Supprimer un utilisateur ---
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ error: 'Utilisateur introuvable' });

    if (userToDelete._id.toString() === req.user.userId) {
      return res.status(403).json({ error: 'Vous ne pouvez pas supprimer votre propre compte depuis ici.' });
    }

    const albums = await Album.find({ userId: userToDelete._id });
    for (const album of albums) {
      const photos = await Photo.find({ albumId: album._id });
      for (const photo of photos) {
        const filePath = path.join(__dirname, '../../uploads', photo.filename);
        try { fs.unlinkSync(filePath); } catch (err) {}
      }
      await Photo.deleteMany({ albumId: album._id });
      await Album.findByIdAndDelete(album._id);
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Utilisateur et toutes ses données supprimés' });
  } catch (error) { res.status(500).json({ error: 'Erreur suppression user' }); }
});

export default router;
