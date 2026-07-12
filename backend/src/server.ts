// ============================================================
// CHAMBRE NOIRE API — server.ts
// v4.2 — Mai 2026
// ============================================================

import express    from 'express';
import mongoose   from 'mongoose';
import cors       from 'cors';
import helmet     from 'helmet';
import rateLimit  from 'express-rate-limit';
import hpp        from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';

import authRoutes      from './routes/authRoutes';
import albumRoutes     from './routes/albumRoutes';
import photoRoutes     from './routes/photoRoutes';
import adminRoutes     from './routes/adminRoutes';
import userRoutes      from './routes/userRoutes';
import gearRoutes from './routes/gearRoutes';
import filmRoutes from './routes/filmRoutes';
import projectRoutes from './routes/projectRoutes';



// ============================================================
// INITIALISATION
// ============================================================

const app  = express();
const PORT = 3000;

app.set('trust proxy', 1);

// ── Vérification de la configuration critique (JWT_SECRET) ──
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET non défini en production — arrêt du serveur.');
  process.exit(1);
}


// ============================================================
// SÉCURITÉ
// ============================================================

app.use(helmet());
app.use(hpp());
app.use(mongoSanitize());

// ── HSTS (production uniquement) ──
if (process.env.NODE_ENV === 'production') {
  app.use((_req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    next();
  });
}

// ── Rate limiter AUTH : anti brute-force login uniquement ──
// 20 tentatives max par 15 minutes, indépendant du reste
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Trop de tentatives de connexion, réessayez dans 15 minutes.'
});
app.use('/api/auth/', authLimiter);

// ── Rate limiter API général : photos, albums, pages... ──
// 200 req/15min — suffisant pour les opérations en masse (déplacements)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.'
});
app.use('/api/albums',     apiLimiter);
app.use('/api/photos',     apiLimiter);
app.use('/api/admin',      apiLimiter);
app.use('/api/users',      apiLimiter);
app.use('/api/gear', apiLimiter);
app.use('/api/films', apiLimiter);
app.use('/api/projects', apiLimiter);


// ============================================================
// MIDDLEWARE GÉNÉRAL
// ============================================================

// CORS : strict en production (origine configurée), permissif en dev
const corsOptions = process.env.NODE_ENV === 'production'
  ? { origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : false }
  : { origin: true };
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Les fichiers uploadés sont servis en statique. Les noms sont non devinables
// (Date.now()) et les SVG sont bloqués à l'upload (voir routes). Une protection
// par authentification complète de /uploads nécessiterait une auth par cookie
// (voir plan-correctifs §C8).
app.use('/uploads', express.static('/app/uploads'));


// ============================================================
// BASE DE DONNÉES
// ============================================================

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://mongo:27017/luminaview')
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ MongoDB erreur:', err));


// ============================================================
// ROUTES
// ============================================================

app.use('/api/auth',       authRoutes);
app.use('/api/albums',     albumRoutes);
app.use('/api/photos',     photoRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/gear', gearRoutes);
app.use('/api/films', filmRoutes);
app.use('/api/projects', projectRoutes);

// ============================================================
// GESTION CENTRALISÉE DES ERREURS
// ============================================================
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});


// ============================================================
// DÉMARRAGE
// ============================================================

app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Chambre Noire API running on port ${PORT}`)
);
