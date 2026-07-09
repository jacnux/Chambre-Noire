import express, { Request, Response } from 'express';
import Gear from '../models/Gear';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    let gearList = await Gear.find({ userId: req.user.userId }).sort({ brand: 1, model: 1 });
    
    // Auto-create Sténopé if not present
    const hasStenope = gearList.some(g => g.type === 'camera' && g.brand.toLowerCase() === 'sténopé');
    if (!hasStenope) {
      try {
        const newStenope = new Gear({
          userId: req.user.userId,
          type: 'camera',
          brand: 'Sténopé',
          model: 'Sténopé',
          format: 'Autre'
        });
        await newStenope.save();
        gearList.push(newStenope);
        gearList.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
      } catch (err) {
        console.error('Error auto-creating Stenope camera:', err);
      }
    }
    
    res.json(gearList);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du matériel' });
  }
});

// 2. CREATE NEW GEAR
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { type, brand, model, format, serialNumber, notes } = req.body;
    if (!type || !brand || !model || !format) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const gear = new Gear({
      userId: req.user.userId,
      type,
      brand,
      model,
      format,
      serialNumber,
      notes
    });

    await gear.save();
    res.status(201).json(gear);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ce matériel existe déjà dans votre inventaire' });
    }
    res.status(500).json({ error: 'Erreur lors de la création du matériel' });
  }
});

// 3. UPDATE GEAR
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const gear = await Gear.findById(req.params.id);
    if (!gear) return res.status(404).json({ error: 'Matériel introuvable' });
    if (gear.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }

    const { type, brand, model, format, serialNumber, notes } = req.body;
    
    gear.type = type ?? gear.type;
    gear.brand = brand ?? gear.brand;
    gear.model = model ?? gear.model;
    gear.format = format ?? gear.format;
    gear.serialNumber = serialNumber !== undefined ? serialNumber : gear.serialNumber;
    gear.notes = notes !== undefined ? notes : gear.notes;

    await gear.save();
    res.json(gear);
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du matériel :', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ce matériel (marque & modèle) existe déjà dans votre inventaire.' });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour du matériel' });
  }
});

// 4. DELETE GEAR
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const gear = await Gear.findById(req.params.id);
    if (!gear) return res.status(404).json({ error: 'Matériel introuvable' });
    if (gear.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }

    await Gear.findByIdAndDelete(req.params.id);
    res.json({ message: 'Matériel supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du matériel' });
  }
});

export default router;
