import express, { Request, Response } from 'express';
import Film from '../models/Film';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 1. GET ALL FILMS FOR USER
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const films = await Film.find({ userId: req.user.userId })
      .populate('gearCameraId')
      .populate('gearLensId')
      .sort({ createdAt: -1 });
    res.json(films);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des pellicules' });
  }
});

// 2. CREATE NEW FILM ROLL
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, brand, filmType, iso, isoUsed, format, maxViews, type, gearCameraId, gearLensId, defaultExposureSettings, developmentSettings, notes } = req.body;
    if (!name || !brand || !filmType || !iso || !format || !type) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const film = new Film({
      userId: req.user.userId,
      name,
      brand,
      filmType,
      iso: Number(iso),
      isoUsed: isoUsed !== undefined && isoUsed !== null && isoUsed !== '' ? Number(isoUsed) : null,
      format,
      maxViews: Number(maxViews || 36),
      type,
      gearCameraId: gearCameraId || null,
      gearLensId: gearLensId || null,
      defaultExposureSettings: defaultExposureSettings || {},
      developmentSettings: developmentSettings || {},
      notes: notes || ''
    });

    await film.save();
    res.status(201).json(film);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Une pellicule avec ce nom existe déjà dans votre inventaire.' });
    }
    res.status(500).json({ error: 'Erreur lors de la création de la pellicule' });
  }
});

// 3. UPDATE FILM ROLL
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const film = await Film.findById(req.params.id);
    if (!film) return res.status(404).json({ error: 'Pellicule introuvable' });
    if (film.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }

    const { name, brand, filmType, iso, isoUsed, format, maxViews, type, gearCameraId, gearLensId, defaultExposureSettings, developmentSettings, notes } = req.body;

    film.name = name ?? film.name;
    film.brand = brand ?? film.brand;
    film.filmType = filmType ?? film.filmType;
    film.iso = iso !== undefined ? Number(iso) : film.iso;
    film.isoUsed = isoUsed !== undefined ? (isoUsed !== null && isoUsed !== '' ? Number(isoUsed) : undefined) : film.isoUsed;
    film.format = format ?? film.format;
    film.maxViews = maxViews !== undefined ? Number(maxViews) : film.maxViews;
    film.type = type ?? film.type;
    film.gearCameraId = gearCameraId !== undefined ? (gearCameraId || null) : film.gearCameraId;
    film.gearLensId = gearLensId !== undefined ? (gearLensId || null) : film.gearLensId;
    film.defaultExposureSettings = defaultExposureSettings ?? film.defaultExposureSettings;
    film.developmentSettings = developmentSettings ?? film.developmentSettings;
    film.notes = notes !== undefined ? notes : film.notes;

    await film.save();
    res.json(film);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Une pellicule avec ce nom existe déjà dans votre inventaire.' });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la pellicule' });
  }
});

// 4. DELETE FILM ROLL
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const film = await Film.findById(req.params.id);
    if (!film) return res.status(404).json({ error: 'Pellicule introuvable' });
    if (film.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }

    await Film.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pellicule supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la pellicule' });
  }
});

export default router;
