import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getBlogSlug } from '../../utils/getBlogSlug';
import { API_PREFIX, getMainAppUrl } from '../../utils/blogApi';

const GalleryPage: React.FC = () => {
  const [pages, setPages] = useState<any[]>([]);
  const location = useLocation();
  const blogSlug = getBlogSlug(location.search);

  useEffect(() => {
    fetch(`${API_PREFIX}/user/${blogSlug}`)
      .then(res => res.json())
      .then(data => setPages(data.showcaseAlbums || []))
      .catch(console.error);
  }, [blogSlug]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-6 mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white">Galeries</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Découvrez mes séries photographiques et mes expositions</p>
        </div>
        <Link 
          to={`/${location.search}`} 
          className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition duration-200"
        >
          <span className="transform group-hover:-translate-x-1 transition-transform duration-200">&larr;</span> Retour
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {pages.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-gray-500 dark:text-gray-400">Aucune galerie n'est actuellement publiée.</p>
          </div>
        )}
        {pages.map((page: any) => (
          <a key={page._id}
            href={`${getMainAppUrl()}/portfolio/${blogSlug}/${page.slug}`}
            className="group block bg-white dark:bg-slate-900/60 border border-black/[0.06] dark:border-white/[0.06] rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <div className="h-56 overflow-hidden relative bg-gray-100 dark:bg-slate-950">
              {page.coverImage ? (
                <img 
                  src={`/uploads/${page.coverImage}`} 
                  alt={page.title} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/5 to-amber-600/5 dark:from-amber-950/10 dark:to-amber-950/5">
                  <span className="text-2xl">📷</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/5 dark:bg-black/10" />
            </div>
            <div className="p-5 text-center border-t border-black/[0.04] dark:border-white/[0.04]">
              <h3 className="font-bold text-sm md:text-base text-gray-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200">
                {page.title}
              </h3>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default GalleryPage;
