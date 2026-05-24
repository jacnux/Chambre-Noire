// ============================================================
// LUMINAVIEW API — userPagesRoutes
// v2.3.1 — Mai 2026
// ============================================================

import { Router, Request, Response } from 'express';
import UserPage from '../models/UserPage';
import User from '../models/User';
import Photo from '../models/Photo';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const getSubdomainFromRequest = (req: Request) => {
  const host = req.hostname;
  const subdomains = req.subdomains || [];

  let subdomain = subdomains[0];

  if (!subdomain && host) {
    const parts = host.split('.');
    if (parts.length >= 3) subdomain = parts[0];
  }

  if (!subdomain || subdomain === 'www') return null;
  return subdomain;
};

const hydratePageAlbumsWithPhotos = async (page: any, ownerUserId: string) => {
  const pageObject = page.toObject();

  for (const section of pageObject.sections) {
    if ((section.type === 'gallery' || section.type === 'split_text_gallery') && section.albumIds) {
      for (const album of section.albumIds) {
        if (!album) continue;

        let photos: any[] = [];
        const selectFields = 'filename title description';

        if (album.isVirtual) {
          let query: any = {
            userId: ownerUserId,
          };

          if (album.virtualFilter === 'tag' && album.filterValue) {
            const tagsList = album.filterValue.split(',').map((t: string) => t.trim()).filter((t: string) => t);
            const positiveTags = tagsList.filter((t: string) => !t.startsWith('-'));
            const negativeTags = tagsList.filter((t: string) => t.startsWith('-')).map((t: string) => t.substring(1));

            if (positiveTags.length > 0) {
              query.tags = { $all: positiveTags };
              if (negativeTags.length > 0) query.tags.$nin = negativeTags;
            }
          } else if (album.virtualFilter === 'date') {
            query.createdAt = { $gte: album.startDate, $lte: album.endDate };
          }

          if (Object.keys(query).length > 1) {
            photos = await Photo.find(query).select(selectFields).sort({ createdAt: -1 });
          }
        } else {
          photos = await Photo.find({ albumId: album._id, userId: ownerUserId })
            .select(selectFields)
            .sort({ index: 1 });
        }

        album.photos = photos;
      }
    }
  }

  return pageObject;
};

// ==========================================
// PARTIE PRIVÉE (A METTRE EN PREMIER)
// ==========================================

router.get('/my/list', authenticateToken, async (req: Request, res: Response) => {
  try {
    const pages = await UserPage.find({ userId: req.user.userId })
      .select('title slug isPublished showOnBlog createdAt updatedAt')
      .sort({ updatedAt: -1 });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/my/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const page = await UserPage.findOne({ _id: req.params.id, userId: req.user.userId })
      .populate('sections.albumIds', 'title');
    if (!page) return res.status(404).json({ error: 'Page non trouvée' });
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/my/save', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, title, slug, sections, isPublished, showOnBlog, coverImage } = req.body;
    const userId = req.user.userId;

    if (!title || !slug) return res.status(400).json({ error: 'Titre et slug obligatoires' });

    const cleanSections = sections.map((s: any) => {
      const { _id, ...rest } = s;
      return rest;
    });

    const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (cleanSlug.length < 2) {
      return res.status(400).json({ error: 'Le slug doit contenir au moins 2 caractères.' });
    }

    if (id) {
      const updated = await UserPage.findOneAndUpdate(
        { _id: id, userId },
        { title, slug: cleanSlug, sections: cleanSections, isPublished, showOnBlog, coverImage },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Page non trouvée' });
      res.json(updated);
    } else {
      const newPage = new UserPage({ userId, title, slug: cleanSlug, sections: cleanSections, isPublished, showOnBlog, coverImage });
      await newPage.save();
      res.status(201).json(newPage);
    }
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Ce slug existe déjà pour cette page.' });
    }
    console.error('Erreur /my/save:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/my/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const deleted = await UserPage.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!deleted) return res.status(404).json({ error: 'Page non trouvée' });
    res.json({ message: 'Page supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==========================================
// PARTIE PUBLIQUE
// ==========================================

router.get('/public/subdomain/:slug', async (req: Request, res: Response) => {
  try {
    const subdomain = getSubdomainFromRequest(req);
    if (!subdomain) return res.status(400).json({ error: 'Sous-domaine invalide' });

    const user = await User.findOne({ name: { $regex: new RegExp(`^${subdomain}$`, 'i') } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const page = await UserPage.findOne({
      userId: user._id,
      slug: req.params.slug,
      $or: [{ isPublished: true }, { showOnBlog: true }],
    }).populate({
      path: 'sections.albumIds',
      model: 'Album',
      select: 'title coverImage isVirtual virtualFilter filterValue startDate endDate',
    });

    if (!page) return res.status(404).json({ error: 'Page non trouvée' });

    const pageObject = await hydratePageAlbumsWithPhotos(page, user._id.toString());
    res.json(pageObject);
  } catch (error) {
    console.error('Erreur backend subdomain:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:username', async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ name: { $regex: new RegExp(`^${req.params.username}$`, 'i') } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const pages = await UserPage.find({ userId: user._id, isPublished: true }).select('title slug');
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:username/:slug', async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ name: { $regex: new RegExp(`^${req.params.username}$`, 'i') } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const page = await UserPage.findOne({
      userId: user._id,
      slug: req.params.slug,
      $or: [{ isPublished: true }, { showOnBlog: true }],
    }).populate({
      path: 'sections.albumIds',
      model: 'Album',
      select: 'title coverImage isVirtual virtualFilter filterValue startDate endDate',
    });

    if (!page) return res.status(404).json({ error: 'Page non trouvée' });

    const pageObject = await hydratePageAlbumsWithPhotos(page, user._id.toString());
    res.json(pageObject);
  } catch (error) {
    console.error('Erreur backend:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
