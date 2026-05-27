// ===========================================
// luminaview
//         UserPagesManager
//
//     Mai 2026 v2.5.0
// ===========================================

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useTheme } from '../context/ThemeContext';

type PageSortMode = 'az' | 'za' | null;

type MenuGroup = 'none' | 'series' | 'exhibitions' | 'blog' | 'about';

const MENU_GROUP_LABELS: Record<MenuGroup, string> = {
  none: 'Aucune',
  series: 'Séries',
  exhibitions: 'Expositions',
  blog: 'Blog',
  about: 'À propos',
};

const UserPagesManager = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSortAZ, setPageSortAZ] = useState<PageSortMode>(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const userStorage = localStorage.getItem('user');
  const userObject = userStorage ? JSON.parse(userStorage) : null;
  const username = userObject?.name || 'inconnu';

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await api.get('/user-pages/my/list');
      setPages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Supprimer "${title}" ?`)) return;
    try {
      await api.delete(`/user-pages/my/${id}`);
      setPages(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      alert('Erreur suppression');
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/portfolio/${username}/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Lien copié !\n\n' + url);
    });
  };

  const sortedPages = useMemo(() => {
    if (!pageSortAZ) return pages;
    const copy = [...pages];
    return pageSortAZ === 'az'
      ? copy.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' }))
      : copy.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'fr', { sensitivity: 'base' }));
  }, [pages, pageSortAZ]);

  const shellTextClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedTextClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const emptyTextClass = 'text-gray-500';
  const cardClass = theme === 'dark'
    ? 'bg-gray-800/70 border border-gray-700 backdrop-blur-xl'
    : 'bg-white/90 border border-gray-200 backdrop-blur-xl shadow-sm';
  const shareButtonClass = theme === 'dark'
    ? 'bg-gray-700 hover:bg-gray-600 text-white'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-900';
  const sortButtonClass = pageSortAZ
    ? 'bg-green-600 hover:bg-green-500 text-white'
    : theme === 'dark'
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-700';

  const neutralBadgeClass = theme === 'dark'
    ? 'bg-gray-700 text-gray-300'
    : 'bg-gray-200 text-gray-700';

  const getMenuGroupLabel = (group?: string) => {
    const key = (group || 'none') as MenuGroup;
    return MENU_GROUP_LABELS[key] || 'Aucune';
  };

  if (loading) {
    return <div className={`p-8 ${shellTextClass}`}>Chargement...</div>;
  }

  return (
    <div className={`w-full ${shellTextClass}`}>
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <h1 className="text-3xl font-bold text-yellow-500">Mes Pages</h1>
          <div className="flex gap-2 items-center flex-wrap">
            <button
              type="button"
              onClick={() => setPageSortAZ(v => {
                if (v === null) return 'az';
                if (v === 'az') return 'za';
                return null;
              })}
              className={`text-sm px-3 py-2 rounded font-medium transition ${sortButtonClass}`}
              title={
                pageSortAZ === 'az'
                  ? 'Basculer Z→A'
                  : pageSortAZ === 'za'
                    ? 'Retour ordre par défaut'
                    : 'Trier A→Z'
              }
            >
              {pageSortAZ === 'az' ? '🔤 Z→A' : pageSortAZ === 'za' ? '↺ Défaut' : '🔤 A→Z'}
            </button>
            <Link
              to="/dashboard/pages/new"
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold transition"
            >
              + Nouvelle Page
            </Link>
          </div>
        </div>

        {sortedPages.length === 0 ? (
          <p className={`text-center ${emptyTextClass}`}>Aucune page créée.</p>
        ) : (
          <div className="space-y-4">
            {sortedPages.map(page => (
              <div
                key={page._id}
                className={`p-4 rounded-lg flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${cardClass}`}
              >
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold truncate">{page.title}</h2>
                      <p className={`text-sm ${mutedTextClass}`}>/{page.slug}</p>
                    </div>
                    <div className="text-sm text-right">
                      <p className={mutedTextClass}>Ordre menu : <span className="font-semibold">{page.menuOrder ?? 0}</span></p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded ${page.isPublished ? 'bg-green-700 text-green-100' : neutralBadgeClass}`}>
                      {page.isPublished ? '✓ Portfolio' : '✕ Portfolio'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${page.showOnBlog ? 'bg-blue-700 text-blue-100' : neutralBadgeClass}`}>
                      {page.showOnBlog ? '✓ Blog' : '✕ Blog'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${page.showInMenu ? 'bg-yellow-700 text-yellow-100' : neutralBadgeClass}`}>
                      {page.showInMenu ? '✓ Menu' : '✕ Menu'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${neutralBadgeClass}`}>
                      Section : {getMenuGroupLabel(page.menuGroup)}
                    </span>
                    {page.parentPageId?.title && (
                      <span className={`text-xs px-2 py-1 rounded ${neutralBadgeClass}`}>
                        Parent : {page.parentPageId.title}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap justify-end w-full lg:w-auto">
                  <button
                    onClick={() => copyLink(page.slug)}
                    className={`px-3 py-1 rounded text-sm transition ${shareButtonClass}`}
                  >
                    Partager
                  </button>
                  <a
                    href={`/portfolio/${username}/${page.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`px-3 py-1 rounded text-sm transition ${shareButtonClass}`}
                  >
                    Voir
                  </a>
                  <Link
                    to={`/dashboard/pages/edit/${page._id}`}
                    className="bg-yellow-500 hover:bg-yellow-400 px-3 py-1 rounded text-sm text-black font-bold transition"
                  >
                    Modifier
                  </Link>
                  <button
                    onClick={() => handleDelete(page._id, page.title)}
                    className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm text-white transition"
                  >
                    Suppr.
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPagesManager;
