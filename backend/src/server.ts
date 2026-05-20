// ============================================================
// LUMINAVIEW API — server.ts
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
import reportRoutes    from './routes/reportRoutes';
import userPagesRoutes from './routes/userPagesRoutes';
import commentRoutes from './routes/commentRoutes';



// ============================================================
// INITIALISATION
// ============================================================

const app  = express();
const PORT = 3000;

app.set('trust proxy', 1);


// ============================================================
// SÉCURITÉ
// ============================================================

app.use(helmet());
app.use(hpp());
app.use(mongoSanitize());

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
app.use('/api/reports',    apiLimiter);
app.use('/api/user-pages', apiLimiter);
app.use('/api/comments', apiLimiter);


// ============================================================
// MIDDLEWARE GÉNÉRAL
// ============================================================

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

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
app.use('/api/reports',    reportRoutes);
app.use('/api/user-pages', userPagesRoutes);
app.use('/api/comments', commentRoutes);


// ============================================================
// DÉMARRAGE
// ============================================================

app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 LuminaView API running on port ${PORT}`)
);
