// ============================================================
// CHAMBRE NOIRE — Dashboard.tsx
// Gestion des albums / galeries
// version v2.3.8
// tri alphabétique minimal A→Z / Z→A / défaut
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import EditAlbumModal from '../components/EditAlbumModal';

type ViewMode = 'grid' | 'list';

type DeleteAlbumResponse = {
  message: string;
  deletedPhotos?: number;
  freedBytes?: number;
};

const getWpShortcode = (id: string) => `[luminaview id="${id}" autostart="true"]`;
const getPublicLink = (id: string) => `${window.location.origin}/album/${id}?mode=viewer`;

const formatBytes = (bytes: number = 0) => {
  if (!bytes) return '0 octet';
  const units = ['octets', 'Ko', 'Mo', 'Go'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const rounded =
    value >= 10 || unitIndex === 0 ? Math.round(value) : Number(value.toFixed(1));
  return `${rounded} ${units[unitIndex]}`;
};

const copyToClipboard = (text: string, label: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(() => alert(`${label} copié !`))
      .catch(() => alert('Erreur de copie'));
  } else {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    alert(`${label} copié !`);
  }
};

const IconGrid = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

const IconList = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 10h16M4 14h16M4 18h16"
    />
  </svg>
);

const AlbumCardGrid = ({
  album,
  onEdit,
  onDelete,
  onShare,
  onToggleVisibility,
  onToggleFeatured,
}: any) => (
  <div className="bg-white/10 dark:bg-gray-800/60 backdrop-blur-lg border border-white/20 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden hover:bg-white/20 dark:hover:bg-gray-700/60 transition transform hover:-translate-y-1 flex flex-col">
    <div className="aspect-square w-full bg-black/20 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
      {album.coverImage ? (
        <img
          src={`/uploads/${album.coverImage}`}
          alt="Cover"
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white/50 text-5xl">📷</span>
      )}
    </div>

    <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
      <div>
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-white truncate drop-shadow">
          {album.title}
        </h2>
        <p className="text-gray-300 text-xs sm:text-sm mb-4 line-clamp-2">
          {album.description}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-white/10 gap-2">
        <Link
          to={`/album/${album._id}`}
          className="text-blue-300 font-semibold hover:text-blue-100 hover:underline text-sm drop-shadow"
        >
          Voir l'album
        </Link>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => onToggleVisibility(album._id, album.isPublic)}
            className={`text-xs font-bold uppercase tracking-wide transition ${
              album.isPublic !== false ? 'text-green-300' : 'text-gray-500'
            }`}
          >
            {album.isPublic !== false ? '👁️ Public' : '🔒 Privé'}
          </button>
          <button
            onClick={() => onToggleFeatured(album._id, album.isFeatured)}
            title={
              album.isFeatured
                ? 'Retirer du portfolio'
                : 'Mettre en avant sur le portfolio'
            }
            className={`text-xs font-bold uppercase tracking-wide transition ${
              album.isFeatured ? 'text-yellow-400' : 'text-gray-500'
            }`}
          >
            {album.isFeatured ? '⭐ Portfolio' : '☆ Portfolio'}
          </button>
          <button
            onClick={() => onEdit(album)}
            className="text-indigo-300 hover:text-indigo-100 font-medium text-sm transition"
          >
            Modifier
          </button>
          {album.isPublic !== false && (
            <button
              onClick={() => onShare(album)}
              className="text-purple-300 hover:text-purple-100 text-xs font-bold uppercase tracking-wide transition"
            >
              🔗 Partager
            </button>
          )}
          <button
            onClick={() => onDelete(album)}
            className="text-red-300 hover:text-red-100 text-sm transition"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
);

