import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false); // Nouvel état pour les CGU
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Vérification des CGU avant envoi
    if (!acceptedTerms) {
      setError("Vous devez accepter les Conditions Générales d'Utilisation pour vous inscrire.");
      return;
    }

    try {
      await api.post('/auth/register', { name, email, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    }
  };

  // --- VUE SUCCÈS (Après inscription) ---
  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-400 mb-4">Inscription réussie !</h2>
          <p className="text-gray-300 mb-6">
            Votre compte administrateur a été créé et activé avec succès.
            <br /><br />
            Vous pouvez maintenant vous connecter.
          </p>
          <Link
            to="/login"
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-2 rounded-full transition"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  // --- VUE FORMULAIRE ---
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-yellow-400">Créer un compte</h1>

        {error && <p className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-center text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white/5 p-6 rounded-xl border border-white/10">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* --- BLOC CGU --- */}
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-600 bg-black/30 text-yellow-500 focus:ring-yellow-500"
            />
            <label htmlFor="terms" className="cursor-pointer select-none">
              J'ai lu et j'accepte les{' '}
              <a
                href="/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:underline font-medium"
              >
                Conditions Générales d'Utilisation
              </a>.
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-2 rounded-lg transition mt-4"
          >
            S'inscrire
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-yellow-400 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
