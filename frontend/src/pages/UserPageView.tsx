// ===========================================
// luminaview
//         UserPageView
//
//     Juin 2026 v2.5.6
// ===========================================

import React, { useState, useEffect, useMemo } from 'react';
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

const stripMarkdown = (value: string = '') => {
  const raw = String(value || '');
  const withoutMd = raw
    .replace(/[#*_>`~-]/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1');
  const withoutHtml = withoutMd.replace(/<[^>]*>/g, ' ');
  return withoutHtml.replace(/\s+/g, ' ').trim();
};

const getHeroImage = (page: any) => page?.coverImage || page?.heroImage || page?.bannerImage || null;

const getPageLabel = (page: any) => {
  if (page?.menuGroup === 'exhibitions') return 'Exposition';
  if (page?.menuGroup === 'series') return 'Série';
  return 'Page';
};

const getExcerpt = (value: string = '', max = 240) => {
  const clean = stripMarkdown(value);
  if (!clean) return '';
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
};

const UserPageView = () => {
  const { username, slug } = useParams<{ username?: string; slug?: string }>();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [commentPhoto, setCommentPhoto] = useState<any>(null);
  const [lightboxData, setLightboxData] = useState<{ photos: any[]; index: number } | null>(null);
  const [showChildMenu, setShowChildMenu] = useState(true);

  // --- ÉTATS POUR LE GLISSEMENT DE LA CARTOUCHE DE TITRE ---
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleDragStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Uniquement clic gauche
    setIsDragging(true);
    setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDragOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const host = window.location.hostname;
  const hostParts = host.split('.');
  const isSubdomainMode =
    host !== 'localhost' &&
    host !== '127.0.0.1' &&
    ((host.endsWith('.localhost') && hostParts.length >= 2) ||
      (!host.endsWith('.localhost') && hostParts.length >= 3 && hostParts[0] !== 'www'));

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

        const endpoint =
          isSubdomainMode && !username
            ? `/user-pages/public/subdomain/${cleanSlug}`
            : `/user-pages/${username}/${cleanSlug}`;

        const res = await api.get(endpoint);
        setPage(res.data);
        setShowChildMenu(true);
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

  const heroImage = useMemo(() => getHeroImage(page), [page]);

  /* const heroImage = useMemo(() => {
      if (page?.menuGroup === 'series' || page?.menuGroup === 'exhibitions') return null;
      return getHeroImage(page);
    }, [page]);  */

  const pageLabel = useMemo(() => getPageLabel(page), [page]);

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
  const parentPage = page?.parentPageId || null;

  const summaryTextSection = sections.find(
    (section: any) => section?.type === 'text' && section?.summary
  );
  const firstTextSection = sections.find((section: any) => section?.type === 'text');

  const editorialIntroSource =
    page?.editorialSummary ||
    summaryTextSection?.content ||
    firstTextSection?.content ||
    '';

  const editorialIntroExcerpt = getExcerpt(editorialIntroSource, 240);

  const parentPageHref = parentPage
    ? isSubdomainMode && !username
      ? `/${parentPage.slug}`
      : `/portfolio/${username}/${parentPage.slug}`
    : null;

  const renderPhoto = (photo: any, photos: any[], i: number) => (
    <div key={photo._id || i} className="relative group overflow-hidden rounded-xl border border-white/5 bg-gray-900 shadow-md hover:border-white/10 shadow-black/30 hover:shadow-black/60 transition-all duration-300">
      <img
        src={`/uploads/${photo.filename}`}
        className="w-full aspect-square object-cover cursor-pointer transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        alt={photo.title || ''}
        onClick={() => openLightbox(photos, i)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <button
        onClick={e => {
          e.stopPropagation();
          setCommentPhoto(photo);
        }}
        className="absolute bottom-3 right-3 w-9 h-9 bg-blue-600/90 hover:bg-blue-500 backdrop-blur-md rounded-full shadow-lg text-white hover:scale-110 active:scale-95 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
        title="Commenter"
      >
        💬
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="relative border-b border-white/10 bg-black overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_40%)]" />

        {heroImage ? (
          <div className="relative h-[25vh] md:h-[35vh] min-h-[180px] md:min-h-[280px] max-h-[460px] overflow-hidden">
            <img
              src={`/uploads/${heroImage}`}
              alt={page.title || 'Page'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-black/50 to-black/20" />
          </div>
        ) : (
          <div className="h-28 md:h-44 bg-[linear-gradient(135deg,#111111_0%,#1b1b1b_45%,#050505_100%)]" />
        )}

        <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 max-w-5xl mx-auto z-20">
          <div
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
              resize: 'both',
              overflow: 'auto',
            }}
            className="bg-gradient-to-br from-gray-950/50 to-black/85 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-2xl shadow-2xl px-5 py-4 md:px-6 md:py-4 transition-colors duration-300 min-w-[280px] min-h-[90px] max-w-full"
          >
            {/* Ligne d'en-tête regroupant la catégorie, le retour et le bouton de déplacement */}
            <div
              onMouseDown={handleDragStart}
              className="flex flex-wrap items-center justify-between gap-3 mb-2 pb-2 border-b border-white/5 cursor-move select-none"
              title="Restez cliqué ici pour déplacer la boîte"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-bold text-xs">⋮⋮</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400">{pageLabel}</span>
              </div>
              {parentPage && parentPageHref ? (
                <Link
                  to={parentPageHref}
                  onMouseDown={e => e.stopPropagation()} // Évite de déplacer lors du clic sur le lien
                  className="inline-flex items-center text-xs text-yellow-500 hover:text-yellow-400 font-semibold transition"
                >
                  ← Retour à {parentPage.title}
                </Link>
              ) : !isSubdomainMode && username ? (
                <Link
                  to={`/portfolio/${username}`}
                  onMouseDown={e => e.stopPropagation()} // Évite de déplacer lors du clic sur le lien
                  className="inline-flex items-center text-xs text-yellow-500 hover:text-yellow-400 font-semibold transition"
                >
                  ← Retour au portfolio
                </Link>
              ) : (
                <span className="text-[10px] text-gray-500 font-semibold">Portfolio public</span>
              )}
            </div>

            <h1 className="text-xl md:text-3xl font-extrabold text-white tracking-tight leading-tight max-w-4xl select-none">
              {page.title || 'Page'}
            </h1>

            {editorialIntroExcerpt && (
              <div className="mt-3 border-t border-white/5 pt-2.5 max-w-3xl">
                <p className="text-xs md:text-sm leading-relaxed text-gray-300 select-text">
                  {editorialIntroExcerpt}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-10 px-4 md:px-6">
        {childPages.length > 0 && (
          <div className="mb-12 max-w-4xl">
            <button
              type="button"
              onClick={() => setShowChildMenu(prev => !prev)}
              className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] px-5 py-4 text-left transition-all duration-300 shadow-md"
              aria-expanded={showChildMenu}
              aria-label="Afficher les sous-pages"
            >
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-yellow-500/85 font-semibold mb-1">Navigation</div>
                <div className="text-white font-semibold text-base md:text-lg flex items-center gap-2">
                  <span>Pages associées</span>
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-300 font-normal">
                    {childPages.length}
                  </span>
                </div>
              </div>
              <span className={`text-gray-400 bg-white/5 w-8 h-8 rounded-full flex items-center justify-center border border-white/10 transition-transform duration-300 ${showChildMenu ? 'rotate-180 text-white bg-white/10' : ''}`}>
                ▼
              </span>
            </button>

            {showChildMenu && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {childPages.map((child: any) => {
                  const childExcerpt = getExcerpt(child?.editorialSummary || '', 100);

                  return (
                    <Link
                      key={child._id}
                      to={isSubdomainMode && !username ? `/${child.slug}` : `/portfolio/${username}/${child.slug}`}
                      className="group flex flex-col bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden shadow-lg hover:shadow-black/25 transition-all duration-300"
                    >
                      <div className="h-32 w-full overflow-hidden bg-gray-900 relative">
                        {child.coverImage ? (
                          <img
                            src={`/uploads/${child.coverImage}`}
                            alt={child.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center text-gray-500 text-[10px] uppercase tracking-[0.2em]">
                            {child.menuGroup === 'exhibitions' ? 'Expo' : 'Série'}
                          </div>
                        )}
                        <span className="absolute top-2 left-2 text-[9px] uppercase tracking-[0.2em] bg-black/40 text-white/80 px-2 py-0.5 rounded border border-white/10 backdrop-blur-sm">
                          {child.menuGroup === 'exhibitions' ? 'Exposition' : 'Série'}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-white font-semibold text-sm line-clamp-1 group-hover:text-yellow-400 transition-colors">
                            {child.title}
                          </h4>
                          {childExcerpt && (
                            <p className="text-xs text-gray-400 leading-relaxed mt-1.5 line-clamp-2">
                              {childExcerpt}
                            </p>
                          )}
                        </div>
                        <div className="text-[10px] text-yellow-500 font-medium mt-3 flex items-center gap-1">
                          Voir la page <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
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
              const isHeaderIntroSection =
                section === summaryTextSection ||
                (!summaryTextSection && section === firstTextSection);

              if (isHeaderIntroSection) return null;

              return (
                <section key={index} className="mb-12 max-w-4xl mx-auto">
                  <div className="bg-white/[0.03] p-6 md:p-8 rounded-2xl border border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
                    <MarkdownRenderer
                      className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-gray-100 prose-li:text-gray-100 prose-strong:text-white prose-a:text-yellow-400 hover:prose-a:text-yellow-300"
                    >
                      {section.content || ''}
                    </MarkdownRenderer>
                  </div>
                </section>
              );
            }

            if (section.type === 'gallery') {
              if (!section.albumIds || section.albumIds.length === 0) return null;

              return (
                <section key={index} className="mb-14">
                  {section.albumIds.map((album: any) => {
                    if (!album) return null;

                    return (
                      <div key={album._id || `album-${index}`} className="my-6">
                        {album.title && (
                          <div className="mb-5 flex items-end justify-between gap-4 border-b border-white/10 pb-3">
                            <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{album.title}</h3>
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
                          {album.photos &&
                            album.photos.map((photo: any, i: number) => renderPhoto(photo, album.photos, i))}
                        </div>
                      </div>
                    );
                  })}
                </section>
              );
            }

            if (section.type === 'split_text_gallery') {
              return (
                <section
                  key={index}
                  className="mb-14 grid grid-cols-1 lg:grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)] gap-8 items-start border-b border-white/10 pb-12"
                >
                  <div className="bg-white/[0.04] p-6 md:p-7 rounded-2xl border border-white/10 self-stretch overflow-hidden">
                  {/*  <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-p:text-gray-100 prose-headings:text-white prose-strong:text-white prose-a:text-yellow-400">
                      <MarkdownRenderer className="prose">{section.content || ''}</MarkdownRenderer>
                    </div>  */}
                    <div className="prose prose-invert max-w-none prose-p:text-gray-100 prose-headings:text-white prose-strong:text-white prose-a:text-yellow-400 text-base leading-7 md:text-[17px] md:leading-8">
                      <MarkdownRenderer className="prose">{section.content || ''}</MarkdownRenderer>
                    </div>
                  </div>
                  <div className="w-full">
                    {section.albumIds && section.albumIds.length > 0 ? (
                      section.albumIds.map((album: any) => {
                        if (!album) return null;

                        return (
                          <div key={album._id || `split-album-${index}`} className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
                            {album.photos &&
                              album.photos.map((photo: any, i: number) => renderPhoto(photo, album.photos, i))}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center border border-dashed border-white/10 p-4 rounded-2xl">
                        Aucun album.
                      </p>
                    )}
                  </div>
                </section>
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
