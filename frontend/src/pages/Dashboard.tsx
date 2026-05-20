// ============================================================
// LUMINAVIEW — Dashboard.tsx
// Gestion des albums (vue grille / liste)
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import EditAlbumModal from '../components/EditAlbumModal';


// ============================================================
// TYPES
// ============================================================

type ViewMode = 'grid' | 'list';
type DashboardTab = 'albums' | 'galleries' | 'comments';

// ============================================================
// UTILITAIRES
// ============================================================

const getWpShortcode = (id: string) => `[luminaview id="${id}" autostart="true"]`;
const getPublicLink  = (id: string) => `${window.location.origin}/album/${id}?mode=viewer`;

const copyToClipboard = (text: string, label: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
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


// ============================================================
// SOUS-COMPOSANT — Icône Grille
// ============================================================

const IconGrid = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IconList = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);


// ============================================================
// SOUS-COMPOSANT — Carte Album (Vue Grille)
// ============================================================

const AlbumCardGrid = ({ album, onEdit, onDelete, onShare, onToggleVisibility, onToggleFeatured }: any) => (
  <div className="bg-white/10 dark:bg-gray-800/60 backdrop-blur-lg border border-white/20 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden hover:bg-white/20 dark:hover:bg-gray-700/60 transition transform hover:-translate-y-1 flex flex-col">

    {/* Couverture */}
    <div className="aspect-square w-full bg-black/20 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
      {album.coverImage
        ? <img src={`/uploads/${album.coverImage}`} alt="Cover" className="w-full h-full object-cover" />
        : <span className="text-white/50 text-5xl">📷</span>
      }
    </div>

    {/* Infos + Actions */}
    <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
      <div>
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-white truncate drop-shadow">{album.title}</h2>
        <p className="text-gray-300 text-xs sm:text-sm mb-4 line-clamp-2">{album.description}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-white/10 gap-2">
        <Link to={`/album/${album._id}`} className="text-blue-300 font-semibold hover:text-blue-100 hover:underline text-sm drop-shadow">
          Voir l'album
        </Link>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <button onClick={() => onToggleVisibility(album._id, album.isPublic)}
            className={`text-xs font-bold uppercase tracking-wide transition ${album.isPublic !== false ? 'text-green-300' : 'text-gray-500'}`}>
            {album.isPublic !== false ? '👁️ Public' : '🔒 Privé'}
          </button>
          <button onClick={() => onToggleFeatured(album._id, album.isFeatured)}
            title={album.isFeatured ? 'Retirer du portfolio' : 'Mettre en avant sur le portfolio'}
            className={`text-xs font-bold uppercase tracking-wide transition ${album.isFeatured ? 'text-yellow-400' : 'text-gray-500'}`}>
            {album.isFeatured ? '⭐ Portfolio' : '☆ Portfolio'}
          </button>
          <button onClick={() => onEdit(album)} className="text-indigo-300 hover:text-indigo-100 font-medium text-sm transition">Modifier</button>
          {album.isPublic !== false && (
            <button onClick={() => onShare(album)} className="text-purple-300 hover:text-purple-100 text-xs font-bold uppercase tracking-wide transition">🔗 Partager</button>
          )}
          <button onClick={() => onDelete(album._id)} className="text-red-300 hover:text-red-100 text-sm transition">Supprimer</button>
        </div>
      </div>
    </div>
  </div>
);


// ============================================================
// SOUS-COMPOSANT — Ligne Album (Vue Liste)
// ============================================================

const AlbumCardList = ({ album, onEdit, onDelete, onShare, onToggleFeatured }: any) => (
  <div className="bg-white/5 dark:bg-gray-800/40 backdrop-blur border border-white/10 dark:border-gray-700 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition group">
    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-black/20">
      {album.coverImage
        ? <img src={`/uploads/${album.coverImage}`} alt="Cover" className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-2xl">📷</div>
      }
    </div>

    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-white truncate">{album.title}</h3>
      <p className="text-xs text-gray-400 truncate">{album.description || 'Aucune description'}</p>
      <span className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded ${album.isPublic !== false ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}>
        {album.isPublic !== false ? 'Public' : 'Privé'}
      </span>
    </div>

    <div className="flex items-center gap-3 opacity-50 group-hover:opacity-100 transition">
      <Link to={`/album/${album._id}`} className="text-blue-300 hover:text-blue-100 text-sm font-medium">Voir</Link>
      <button onClick={() => onEdit(album)} className="text-indigo-300 hover:text-indigo-100 text-sm">Modif.</button>
      {album.isPublic !== false && (
        <button onClick={() => onShare(album)} className="text-purple-300 hover:text-purple-100 text-sm">Part.</button>
      )}
      <button onClick={() => onToggleFeatured(album._id, album.isFeatured)}
        title={album.isFeatured ? 'Retirer du portfolio' : 'Mettre en avant'}
        className={`text-xs font-bold uppercase transition ${album.isFeatured ? 'text-yellow-400' : 'text-gray-500'}`}>
        {album.isFeatured ? '⭐' : '☆'}
      </button>
      <button onClick={() => onDelete(album._id)} className="text-red-300 hover:text-red-100 text-sm">Suppr.</button>
    </div>
  </div>
);


