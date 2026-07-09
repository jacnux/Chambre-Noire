import express, { Request, Response } from 'express';
import Project from '../models/Project';
import Photo from '../models/Photo';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Helper to generate a slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')     // replace non-alphanumeric with hyphen
    .replace(/(^-|-$)/g, '');        // trim leading/trailing hyphens
};

// 1. GET ALL PROJECTS FOR USER
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const projects = await Project.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des projets' });
  }
});

// 2. GET SINGLE PROJECT DETAILS (AND ITS PHOTOS)
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Projet introuvable' });
    if (project.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }

    const photos = await Photo.find({ projectId: project._id }).sort({ index: 1, createdAt: 1 });
    res.json({ project, photos });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du détail du projet' });
  }
});

// 3. CREATE NEW PROJECT
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, description, isPublished, coverImage, makingOf } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Le nom du projet est obligatoire' });
    }

    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // S'assurer de l'unicité du slug pour cet utilisateur
    while (await Project.findOne({ userId: req.user.userId, slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const project = new Project({
      userId: req.user.userId,
      name,
      description: description || '',
      slug,
      isPublished: isPublished ?? false,
      coverImage,
      makingOf: makingOf || ''
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du projet' });
  }
});

// 4. UPDATE PROJECT
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Projet introuvable' });
    if (project.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }

    const { name, description, isPublished, coverImage, makingOf } = req.body;

    if (name && name !== project.name) {
      const baseSlug = generateSlug(name);
      let slug = baseSlug;
      let counter = 1;

      while (await Project.findOne({ userId: req.user.userId, slug, _id: { $ne: project._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      project.name = name;
      project.slug = slug;
    }

    project.description = description ?? project.description;
    project.isPublished = isPublished ?? project.isPublished;
    project.coverImage = coverImage !== undefined ? coverImage : project.coverImage;
    if (makingOf !== undefined) project.makingOf = makingOf;

    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du projet' });
  }
});

// 5. DELETE PROJECT
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Projet introuvable' });
    if (project.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }

    // Supprimer la référence de projet dans toutes les photos associées
    await Photo.updateMany({ projectId: project._id }, { $set: { projectId: null } });

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Projet supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du projet' });
  }
});

export default router;