const AlbumCardList = ({
  album,
  onEdit,
  onDelete,
  onShare,
  onToggleFeatured,
}: any) => (
  <div className="bg-white/5 dark:bg-gray-800/40 backdrop-blur border border-white/10 dark:border-gray-700 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition group">
    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-black/20">
      {album.coverImage ? (
        <img
          src={`/uploads/${album.coverImage}`}
          alt="Cover"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-2xl">
          📷
        </div>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-white truncate">{album.title}</h3>
      <p className="text-xs text-gray-400 truncate">
        {album.description || 'Aucune description'}
      </p>
      <span
        className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded ${
          album.isPublic !== false
            ? 'bg-green-500/20 text-green-300'
            : 'bg-gray-500/20 text-gray-400'
        }`}
      >
        {album.isPublic !== false ? 'Public' : 'Privé'}
      </span>
    </div>

    <div className="flex items-center gap-3 opacity-50 group-hover:opacity-100 transition">
      <Link
        to={`/album/${album._id}`}
        className="text-blue-300 hover:text-blue-100 text-sm font-medium"
      >
        Voir
      </Link>
      <button
        onClick={() => onEdit(album)}
        className="text-indigo-300 hover:text-indigo-100 text-sm"
      >
        Modif.
      </button>
      {album.isPublic !== false && (
        <button
          onClick={() => onShare(album)}
          className="text-purple-300 hover:text-purple-100 text-sm"
        >
          Part.
        </button>
      )}
      <button
        onClick={() => onToggleFeatured(album._id, album.isFeatured)}
        title={album.isFeatured ? 'Retirer du portfolio' : 'Mettre en avant'}
        className={`text-xs font-bold uppercase transition ${
          album.isFeatured ? 'text-yellow-400' : 'text-gray-500'
        }`}
      >
        {album.isFeatured ? '⭐' : '☆'}
      </button>
      <button
        onClick={() => onDelete(album)}
        className="text-red-300 hover:text-red-100 text-sm"
      >
        Suppr.
      </button>
    </div>
  </div>
);

const ShareModal = ({
  album,
  onClose,
}: {
  album: any;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <div className="bg-white/10 dark:bg-gray-800 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-300 hover:text-white font-bold text-xl"
      >
        ✕
      </button>
      <h3 className="text-xl font-bold mb-2 text-white text-center">
        Partager l'album
      </h3>
      <p className="text-gray-300 text-sm mb-6 text-center">{album.title}</p>

      <div className="space-y-4">
        <div className="bg-white/5 dark:bg-gray-900 p-4 rounded-lg border border-white/10">
          <label className="block text-sm font-bold text-white mb-2">
            Pour WordPress
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={getWpShortcode(album._id)}
              className="flex-1 bg-black/20 text-white text-xs p-2 rounded border border-white/10"
            />
            <button
              onClick={() => {
                copyToClipboard(getWpShortcode(album._id), 'Shortcode WP');
                onClose();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-bold transition"
            >
              Copier
            </button>
          </div>
        </div>

        <div className="bg-white/5 dark:bg-gray-900 p-4 rounded-lg border border-white/10">
          <label className="block text-sm font-bold text-white mb-2">
            Lien Public (Réseaux)
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={getPublicLink(album._id)}
              className="flex-1 bg-black/20 text-white text-xs p-2 rounded border border-white/10"
            />
            <button
              onClick={() => {
                copyToClipboard(getPublicLink(album._id), 'Lien Public');
                onClose();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-xs font-bold transition"
            >
              Copier
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [albums, setAlbums] = useState<any[]>([]);
  const [editingAlbum, setEditingAlbum] = useState<any | null>(null);
  const [sharingAlbum, setSharingAlbum] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortAZ, setSortAZ] = useState<'az' | 'za' | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isGalleries = location.pathname === '/galleries';

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAlbums();
  }, [user, loading, navigate, isGalleries]);

  useEffect(() => {
    setSearchQuery('');
  }, [isGalleries]);

  useEffect(() => {
    if (!feedbackMessage && !errorMessage) return;
    const timer = setTimeout(() => {
      setFeedbackMessage(null);
      setErrorMessage(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [feedbackMessage, errorMessage]);

  const fetchAlbums = async () => {
    try {
      const res = await api.get('/albums/my/albums');
      setAlbums(res.data);
    } catch {
      console.error('Erreur chargement albums');
    }
  };

  const handleUpdateAlbum = async (id: string, data: any) => {
    try {
      await api.put(`/albums/${id}`, data);
      await fetchAlbums();
      setEditingAlbum(null);
      setFeedbackMessage('Album mis à jour avec succès.');
      setErrorMessage(null);
    } catch {
      alert("Erreur lors de la modification de l'album.");
    }
  };

  const deleteAlbum = async (album: any) => {
    const targetLabel = album?.isVirtual
      ? 'cette galerie'
      : 'cet album et ses photos associées';
    if (!window.confirm(`Supprimer ${targetLabel} ?`)) return;

    try {
      const res = await api.delete<DeleteAlbumResponse>(`/albums/${album._id}`);
      const data = res.data;

      setAlbums(prev => prev.filter(a => a._id !== album._id));

      if (album?.isVirtual) {
        setFeedbackMessage(data.message || 'Galerie supprimée.');
      } else {
        const deletedPhotos = data.deletedPhotos ?? 0;
        const freedBytes = data.freedBytes ?? 0;
        setFeedbackMessage(
          `${data.message || 'Album supprimé.'} ${deletedPhotos} photo(s) supprimée(s), ${formatBytes(freedBytes)} libérés.`
        );
      }

      setErrorMessage(null);
      if (editingAlbum?._id === album._id) setEditingAlbum(null);
      if (sharingAlbum?._id === album._id) setSharingAlbum(null);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.error;
      setErrorMessage(apiMessage || 'Erreur lors de la suppression.');
      setFeedbackMessage(null);
    }
  };

  const toggleVisibility = async (id: string, current: boolean) => {
    try {
      await api.patch(`/albums/${id}/toggle-visibility`);
      setAlbums(prev =>
        prev.map(a => (a._id === id ? { ...a, isPublic: !current } : a))
      );
    } catch {
      alert('Erreur changement de visibilité');
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await api.patch(`/albums/${id}/toggle-featured`);
      setAlbums(prev =>
        prev.map(a => (a._id === id ? { ...a, isFeatured: !current } : a))
      );
    } catch {
      alert('Erreur mise en avant');
    }
  };

  const filteredAlbums = albums.filter(a => {
    const matchesTab = isGalleries ? a.isVirtual === true : a.isVirtual !== true;
    if (!matchesTab) return false;
    if (!searchQuery) return true;
    return (a.title || '').toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  const sortedAlbums = useMemo(() => {
    if (!sortAZ) return filteredAlbums;
    const copy = [...filteredAlbums];
    return sortAZ === 'az'
      ? copy.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' }))
      : copy.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'fr', { sensitivity: 'base' }));
  }, [filteredAlbums, sortAZ]);

  const albumActions = {
    onEdit: setEditingAlbum,
    onDelete: deleteAlbum,
    onShare: setSharingAlbum,
    onToggleVisibility: toggleVisibility,
    onToggleFeatured: toggleFeatured,
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}
      >
        Chargement de la session...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative w-full">
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
          {(feedbackMessage || errorMessage) && (
            <div className="mb-4 space-y-2">
              {feedbackMessage && (
                <div className="rounded-xl border border-green-400/30 bg-green-500/10 text-green-100 px-4 py-3 text-sm shadow-lg backdrop-blur">
                  {feedbackMessage}
                </div>
              )}
              {errorMessage && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 text-red-100 px-4 py-3 text-sm shadow-lg backdrop-blur">
                  {errorMessage}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
            {/* Barre de recherche */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isGalleries ? "Rechercher une galerie..." : "Rechercher un album..."}
                className="w-full bg-white/10 backdrop-blur text-white text-sm rounded-full pl-11 pr-10 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-white"
                  type="button"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Tri et Affichage */}
            <div className="bg-white/10 backdrop-blur rounded-full p-1 flex gap-1 border border-white/10 self-end sm:self-auto">
              <button
                onClick={() => setViewMode('grid')}
                title="Vue Grille"
                className={`p-2 rounded-full transition ${
                  viewMode === 'grid'
                    ? 'bg-white/30 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <IconGrid />
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="Vue Liste"
                className={`p-2 rounded-full transition ${
                  viewMode === 'list'
                    ? 'bg-white/30 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <IconList />
              </button>
              <button
                type="button"
                onClick={() => setSortAZ(v => (v === null ? 'az' : v === 'az' ? 'za' : null))}
                title={sortAZ === 'az' ? 'Basculer Z→A' : sortAZ === 'za' ? 'Retour ordre actuel' : 'Trier A→Z'}
                className={`px-3 py-2 rounded-full transition text-sm ${
                  sortAZ ? 'bg-white/30 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {sortAZ === 'az' ? 'A→Z' : sortAZ === 'za' ? 'Z→A' : 'A→Z'}
              </button>
            </div>
          </div>

          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 mt-8'
                : 'space-y-4 mt-8'
            }
          >
            {sortedAlbums.map(album =>
              viewMode === 'grid' ? (
                <AlbumCardGrid
                  key={album._id}
                  album={album}
                  {...albumActions}
                />
              ) : (
                <AlbumCardList
                  key={album._id}
                  album={album}
                  {...albumActions}
                />
              )
            )}
          </div>

          {sortedAlbums.length === 0 && (
            <div
              className={`text-center mt-12 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              {searchQuery ? (
                <>
                  <p className="text-xl mb-2">Aucun résultat pour "{searchQuery}"</p>
                  <p>Essayez avec d'autres mots-clés.</p>
                </>
              ) : (
                <>
                  <p className="text-xl mb-2">
                    Aucun {isGalleries ? 'galerie' : 'album'} pour le moment.
                  </p>
                  <p>Commencez par créer votre première galerie !</p>
                </>
              )}
            </div>
          )}

          {editingAlbum && (
            <EditAlbumModal
              album={editingAlbum}
              onClose={() => setEditingAlbum(null)}
              onSave={handleUpdateAlbum}
            />
          )}
        </div>
      </div>

      {sharingAlbum && (
        <ShareModal album={sharingAlbum} onClose={() => setSharingAlbum(null)} />
      )}
    </div>
  );
};

export default Dashboard;
