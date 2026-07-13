// ======================================================
//  albumRoutes.ts
//   v2.4.0   blocage suppression galerie si page existante
//
// ====================================================

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import Album from '../models/Album';
import Photo from '../models/Photo';
import User from '../models/User';
import { authenticateToken } from '../middleware/auth';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { title, description, isPublic } = req.body;

    const newAlbum = new Album({
      userId: req.user.userId,
      title,
      description,
      isPublic
    });

    await newAlbum.save();
    res.status(201).json(newAlbum);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur création album' });
  }
});

router.get('/my/albums', authenticateToken, async (req: Request, res: Response) => {
  try {
    let albums = await Album.find({ userId: req.user.userId }).sort({ createdAt: -1 }).lean();

    res.json(albums);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur récupération albums' });
  }
});

router.get('/photos/:id', async (req: Request, res: Response) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ error: 'Album introuvable' });

    if (!album.isPublic) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Accès non autorisé (token requis)' });
        try {
          const secret = process.env.JWT_SECRET;
          if (!secret) return res.status(500).json({ error: 'Configuration du serveur incomplète (JWT_SECRET manquant).' });
          const decoded = jwt.verify(token, secret) as any;
        const isAdmin = decoded.isAdmin === true;
        const isOwner = decoded.userId === album.userId.toString();
        if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Accès interdit' });
      } catch (err) {
        return res.status(403).json({ error: 'Token invalide ou expiré' });
      }
    }

    let photos;
    const fieldsToSelect = 'filename title description createdAt index tags exposureSettings developmentSettings shootingIntent location captureDate projectId gearCameraId gearLensId filmId filmFrameNumber showOnBlog isAnalog makingOf';

    photos = await Photo.find({ albumId: req.params.id }).select(fieldsToSelect).sort({ createdAt: -1 });

    res.json(photos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur récupération photos' });
  }
});

router.get('/portfolio/:username', async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({
      name: { $regex: new RegExp(`^${req.params.username}$`, 'i') }
    }).select('name email avatar bio bannerImage portfolioIntro servicesDescription tagline blogTheme');

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const albums = await Album.find({
      userId: user._id,
      isPublic: true,
      isFeatured: true
    }).sort({ createdAt: -1 });

    res.json({ user, albums });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ error: 'Album introuvable' });

    if (!album.isPublic) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Accès non autorisé' });
        try {
          const secret = process.env.JWT_SECRET;
          if (!secret) return res.status(500).json({ error: 'Configuration du serveur incomplète (JWT_SECRET manquant).' });
          const decoded = jwt.verify(token, secret) as any;
        const isAdmin = decoded.isAdmin === true;
        const isOwner = decoded.userId === album.userId.toString();
        if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Accès interdit' });
      } catch (err) {
        return res.status(403).json({ error: 'Token invalide' });
      }
    }

    res.json(album);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { title, description, isPublic, coverImage } = req.body;
    const updateData: any = { title, description, isPublic, coverImage };

    const updated = await Album.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      updateData,
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Album non trouvé ou non autorisé' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour' });
  }
});

router.patch('/:id/toggle-visibility', authenticateToken, async (req: Request, res: Response) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ error: 'Album introuvable' });
    if (album.userId.toString() !== req.user.userId) return res.status(403).json({ error: 'Non autorisé' });

    album.isPublic = !album.isPublic;
    await album.save();
    res.json(album);
  } catch (error) {
    res.status(500).json({ error: 'Erreur changement visibilité' });
  }
});

router.patch('/:id/toggle-featured', authenticateToken, async (req: Request, res: Response) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ error: 'Album introuvable' });
    if (album.userId.toString() !== req.user.userId) return res.status(403).json({ error: 'Non autorisé' });

    album.isFeatured = !album.isFeatured;
    await album.save();
    res.json(album);
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour' });
  }
});

router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ error: 'Album introuvable' });
    if (album.userId.toString() !== req.user.userId) return res.status(403).json({ error: 'Non autorisé' });



    const photos = await Photo.find({ albumId: album._id, userId: req.user.userId });
    let totalFreed = 0;

    for (const photo of photos) {
      const filePath = path.join(__dirname, '../../uploads', photo.filename);
      let fileSize = photo.size || 0;

      if (!fileSize && fs.existsSync(filePath)) {
        fileSize = fs.statSync(filePath).size;
      }

      totalFreed += fileSize;

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error(`Erreur suppression fichier ${photo.filename}:`, fileError);
        }
      }
    }

    await Photo.deleteMany({ albumId: album._id, userId: req.user.userId });
    await album.deleteOne();

    if (totalFreed > 0) {
      await User.findByIdAndUpdate(req.user.userId, { $inc: { quotaUsed: -totalFreed } });
    }

    res.json({
      message: 'Album supprimé',
      deletedPhotos: photos.length,
      freedBytes: totalFreed
    });
  } catch (error) {
    console.error('Erreur suppression album :', error);
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

export default router;
