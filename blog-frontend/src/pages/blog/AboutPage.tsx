import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { getBlogSlug } from '../../utils/getBlogSlug';
import { API_PREFIX } from '../../utils/blogApi';

const AboutPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const location = useLocation();
  const blogSlug = getBlogSlug(location.search);

  useEffect(() => {
    fetch(`${API_PREFIX}/user/${blogSlug}`)
      .then(res => res.json())
      .then(setProfile)
      .catch(console.error);
  }, [blogSlug]);

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">Chargement de la biographie...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col items-center text-center">
      {profile.avatar && (
        <div className="relative mb-6">
          <img 
            src={`/uploads/${profile.avatar}`} 
            alt={profile.name} 
            className="w-36 h-36 rounded-full object-cover shadow-xl border-4 border-white dark:border-slate-900 ring-4 ring-amber-500/20 dark:ring-amber-500/30 transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute inset-0 rounded-full border border-black/5 dark:border-white/5 pointer-events-none" />
        </div>
      )}
      
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white mb-6">
        {profile.name}
      </h2>
      
      <div className="w-full border-t border-black/[0.06] dark:border-white/[0.06] pt-8 mb-8 text-left">
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-light">
          <MarkdownRenderer className="prose">{profile.bio || 'Aucune biographie disponible pour le moment.'}</MarkdownRenderer>
        </div>
      </div>
      
      <Link 
        to={`/${location.search}`} 
        className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition duration-200"
      >
        <span className="transform group-hover:-translate-x-1 transition-transform duration-200">&larr;</span> Retour aux articles
      </Link>
    </div>
  );
};

export default AboutPage;
