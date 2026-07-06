// ============================================================
// BLOG ENGINE — server.ts
// ============================================================

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { sendNewPostNotification } from './services/newsletterService';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());


// ============================================================
// CONNEXIONS MONGODB
// ============================================================

// Base blog (posts, commentaires, abonnés)
mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/helioscope_blogs')
  .then(() => console.log('✅ Blog MongoDB connecté'))
  .catch(err => console.error('❌ Blog MongoDB erreur:', err));

// Base principale Luminaview (lecture seule — users, pages)
const mainConn = mongoose.createConnection(
  process.env.MAIN_MONGO_URI || 'mongodb://mongo:27017/luminaview'
);


// ============================================================
// MODÈLES — Base principale (lecture seule)
// ============================================================

const MainUser = mainConn.model('User', new mongoose.Schema({
  name:    String,
  email:   String,
  avatar:  String,
  bio:     String,
  servicesDescription: String,
  isAdmin: Boolean
}, { collection: 'users' }));

const MainUserPage = mainConn.model('UserPage', new mongoose.Schema({
  userId:      mongoose.Schema.Types.ObjectId,
  title:       String,
  slug:        String,
  coverImage:  String,
  isPublished: Boolean,
  showOnBlog:  Boolean
  // 'sections' volontairement omis pour alléger les requêtes liste
}, { collection: 'userpages' }));


// ============================================================
// MODÈLES — Base blog
// ============================================================

const Post = mongoose.model('Post', new mongoose.Schema({
  title:     String,
  content:   String,
  slug:      String,
  blogSlug:  String,
  createdAt: { type: Date, default: Date.now }
}));

const Comment = mongoose.model('Comment', new mongoose.Schema({
  postId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  name:       { type: String, required: true },
  email:      { type: String, required: true },
  content:    { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  createdAt:  { type: Date, default: Date.now }
}));

const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', new mongoose.Schema({
  email:     { type: String, required: true, unique: true },
  blogSlug:  { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}));


// ============================================================
// MIDDLEWARE — Authentification JWT
// ============================================================

const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user;
    next();
  });
};


// ============================================================
// EMAIL — Transporter SMTP
// ============================================================

const transporterOptions: any = {
  host:   process.env.SMTP_HOST || 'localhost',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
};
if (process.env.SMTP_USER) {
  transporterOptions.auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  };
}
const transporter = nodemailer.createTransport(transporterOptions);


// ============================================================
// ROUTES — Utilisateur (profil public blog)
// ============================================================

// GET /api/user/:slug — Profil + pages marquées "showOnBlog"
app.get('/api/user/:slug', async (req: Request, res: Response) => {
  try {
    const user = await MainUser.findOne({
      name: { $regex: new RegExp(`^${req.params.slug}$`, 'i') }
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const pages = await MainUserPage.find({
      userId: user._id,
      showOnBlog: true
    }).select('title slug coverImage');

    res.json({
      name:                user.name,
      avatar:              user.avatar,
      bio:                 user.bio,
      servicesDescription: user.servicesDescription,
      showcaseAlbums:      pages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// ============================================================
// ROUTES — Articles (Posts)
// ============================================================

// GET /api/posts?blog=slug — Liste des articles (optionnel : filtrer par blog)
app.get('/api/posts', async (req: Request, res: Response) => {
  try {
    const { blog } = req.query;
    const posts = await Post.find(blog ? { blogSlug: blog } : {}).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/posts/:slug — Un article par slug
app.get('/api/posts/:slug', async (req: Request, res: Response) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug });
    if (!post) return res.status(404).json({ error: 'Article non trouvé' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/posts — Créer un article + notifier les abonnés
app.post('/api/posts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, content, slug, blogSlug } = req.body;
    if (!blogSlug) return res.status(400).json({ error: 'blogSlug manquant' });

    const newPost = await new Post({ title, content, slug, blogSlug }).save();
    console.log(`[POSTS] Article créé : ${title}`);

    const subscribers = await NewsletterSubscriber.find({ blogSlug });
    if (subscribers.length > 0) {
      console.log(`[NEWSLETTER] Envoi à ${subscribers.length} abonné(s)...`);
      await sendNewPostNotification(subscribers, newPost);
    }

    res.status(201).json(newPost);
  } catch (error) {
    console.error('[POSTS] Erreur création:', error);
    res.status(500).json({ error: 'Erreur création' });
  }
});

// PUT /api/posts/:id — Modifier un article
app.put('/api/posts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, content, slug, blogSlug } = req.body;
    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      { title, content, slug, blogSlug },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Article non trouvé' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour' });
  }
});

// DELETE /api/posts/:id — Supprimer un article
app.delete('/api/posts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Article supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression' });
  }
});


// ============================================================
// ROUTES — Contact
// ============================================================

// POST /api/contact — Envoie un email au propriétaire du blog
app.post('/api/contact', async (req: Request, res: Response) => {
  try {
    const { blogSlug, name, email, message } = req.body;
    const owner = await MainUser.findOne({
      name: { $regex: new RegExp(`^${blogSlug}$`, 'i') }
    });
    if (!owner?.email) return res.status(404).json({ error: 'Destinataire introuvable' });

    await transporter.sendMail({
      from:    process.env.SMTP_FROM,
      to:      owner.email,
      subject: `📩 Nouveau message de ${name}`,
      html:    `<p>${message}</p><p>De : ${name} (${email})</p>`
    });
    res.json({ message: 'Message envoyé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur envoi email' });
  }
});


// ============================================================
// ROUTES — Commentaires
// ============================================================

// POST /api/comments — Soumettre un commentaire (en attente de modération)
app.post('/api/comments', async (req: Request, res: Response) => {
  try {
    const { postId, name, content } = req.body;
    await new Comment({ postId, name, email: 'anonyme', content }).save();
    res.status(201).json({ message: 'Commentaire en attente de modération' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/comments/post/:postId — Commentaires approuvés d'un article
app.get('/api/comments/post/:postId', async (req: Request, res: Response) => {
  try {
    res.json(await Comment.find({ postId: req.params.postId, isApproved: true }));
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/comments/pending — Commentaires en attente (admin ou propriétaire)
app.get('/api/comments/pending', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await MainUser.findById((req as any).user?.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    let query: any = { isApproved: false };
    if (!user.isAdmin) {
      const postIds = (await Post.find({ blogSlug: user.name.toLowerCase() }).select('_id'))
        .map(p => p._id);
      query.postId = { $in: postIds };
    }

    res.json(await Comment.find(query).populate('postId', 'title'));
  } catch (error) {
    console.error('[COMMENTS] Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/comments/:id/approve — Approuver un commentaire
app.patch('/api/comments/:id/approve', authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json(await Comment.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true }));
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/comments/:id — Supprimer un commentaire
app.delete('/api/comments/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Commentaire supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// ============================================================
// ROUTES — Newsletter
// ============================================================

// POST /api/subscribe — S'abonner au blog
app.post('/api/subscribe', async (req: Request, res: Response) => {
  try {
    const { email, blogSlug } = req.body;
    if (await NewsletterSubscriber.findOne({ email, blogSlug })) {
      return res.json({ message: 'Déjà abonné' });
    }
    await new NewsletterSubscriber({ email, blogSlug }).save();
    res.status(201).json({ message: 'Abonnement confirmé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// ============================================================
// DÉMARRAGE
// ============================================================

app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Blog Engine running on port ${PORT}`)
);
