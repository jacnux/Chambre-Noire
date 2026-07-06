import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { getBlogSlug } from '../../utils/getBlogSlug';
import { API_PREFIX } from '../../utils/blogApi';

const NouveautesPage: React.FC = () => {
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
        <p className="text-gray-500 dark:text-gray-400 text-sm">Chargement des nouveautés...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col items-center text-center">
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white mb-6">
        Nouveautés
      </h2>
      
      <div className="w-full border-t border-black/[0.06] dark:border-white/[0.06] pt-8 mb-8 text-left">
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-light">
          <MarkdownRenderer className="prose">{profile.servicesDescription || "Aucune nouveauté ou information de service disponible pour le moment."}</MarkdownRenderer>
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

export default NouveautesPage;
