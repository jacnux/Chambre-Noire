import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getBlogSlug } from '../../utils/getBlogSlug';
import { getMainAppUrl, API_PREFIX } from '../../utils/blogApi';

const Footer: React.FC = () => {
  const location = useLocation();
  const blogName = getBlogSlug(location.search);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const s = location.search;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_PREFIX}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, blogSlug: blogName })
      });
      setSubscribed(true);
    } catch {
      alert('Erreur lors de l\'abonnement');
    }
  };

  return (
    <footer className="w-full bg-white dark:bg-gray-950 border-t border-black/[0.06] dark:border-white/[0.06] py-12 px-6 mt-auto transition-colors duration-300">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
        
        {/* Colonne 1: Branding et copyright */}
        <div className="flex flex-col gap-2">
          <Link to={`/${s}`} className="text-base font-bold tracking-wider text-gray-950 dark:text-white hover:opacity-85 transition duration-200">
            HELIOSCOPE <span className="text-amber-600 dark:text-amber-500 font-medium">/ {blogName.toUpperCase()}</span>
          </Link>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Un espace de publication dédié à la photographie et aux expositions.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            © {new Date().getFullYear()} Hélioscope. Tous droits réservés.
          </p>
        </div>

        {/* Colonne 2: Navigation rapide */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-200 mb-1">Navigation</h4>
          <div className="flex flex-col gap-2">
            <Link to={`/about${s}`} className="text-xs text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Biographie</Link>
            <Link to={`/contact${s}`} className="text-xs text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Nous contacter</Link>
            <a href={`${getMainAppUrl()}/legal`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Mentions Légales</a>
          </div>
        </div>

        {/* Colonne 3: Newsletter dédiée et discrète */}
        <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-slate-900/40 rounded-xl border border-black/[0.04] dark:border-white/[0.04]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-200">Newsletter</h4>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-normal">
            Recevez un e-mail à chaque nouvelle publication.
          </p>
          
          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="flex gap-2 mt-1">
              <input
                type="email" 
                placeholder="Votre adresse email" 
                value={email} 
                required
                onChange={e => setEmail(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-slate-950 text-gray-950 dark:text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button 
                type="submit" 
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-amber-700 dark:hover:bg-amber-400 transition-colors whitespace-nowrap"
              >
                S'abonner
              </button>
            </form>
          ) : (
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1.5 mt-1">
              <span>✓</span> Abonné avec succès !
            </p>
          )}
        </div>

      </div>
    </footer>
  );
};

export default Footer;
