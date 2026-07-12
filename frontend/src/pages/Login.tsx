import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // NOUVEAU

  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const res = await api.post('/auth/login', { email, password });

        // CORRECTION : Sauvegarder les DEUX valeurs
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        // Forcer le rechargement pour que AuthContext se mette à jour
        window.location.href = '/dashboard';
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erreur de connexion');
      }
    };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-accent">Connexion</h1>

        {error && <p className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-center text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 bg-surface p-6 rounded-xl border border-line">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-2 border border-line rounded-lg p-2 text-fg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-2 border border-line rounded-lg p-2 pr-10 text-fg"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full bg-accent hover:opacity-90 text-bg font-bold py-2 rounded-lg transition">
            Se connecter
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-accent hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
