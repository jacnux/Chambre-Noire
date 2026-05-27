// ===========================================
// luminaview
//         UserPageView
//
//     Mai 2026 v2.4.1
// ===========================================

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import Lightbox from '../components/Lightbox';
import MarkdownRenderer from '../components/MarkdownRenderer';

const CommentForm = ({ photoId, onDone }: { photoId: string; onDone?: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await api.post(`/comments/${photoId}`, { authorName: name, authorEmail: email, message });
      setStatus('ok');
      setName('');
      setEmail('');
      setMessage('');
      if (onDone) setTimeout(onDone, 1500);
    } catch {
      setStatus('error');
    }
  };

  if (status === 'ok') {
    return <p className="text-green-400 text-sm py-4 text-center">✅ Merci pour votre commentaire !</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        required
        placeholder="Votre nom *"
        value={name}
        onChange={e => setName(e.target.value)}
        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm"
      />
      <input
        type="email"
        placeholder="Votre email (facultatif)"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm"
      />
      <textarea
        required
        rows={3}
        placeholder="Votre commentaire *"
        value={message}
        onChange={e => setMessage(e.target.value)}
        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm resize-none"
      />
      {status === 'error' && <p className="text-red-400 text-xs">Une erreur est survenue, réessayez.</p>}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
      >
        {status === 'sending' ? 'Envoi...' : '💬 Envoyer'}
      </button>
    </form>
  );
};

