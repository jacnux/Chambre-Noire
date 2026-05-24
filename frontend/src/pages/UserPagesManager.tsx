// ===========================================
// luminaview
//         UserPageManager
//
//     Mai 2026 v2.3.0
// ===========================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useTheme } from '../context/ThemeContext';

const UserPagesManager = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      setPages(pages.filter(p => p._id !== id));
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

  const shellTextClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedTextClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const emptyTextClass = theme === 'dark' ? 'text-gray-500' : 'text-gray-500';
  const cardClass = theme === 'dark'
    ? 'bg-gray-800/70 border border-gray-700 backdrop-blur-xl'
    : 'bg-white/90 border border-gray-200 backdrop-blur-xl shadow-sm';
  const shareButtonClass = theme === 'dark'
    ? 'bg-gray-700 hover:bg-gray-600 text-white'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-900';

  if (loading) {
    return <div className={`p-8 ${shellTextClass}`}>Chargement...</div>;
  }

  return (
    <div className={`w-full ${shellTextClass}`}>
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-yellow-500">Mes Pages</h1>
          <Link
            to="/dashboard/pages/new"
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold transition"
          >
            + Nouvelle Page
          </Link>
        </div>

        {pages.length === 0 ? (
          <p className={`text-center ${emptyTextClass}`}>Aucune page créée.</p>
        ) : (
          <div className="space-y-4">
            {pages.map(page => (
              <div
                key={page._id}
                className={`p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${cardClass}`}
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">{page.title}</h2>
                  <p className={`text-sm ${mutedTextClass}`}>/{page.slug}</p>

                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        page.isPublished
                          ? 'bg-green-700 text-green-100'
                          : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {page.isPublished ? '✓ Portfolio' : '✕ Portfolio'}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        page.showOnBlog
                          ? 'bg-blue-700 text-blue-100'
                          : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {page.showOnBlog ? '✓ Blog' : '✕ Blog'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
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
