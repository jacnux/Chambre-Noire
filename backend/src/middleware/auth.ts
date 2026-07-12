import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Étendre l'interface Request pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // 1. Récupérer le token (Header Authorization: Bearer token)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Accès refusé. Token manquant.' });

  // 2. Vérifier le token
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Configuration du serveur incomplète (JWT_SECRET manquant).' });
  }

  jwt.verify(token, secret, (err, user) => {
    if (err) {
        console.error("Erreur vérification token:", err.message);
        return res.status(403).json({ error: 'Token invalide ou expiré.' });
    }

    req.user = user;
    next();
  });
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Accès admin requis.' });
  }
  next();
};