const CommentModal = ({ photo, onClose }: { photo: any; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">💬 Commenter</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
          ✕
        </button>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <img
          src={`/uploads/${photo.filename}`}
          alt={photo.title}
          className="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-black/30"
        />
        <div className="min-w-0">
          <p className="text-white font-medium truncate">{photo.title || 'Sans titre'}</p>
          <p className="text-gray-400 text-sm truncate">{photo.description || 'Pas de description'}</p>
        </div>
      </div>
      <CommentForm photoId={photo._id} onDone={onClose} />
    </div>
  </div>
);

const UserPageView = () => {
  const { username, slug } = useParams<{ username?: string; slug?: string }>();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [commentPhoto, setCommentPhoto] = useState<any>(null);
  const [lightboxData, setLightboxData] = useState<{ photos: any[]; index: number } | null>(null);
  const [showChildMenu, setShowChildMenu] = useState(false);

  const host = window.location.hostname;
  const hostParts = host.split('.');
  const isSubdomainMode =
    host !== 'localhost' &&
    host !== '127.0.0.1' &&
    ((host.endsWith('.localhost') && hostParts.length >= 2) || (!host.endsWith('.localhost') && hostParts.length >= 3 && hostParts[0] !== 'www'));

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('Paramètre slug manquant.');
      return;
    }

    if (!username && !isSubdomainMode) {
      setLoading(false);
      setError("Paramètres d'URL manquants.");
      return;
    }

    const fetchPage = async () => {
      try {
        setLoading(true);
        setError('');
        const cleanSlug = slug.trim();

        const endpoint = isSubdomainMode && !username
          ? `/user-pages/public/subdomain/${cleanSlug}`
          : `/user-pages/${username}/${cleanSlug}`;

        const res = await api.get(endpoint);
        setPage(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || err.response?.data?.message || 'Page introuvable.');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug, username, isSubdomainMode]);

  const openLightbox = (photos: any[], index: number) => setLightboxData({ photos, index });
  const closeLightbox = () => setLightboxData(null);

  const handleSendReport = async () => {
    if (!reportReason.trim()) {
      alert('Veuillez indiquer une raison.');
      return;
    }

    if (!page?._id) {
      alert('Impossible de signaler cette page.');
      return;
    }

    try {
      await api.post('/reports', {
        type: 'user_page',
        targetId: page._id,
        reason: reportReason.trim(),
      });

      alert('Signalement envoyé. Merci.');
      setShowReportModal(false);
      setReportReason('');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi du signalement.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Chargement...
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">
        {error || 'Page introuvable.'}
      </div>
    );
  }

  const sections = Array.isArray(page.sections) ? page.sections : [];
  const childPages = Array.isArray(page.childPages) ? page.childPages : [];

  const renderPhoto = (photo: any, photos: any[], i: number) => (
    <div key={photo._id || i} className="relative group">
      <img
        src={`/uploads/${photo.filename}`}
        className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80 transition"
        alt={photo.title || ''}
        onClick={() => openLightbox(photos, i)}
      />
      <button
        onClick={e => {
          e.stopPropagation();
          setCommentPhoto(photo);
        }}
        className="absolute bottom-2 right-2 w-8 h-8 bg-blue-600/80 backdrop-blur rounded-full shadow-lg text-white hover:bg-blue-600 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition z-10"
        title="Commenter"
      >
        💬
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="py-12 border-b border-gray-800 text-center">
        <h1 className="text-4xl font-bold text-yellow-400">{page.title || 'Page'}</h1>
        {!isSubdomainMode && username ? (
          <Link
            to={`/portfolio/${username}`}
            className="text-sm text-gray-500 hover:text-white mt-2 inline-block"
          >
            ← Retour au portfolio de {username}
          </Link>
        ) : (
          <div className="text-sm text-gray-500 mt-2 inline-block">Portfolio public</div>
        )}
      </div>

      <div className="max-w-6xl mx-auto py-10 px-4">
        {childPages.length > 0 && (
          <div className="mb-10 max-w-xl">
            <button
              type="button"
              onClick={() => setShowChildMenu(prev => !prev)}
              className="w-full flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800/80 hover:bg-gray-800 px-4 py-3 text-left transition"
              aria-expanded={showChildMenu}
              aria-label="Afficher les sous-pages"
            >
              <div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-gray-400 mb-1">Navigation</div>
                <div className="text-white font-medium">
                  Sous-pages {childPages.length > 0 ? `(${childPages.length})` : ''}
                </div>
              </div>
              <span className={`text-gray-400 transition-transform duration-200 ${showChildMenu ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>

            {showChildMenu && (
              <div className="mt-3 rounded-2xl border border-gray-800 bg-gray-900/95 backdrop-blur overflow-hidden shadow-2xl">
                <div className="divide-y divide-gray-800">
                  {childPages.map((child: any) => (
                    <Link
                      key={child._id}
                      to={isSubdomainMode && !username ? `/${child.slug}` : `/portfolio/${username}/${child.slug}`}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition"
                      onClick={() => setShowChildMenu(false)}
                    >
                      <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                        {child.coverImage ? (
                          <img
                            src={`/uploads/${child.coverImage}`}
                            alt={child.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-850 to-black flex items-center justify-center text-gray-500 text-[10px] uppercase tracking-[0.2em]">
                            {child.menuGroup === 'exhibitions' ? 'Expo' : 'Série'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500 mb-1">
                          {child.menuGroup === 'exhibitions' ? 'Exposition' : 'Série'}
                        </div>
                        <div className="text-white text-sm md:text-base font-medium leading-tight truncate">
                          {child.title}
                        </div>
                      </div>
                      <div className="text-gray-500 text-lg">›</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {sections.length === 0 ? (
          <p className="text-center text-gray-500 italic">Cette page est vide.</p>
        ) : (
          sections.map((section: any, index: number) => {
            if (!section) return null;

            if (section.type === 'text') {
              return (
                <div key={index} className="mb-12 max-w-none">
                  <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                    <MarkdownRenderer
                      className="prose prose-invert prose-lg max-w-none
                      prose-headings:text-white prose-p:text-white prose-li:text-white
                      prose-strong:text-white prose-a:text-yellow-400 hover:prose-a:text-yellow-300"
                    >
                      {section.content || ''}
                    </MarkdownRenderer>
                  </div>
                </div>
              );
            }

            if (section.type === 'gallery') {
              if (!section.albumIds || section.albumIds.length === 0) return null;

              return (
                <div key={index} className="mb-12">
                  {section.albumIds.map((album: any) => {
                    if (!album) return null;

                    return (
                      <div key={album._id || Math.random()} className="my-6">
                        {album.title && (
                          <h3 className="text-xl font-bold mb-4 text-gray-300">{album.title}</h3>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {album.photos &&
                            album.photos.map((photo: any, i: number) =>
                              renderPhoto(photo, album.photos, i),
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
                <div
                  key={index}
                  className="mb-12 flex flex-col md:flex-row gap-8 items-start border-b border-gray-800 pb-12"
                >
                  <div className="w-full md:w-[30%] bg-gray-800/50 p-6 rounded self-stretch overflow-hidden">
                    <div className="prose prose-invert prose-sm max-w-none">
                      <MarkdownRenderer className="prose">{section.content || ''}</MarkdownRenderer>
                    </div>
                  </div>
                  <div className="w-full md:w-[70%]">
                    {section.albumIds && section.albumIds.length > 0 ? (
                      section.albumIds.map((album: any) => {
                        if (!album) return null;

                        return (
                          <div key={album._id || Math.random()} className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {album.photos &&
                              album.photos.map((photo: any, i: number) =>
                                renderPhoto(photo, album.photos, i),
                              )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center border border-dashed p-4 rounded">
                        Aucun album.
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })
        )}
      </div>

      {lightboxData && (
        <Lightbox
          photos={lightboxData.photos}
          initialIndex={lightboxData.index}
          onClose={closeLightbox}
        />
      )}

      <button
        onClick={() => setShowReportModal(true)}
        className="fixed bottom-20 right-6 z-50 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-3 rounded-full shadow-lg text-xs border border-red-400/30 transition"
        title="Signaler"
      >
        🚩
      </button>

      {showReportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-400 mb-4">Signaler un contenu</h3>
            <p className="text-sm text-gray-400 mb-4">
              Page : <span className="text-white font-bold">{page?.title}</span>
            </p>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="Raison du signalement (obligatoire)..."
              className="w-full bg-black/30 p-3 rounded border border-white/10 text-white h-24 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-sm text-gray-400"
              >
                Annuler
              </button>
              <button
                onClick={handleSendReport}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-bold"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {commentPhoto && <CommentModal photo={commentPhoto} onClose={() => setCommentPhoto(null)} />}
    </div>
  );
};

export default UserPageView;