// ============================================================
// SOUS-COMPOSANT — Modale Partage
// ============================================================

const ShareModal = ({ album, onClose }: { album: any; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <div className="bg-white/10 dark:bg-gray-800 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-white font-bold text-xl">✕</button>
      <h3 className="text-xl font-bold mb-2 text-white text-center">Partager l'album</h3>
      <p className="text-gray-300 text-sm mb-6 text-center">{album.title}</p>

      <div className="space-y-4">
        {/* Shortcode WordPress */}
        <div className="bg-white/5 dark:bg-gray-900 p-4 rounded-lg border border-white/10">
          <label className="block text-sm font-bold text-white mb-2">Pour WordPress</label>
          <div className="flex gap-2">
            <input readOnly value={getWpShortcode(album._id)} className="flex-1 bg-black/20 text-white text-xs p-2 rounded border border-white/10" />
            <button onClick={() => { copyToClipboard(getWpShortcode(album._id), 'Shortcode WP'); onClose(); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-bold transition">
              Copier
            </button>
          </div>
        </div>

        {/* Lien public */}
        <div className="bg-white/5 dark:bg-gray-900 p-4 rounded-lg border border-white/10">
          <label className="block text-sm font-bold text-white mb-2">Lien Public (Réseaux)</label>
          <div className="flex gap-2">
            <input readOnly value={getPublicLink(album._id)} className="flex-1 bg-black/20 text-white text-xs p-2 rounded border border-white/10" />
            <button onClick={() => { copyToClipboard(getPublicLink(album._id), 'Lien Public'); onClose(); }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-xs font-bold transition">
              Copier
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);


// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

const Dashboard = () => {
  const [albums, setAlbums]           = useState<any[]>([]);
  const [dashTab, setDashTab]     = useState<DashboardTab>('albums');
  const [comments, setComments]   = useState<any[]>([]);
  const [editingAlbum, setEditingAlbum] = useState<any | null>(null);
  const [sharingAlbum, setSharingAlbum] = useState<any | null>(null);
  const [viewMode, setViewMode]       = useState<ViewMode>('grid');

  const { user, loading } = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();
  const isGalleries       = location.pathname === '/galleries';

  // ── COMMENTAIRES ──


    useEffect(() => {
      if (dashTab === 'comments') fetchComments();
    }, [dashTab]);

    const fetchComments = async () => {
      try {
        const res = await api.get('/comments/my');
        setComments(res.data);
      } catch (err) { console.error(err); }
    };

    const markRead = async (id: string) => {
      await api.patch(`/comments/${id}/read`);
      setComments(prev => prev.map(c => c._id === id ? { ...c, isRead: true } : c));
    };

    const deleteComment = async (id: string) => {
      if (!window.confirm('Supprimer ce commentaire ?')) return;
      await api.delete(`/comments/${id}`);
      setComments(prev => prev.filter(c => c._id !== id));
    };

    const unreadCount = comments.filter(c => !c.isRead).length;


  // ── Effets ────────────────────────────────────────────────

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/login');
    else fetchAlbums();
  }, [user, loading, navigate]);


  // ── Actions API ───────────────────────────────────────────

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
      fetchAlbums();
      setEditingAlbum(null);
    } catch {
      alert("Erreur lors de la modification de l'album.");
    }
  };

  const deleteAlbum = async (id: string) => {
    if (!window.confirm('Supprimer cet album ?')) return;
    try {
      await api.delete(`/albums/${id}`);
      fetchAlbums();
    } catch {
      alert('Erreur suppression');
    }
  };

  const toggleVisibility = async (id: string, current: boolean) => {
    try {
      await api.patch(`/albums/${id}/toggle-visibility`);
      setAlbums(albums.map(a => a._id === id ? { ...a, isPublic: !current } : a));
    } catch {
      alert('Erreur changement de visibilité');
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await api.patch(`/albums/${id}/toggle-featured`);
      setAlbums(albums.map(a => a._id === id ? { ...a, isFeatured: !current } : a));
    } catch {
      alert('Erreur mise en avant');
    }
  };


  // ── Données filtrées ──────────────────────────────────────

  const filteredAlbums = albums.filter(a =>
    isGalleries ? a.isVirtual === true : a.isVirtual !== true
  );

  const albumActions = {
    onEdit:             setEditingAlbum,
    onDelete:           deleteAlbum,
    onShare:            setSharingAlbum,
    onToggleVisibility: toggleVisibility,
    onToggleFeatured:   toggleFeatured,
  };


  // ── Rendu ─────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      Chargement de la session...
    </div>
  );
  if (!user) return null;

  return (
    <div className="relative min-h-screen w-full">

      {/* Fond */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/uploads/monfond_1.jpg')" }} />

      <div className="relative z-10 min-h-screen pb-20">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">

          {/* Sélecteur vue grille / liste */}
          <div className="flex justify-end mb-4">
            <div className="bg-white/10 backdrop-blur rounded-full p-1 flex gap-1 border border-white/10">
              <button onClick={() => setViewMode('grid')} title="Vue Grille"
                className={`p-2 rounded-full transition ${viewMode === 'grid' ? 'bg-white/30 text-white' : 'text-gray-400 hover:text-white'}`}>
                <IconGrid />
              </button>
              <button onClick={() => setViewMode('list')} title="Vue Liste"
                className={`p-2 rounded-full transition ${viewMode === 'list' ? 'bg-white/30 text-white' : 'text-gray-400 hover:text-white'}`}>
                <IconList />
              </button>
            </div>
          </div>

          {/* Liste des albums */}
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 mt-8'
            : 'space-y-4 mt-8'
          }>
            {filteredAlbums.map(album =>
              viewMode === 'grid'
                ? <AlbumCardGrid key={album._id} album={album} {...albumActions} />
                : <AlbumCardList key={album._id} album={album} {...albumActions} />
            )}
          </div>

          {/* État vide */}
          {filteredAlbums.length === 0 && (
            <div className="text-center mt-12 text-gray-300">
              <p className="text-xl mb-2">Aucun {isGalleries ? 'galerie' : 'album'} pour le moment.</p>
              <p>Commencez par créer votre première galerie !</p>
            </div>
          )}

          {/* Modale édition */}
          {editingAlbum && (
            <EditAlbumModal
              album={editingAlbum}
              onClose={() => setEditingAlbum(null)}
              onSave={handleUpdateAlbum}
            />
          )}
        </div>
      </div>

      {/* ── VUE COMMENTAIRES ── */}
{dashTab === 'comments' && (
  <div className="space-y-4">
    <h2 className="text-xl font-bold">💬 Commentaires reçus</h2>
    {comments.length === 0 && (
      <p className="text-gray-400 text-sm bg-gray-800/50 rounded-xl p-6 text-center">
        Aucun commentaire pour le moment.
      </p>
    )}
    {comments.map(c => (
      <div key={c._id}
        className={`p-4 rounded-xl border transition ${
          c.isRead
            ? 'border-white/10 bg-gray-800/40'
            : 'border-blue-500/50 bg-blue-900/20'
        }`}
      >
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="font-semibold text-sm">
              {c.authorName}
              {c.authorEmail && (
                <a href={`mailto:${c.authorEmail}`}
                   className="text-gray-400 ml-2 text-xs hover:text-blue-400">
                  {c.authorEmail}
                </a>
              )}
              {!c.isRead && (
                <span className="ml-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  Nouveau
                </span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              📷 <span className="text-gray-300">{c.photoId?.title || 'Photo supprimée'}</span>
              {' · '}
              {new Date(c.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {!c.isRead && (
              <button onClick={() => markRead(c._id)}
                className="text-xs text-blue-400 hover:text-blue-300 transition">
                ✓ Lu
              </button>
            )}
            <button onClick={() => deleteComment(c._id)}
              className="text-xs text-red-400 hover:text-red-300 transition">
              🗑
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-200 bg-black/20 p-3 rounded-lg leading-relaxed">
          {c.message}
        </p>
      </div>
    ))}
  </div>
)}

      {/* Modale partage */}
      {sharingAlbum && (
        <ShareModal album={sharingAlbum} onClose={() => setSharingAlbum(null)} />
      )}

    </div>
  );
};

export default Dashboard;
