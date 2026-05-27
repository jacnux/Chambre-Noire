// ============================================================
// LUMINAVIEW API — userPagesRoutes
// v2.4.1 — Mai 2026
// ============================================================

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import UserPage from '../models/UserPage';
import User from '../models/User';
import Photo from '../models/Photo';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const MENU_GROUPS = ['none', 'series', 'exhibitions', 'blog', 'about'] as const;
type MenuGroup = typeof MENU_GROUPS[number];

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

const normalizeMenuGroup = (value: unknown): MenuGroup => {
  return MENU_GROUPS.includes(value as MenuGroup) ? (value as MenuGroup) : 'none';
};

const normalizeObjectId = (value: unknown) => {
  if (!value || typeof value !== 'string') return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
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
          const query: any = { userId: ownerUserId };

          if (album.virtualFilter === 'tag' && album.filterValue) {
            const tagsList = album.filterValue
              .split(',')
              .map((t: string) => t.trim())
              .filter((t: string) => t);
            const positiveTags = tagsList.filter((t: string) => !t.startsWith('-'));
            const negativeTags = tagsList
              .filter((t: string) => t.startsWith('-'))
              .map((t: string) => t.substring(1));

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

const getPublicChildPages = async (pageId: string, userId: string) => {
  return UserPage.find({
    userId,
    parentPageId: pageId,
    showInMenu: true,
    $or: [{ isPublished: true }, { showOnBlog: true }],
  })
    .select('title slug coverImage menuGroup menuOrder showInMenu parentPageId')
    .sort({ menuOrder: 1, title: 1 });
};

// ==========================================
// PARTIE PRIVÉE
// ==========================================

router.get('/my/list', authenticateToken, async (req: Request, res: Response) => {
  try {
    const pages = await UserPage.find({ userId: req.user.userId })
      .select('title slug isPublished showOnBlog menuGroup parentPageId menuOrder showInMenu createdAt updatedAt')
      .populate('parentPageId', 'title slug')
      .sort({ updatedAt: -1 });

    res.json(pages);
  } catch (error) {
    console.error('Erreur /my/list:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/my/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const page = await UserPage.findOne({ _id: req.params.id, userId: req.user.userId })
      .populate('sections.albumIds', 'title')
      .populate('parentPageId', 'title slug');

    if (!page) return res.status(404).json({ error: 'Page non trouvée' });
    res.json(page);
  } catch (error) {
    console.error('Erreur /my/:id:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/my/save', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      id,
      title,
      slug,
      sections,
      isPublished,
      showOnBlog,
      coverImage,
      menuGroup,
      parentPageId,
      menuOrder,
      showInMenu,
    } = req.body;

    const userId = req.user.userId;

    if (!title || !slug) {
      return res.status(400).json({ error: 'Titre et slug obligatoires' });
    }

    const cleanSections = Array.isArray(sections)
      ? sections.map((s: any) => {
          const { _id, ...rest } = s;
          return rest;
        })
      : [];

    const cleanSlug = String(slug)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    if (cleanSlug.length < 2) {
      return res.status(400).json({ error: 'Le slug doit contenir au moins 2 caractères.' });
    }

    const cleanMenuGroup = normalizeMenuGroup(menuGroup);
    const cleanParentPageId = normalizeObjectId(parentPageId);
    const cleanMenuOrder = Number.isFinite(Number(menuOrder)) ? Number(menuOrder) : 0;
    const cleanShowInMenu = Boolean(showInMenu);
    const cleanShowOnBlog = Boolean(showOnBlog);

    if (cleanParentPageId) {
      const parentPage = await UserPage.findOne({ _id: cleanParentPageId, userId }).select('menuGroup');

      if (!parentPage) {
        return res.status(400).json({ error: 'Page parente invalide.' });
      }

      if (!['series', 'exhibitions'].includes(cleanMenuGroup)) {
        return res.status(400).json({ error: 'Une page parente n\'est autorisée que pour Séries ou Expositions.' });
      }

      if (parentPage.menuGroup !== cleanMenuGroup) {
        return res.status(400).json({ error: 'La page parente doit appartenir à la même section du menu.' });
      }
    }

    const payload = {
      title,
      slug: cleanSlug,
      sections: cleanSections,
      isPublished: Boolean(isPublished),
      showOnBlog: cleanShowOnBlog,
      coverImage,
      menuGroup: cleanMenuGroup,
      parentPageId: cleanParentPageId,
      menuOrder: cleanMenuOrder,
      showInMenu: cleanShowInMenu,
    };

    if (id) {
      const updated = await UserPage.findOneAndUpdate({ _id: id, userId }, payload, { new: true });
      if (!updated) return res.status(404).json({ error: 'Page non trouvée' });
      res.json(updated);
    } else {
      const newPage = new UserPage({ userId, ...payload });
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
    console.error('Erreur suppression page:', error);
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
    })
      .populate({
        path: 'sections.albumIds',
        model: 'Album',
        select: 'title coverImage isVirtual virtualFilter filterValue startDate endDate',
      })
      .populate('parentPageId', 'title slug menuGroup');

    if (!page) return res.status(404).json({ error: 'Page non trouvée' });

    const pageObject = await hydratePageAlbumsWithPhotos(page, user._id.toString());
    pageObject.childPages = await getPublicChildPages(page._id.toString(), user._id.toString());
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

    const pages = await UserPage.find({ userId: user._id, isPublished: true })
      .select('title slug coverImage menuGroup parentPageId menuOrder showInMenu showOnBlog')
      .populate('parentPageId', 'title slug')
      .sort({ menuOrder: 1, title: 1 });

    res.json(pages);
  } catch (error) {
    console.error('Erreur /:username:', error);
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
    })
      .populate({
        path: 'sections.albumIds',
        model: 'Album',
        select: 'title coverImage isVirtual virtualFilter filterValue startDate endDate',
      })
      .populate('parentPageId', 'title slug menuGroup');

    if (!page) return res.status(404).json({ error: 'Page non trouvée' });

    const pageObject = await hydratePageAlbumsWithPhotos(page, user._id.toString());
    pageObject.childPages = await getPublicChildPages(page._id.toString(), user._id.toString());
    res.json(pageObject);
  } catch (error) {
    console.error('Erreur backend:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
