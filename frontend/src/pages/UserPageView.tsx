import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import Lightbox from '../components/Lightbox';
import MarkdownRenderer from '../components/MarkdownRenderer';

// ============================================================
// SOUS-COMPOSANT — Formulaire Commentaire Photo
// ============================================================
const CommentForm = ({
  photoId,
  photoTitle,
  onClose,
}: {
  photoId: string;
  photoTitle: string;
  onClose: () => void;
}) => {
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [message,   setMessage]   = useState('');
  const [status,    setStatus]    = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [ownerName, setOwnerName] = useState('le photographe');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await api.post(`/comments/${photoId}`, {
        authorName: name,
        authorEmail: email,
        message,
      });
      // L'API retourne maintenant le nom du propriétaire
      if (res.data.ownerName) setOwnerName(res.data.ownerName);
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">💬 Laisser un commentaire</h3>
            <p className="text-sm text-gray-400 italic mt-0.5">{photoTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none transition ml-4"
          >
            ✕
          </button>
        </div>

        {status === 'ok' ? (
          <div className="p-4 bg-green-900/30 border border-green-500/30 rounded-lg text-green-400 text-sm text-center">
            ✅ Merci ! Votre commentaire a bien été envoyé à <strong>{ownerName}</strong>.
            <br />
            <button onClick={onClose} className="mt-3 text-xs underline text-green-300">
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Votre nom *"
                value={name}
                required
                onChange={e => setName(e.target.value)}
                className="flex-1 bg-black/40 border border-white/20 text-white placeholder-gray-500 p-2.5 rounded-lg text-sm"
              />
              <input
                type="email"
                placeholder="Email (optionnel)"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 bg-black/40 border border-white/20 text-white placeholder-gray-500 p-2.5 rounded-lg text-sm"
              />
            </div>
            <textarea
              placeholder="Votre commentaire *"
              value={message}
              required
              rows={4}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-black/40 border border-white/20 text-white placeholder-gray-500 p-2.5 rounded-lg text-sm resize-none"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm px-5 py-2 rounded-lg transition font-medium"
              >
                {status === 'sending' ? 'Envoi...' : '💬 Envoyer'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Annuler
              </button>
              {status === 'error' && (
                <p className="text-red-400 text-xs">❌ Erreur, réessayez.</p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const UserPageView = () => {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const [page,          setPage]          = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [lightboxData,  setLightboxData]  = useState<{ photos: any[]; index: number } | null>(null);

  // Signalement
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason,    setReportReason]    = useState('');

  // Commentaire
  const [commentTarget, setCommentTarget] = useState<{ photoId: string; photoTitle: string } | null>(null);

  useEffect(() => {
    if (!slug || !username) {
      setLoading(false);
      setError("Paramètres d'URL manquants.");
      return;
    }
    const fetchPage = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/user-pages/${username}/${slug.trim()}`);
        setPage(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Impossible de charger la page');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [username, slug]);

  const openLightbox  = (photos: any[], index: number) => setLightboxData({ photos, index });
  const closeLightbox = () => setLightboxData(null);

  const handleSendReport = async () => {
    if (!reportReason.trim()) { alert("Merci d'indiquer la raison."); return; }
    try {
      await api.post('/reports', { type: 'Signalement', targetId: page._id, reason: reportReason });
      alert('Signalement envoyé.');
      setShowReportModal(false);
      setReportReason('');
    } catch {
      alert('Erreur');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      Chargement...
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-4">
      <p>{error}</p>
      <Link to={`/portfolio/${username}`} className="text-blue-400 underline">Retour</Link>
    </div>
  );
  if (!page) return null;

  const sections = page.sections || [];

  // Helper — rendu d'une photo avec bouton 💬 Commenter au hover
  const renderPhoto = (photo: any, photos: any[], i: number) => (
    <div key={photo._id || i} className="relative group">
      <img
        src={`/uploads/${photo.filename}`}
        alt={photo.title || ''}
        className="w-full rounded-lg cursor-pointer object-cover hover:opacity-90 transition"
        onClick={() => openLightbox(photos, i)}
      />
      <button
        onClick={() =>
          setCommentTarget({ photoId: photo._id, photoTitle: photo.title || 'Photo' })
        }
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition bg-blue-600/80 hover:bg-blue-600 text-white text-xs px-2.5 py-1.5 rounded-full shadow-lg backdrop-blur"
        title="Laisser un commentaire"
      >
        💬 Commenter
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-2">{page.title || 'Page'}</h1>
        <Link
          to={`/portfolio/${username}`}
          className="text-sm text-gray-400 hover:text-white mb-6 inline-block transition"
        >
          ← Retour au portfolio de {username}
        </Link>

        {sections.length === 0 ? (
          <p className="text-gray-500 text-center py-16">Cette page est vide.</p>
        ) : (
          sections.map((section: any, index: number) => {
            if (!section) return null;

            if (section.type === 'text') {
              return (
                <div key={index} className="mb-8">
                  <MarkdownRenderer>{section.content || ''}</MarkdownRenderer>
                </div>
              );
            }

            if (section.type === 'gallery') {
              if (!section.albumIds || section.albumIds.length === 0) return null;
              return (
                <div key={index} className="mb-8">
                  {section.albumIds.map((album: any) => {
                    if (!album) return null;
                    return (
                      <div key={album._id} className="mb-6">
                        {album.title && (
                          <h2 className="text-lg font-semibold text-gray-300 mb-3">{album.title}</h2>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {album.photos && album.photos.map((photo: any, i: number) =>
                            renderPhoto(photo, album.photos, i)
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            if (section.type === 'split_text_gallery') {
              return (
                <div key={index} className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <MarkdownRenderer>{section.content || ''}</MarkdownRenderer>
                  </div>
                  <div>
                    {section.albumIds && section.albumIds.length > 0 ? (
                      section.albumIds.map((album: any) => {
                        if (!album) return null;
                        return (
                          <div key={album._id} className="grid grid-cols-2 gap-2">
                            {album.photos && album.photos.map((photo: any, i: number) =>
                              renderPhoto(photo, album.photos, i)
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-sm">Aucun album.</p>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })
        )}
      </div>

      {/* Lightbox */}
      {lightboxData && (
        <Lightbox
          photos={lightboxData.photos}
          initialIndex={lightboxData.index}
          onClose={closeLightbox}
        />
      )}

      {/* Modale Commentaire */}
      {commentTarget && (
        <CommentForm
          photoId={commentTarget.photoId}
          photoTitle={commentTarget.photoTitle}
          onClose={() => setCommentTarget(null)}
        />
      )}

      {/* Bouton Signalement Flottant */}
      <button
        onClick={() => setShowReportModal(true)}
        className="fixed bottom-20 right-6 z-50 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-3 rounded-full shadow-lg text-xs border border-red-400/30 transition"
        title="Signaler"
      >
        🚩
      </button>

      {/* Modale Signalement */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white font-bold mb-1">Signaler un contenu</h3>
            <p className="text-sm text-gray-400 mb-4">Page : {page?.title}</p>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="Raison du signalement (obligatoire)..."
              className="w-full bg-black/30 p-3 rounded border border-white/10 text-white h-24 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-sm text-gray-400"
              >
                Annuler
              </button>
              <button
                onClick={handleSendReport}
                className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPageView;
