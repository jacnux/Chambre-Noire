import crypto from 'crypto';
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../utils/emailService';
import User from '../models/User';

const router = express.Router();



// --- POST /register ---
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email déjà utilisé' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // --- NOUVEAU : Premier utilisateur uniquement ---
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return res.status(403).json({ error: "L'inscription est désactivée." });
    }
    // ---------------------------------------------

    const user = new User({
      name,
      email,
      password: hashedPassword,
      quotaLimit: 1 * 1024 * 1024 * 1024,
      isAdmin: true,
      isVerified: true
    });

    await user.save();

    res.status(201).json({ message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

      // --- NOUVEAU : GET /verify-email ---
    router.get('/verify-email', async (req: Request, res: Response) => {
      const { token } = req.query;

      if (!token) return res.status(400).json({ error: 'Token manquant' });

      try {
        const user = await User.findOne({
          verificationToken: token,
          verificationTokenExpires: { $gt: new Date() } // Token non expiré
        });

        if (!user) {
          return res.status(400).json({ error: 'Lien invalide ou expiré.' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        res.json({ message: 'Compte vérifié avec succès ! Vous pouvez maintenant vous connecter.' });
      } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
      }
    });

// --- POST /login ---
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Identifiants incorrects' });

    // Vérification du compte (y compris les anciens utilisateurs non marqués)
    if (user.isVerified === false) {
      return res.status(403).json({ error: 'Veuillez vérifier vos emails pour activer votre compte.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Identifiants incorrects' });

    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
  } catch (error) {
    console.error('ERREUR LOGIN:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
