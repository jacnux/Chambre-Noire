// ============================================================
// LUMINAVIEW — PortfolioPage.tsx
// Page publique du portfolio d'un utilisateur
// v2.6.1 — home title color aligned / redundant label removed
// ============================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

type ContactStatus = 'idle' | 'sending' | 'sent' | 'error';
type ActiveTab = 'home' | 'series' | 'exhibitions' | 'about';
type MenuGroup = 'none' | 'series' | 'exhibitions' | 'blog' | 'about';

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

const getBlogUrl = (userName: string): string => {
  const name = userName.toLowerCase();
  const host = window.location.hostname;
  return host === 'localhost'
    ? `http://localhost:8080/?user=${name}`
    : `https://${name}-blog.helioscope.fr`;
};

const stripMarkdownAndHtml = (value: string = '') => {
  const raw = String(value || '');
  const withoutMd = raw
    .replace(/[#*_>`~-]/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1');
  const withoutHtml = withoutMd.replace(/<[^>]*>/g, ' ');
  return withoutHtml.replace(/\s+/g, ' ').trim();
};

const getPageExcerpt = (page: any) => {
  const textSection = page.sections?.find(
    (section: any) => section.type === 'text' || section.type === 'split_text_gallery'
  );
  const raw = textSection?.content || page.seoDescription || '';
  const cleaned = stripMarkdownAndHtml(raw);
  return cleaned.length > 118 ? `${cleaned.slice(0, 118).trim()}…` : cleaned;
};

const getPageMeta = (page: any) => {
  const galleryCount = Array.isArray(page.sections)
    ? page.sections.filter(
        (section: any) => section.type === 'gallery' || section.type === 'split_text_gallery'
      ).length
    : 0;

  if (page.menuGroup === 'exhibitions') {
    return galleryCount > 0
      ? `${galleryCount} section${galleryCount > 1 ? 's' : ''} visuelle${galleryCount > 1 ? 's' : ''}`
      : 'Exposition';
  }

  return galleryCount > 0
    ? `${galleryCount} section${galleryCount > 1 ? 's' : ''} visuelle${galleryCount > 1 ? 's' : ''}`
    : 'Série';
};

const getPageSecondaryMeta = (page: any) => {
  if (page.menuGroup === 'exhibitions') return 'Présentation publique';
  return 'Ensemble éditorial';
};

const getPageCover = (page: any) => {
  return page.coverImage || page.heroImage || page.bannerImage || null;
};

const getPagePlaceholder = (page: any) => {
  if (page.menuGroup === 'exhibitions') {
    return {
      label: 'Exposition',
      accent: 'text-orange-100',
      cardBorder: 'border-stone-200/10',
      filmTone: 'from-stone-900 via-zinc-900 to-black',
      sheetTone: 'bg-stone-950',
      frameTone: 'bg-[#111111]',
      mark: 'Cartel d’exposition',
      footerTone: 'from-[#120f0d] to-black',
    };
  }

  return {
    label: 'Série',
    accent: 'text-amber-50',
    cardBorder: 'border-zinc-200/10',
    filmTone: 'from-neutral-950 via-zinc-900 to-black',
    sheetTone: 'bg-neutral-950',
    frameTone: 'bg-[#101010]',
    mark: 'Planche-contact',
    footerTone: 'from-[#0d0d0d] to-black',
  };
};

/*const filterMenuPages = (pages: any[], group: MenuGroup) => {
  return [...pages]
    .filter(page => page.menuGroup === group)
    .filter(page => page.showInMenu === true)
    .sort((a, b) => {
      const orderA = a.menuOrder ?? 0;
      const orderB = b.menuOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' });
    });
};*/

const filterMenuPages = (pages: any[], group: MenuGroup) => {
  return [...pages]
    .filter(page => page.menuGroup === group)
    .filter(page => page.showInMenu === true)
    .filter(page => !page.parentPageId)
    .sort((a, b) => {
      const orderA = a.menuOrder ?? 0;
      const orderB = b.menuOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' });
    });
};

const CommentForm = ({ photoId }: { photoId: string }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await api.post(`/comments/${photoId}`, {
        authorName: name,
        authorEmail: email,
        message,
      });
      setStatus('ok');
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'ok') {
    return (
      <div className="mt-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg text-green-400 text-sm text-center">
        ✅ Merci pour votre commentaire !
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 border-t border-white/10 pt-5 space-y-3">
      <h4 className="text-sm font-semibold text-gray-300">💬 Laisser un commentaire</h4>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Votre nom *"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="flex-1 bg-black/30 border border-white/20 text-white placeholder-gray-500 p-2.5 rounded-lg text-sm"
        />
        <input
          type="email"
          placeholder="Email (optionnel)"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="flex-1 bg-black/30 border border-white/20 text-white placeholder-gray-500 p-2.5 rounded-lg text-sm"
        />
      </div>
      <textarea
        placeholder="Votre message *"
        value={message}
        onChange={e => setMessage(e.target.value)}
        required
        rows={3}
        className="w-full bg-black/30 border border-white/20 text-white placeholder-gray-500 p-2.5 rounded-lg text-sm resize-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm px-5 py-2 rounded-lg transition"
        >
          {status === 'sending' ? 'Envoi...' : 'Envoyer'}
        </button>
        {status === 'error' && <p className="text-red-400 text-xs">❌ Erreur, réessayez.</p>}
      </div>
    </form>
  );
};

const PhotoModal = ({ photo, onClose }: { photo: any; onClose: () => void }) => {
  if (!photo) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
          <img
            src={`/uploads/${photo.filename}`}
            alt={photo.title}
            className="w-full max-h-[50vh] object-contain rounded-t-xl bg-black"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black transition text-lg"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-white">{photo.title}</h3>
          {photo.description && <p className="text-gray-400 text-sm mt-1">{photo.description}</p>}
          {photo.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {photo.tags.map((tag: string) => (
                <span key={tag} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <CommentForm photoId={photo._id} />
        </div>
      </div>
    </div>
  );
};

const PortfolioHero = ({ user, authUser, onContact }: any) => {
  const tagline = user.bio ? stripMarkdownAndHtml(user.bio).split('.')[0] + '.' : 'Photographe & Créateur Visuel';
  const isOwner = authUser && String((authUser as any)?.id) === String(user._id);

  return (
    <header className="relative w-full bg-black border-b border-white/10 overflow-hidden">
      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_38%)]" />

      <div className="relative h-[14rem] md:h-[22rem] w-full overflow-hidden">
        {user.bannerImage ? (
          <>
            <img src={`/uploads/${user.bannerImage}`} className="w-full h-full object-cover opacity-65" alt="Bannière" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,transparent_20%,rgba(0,0,0,0.8)_100%)]" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-[#101010] to-black" />
        )}
      </div>

      <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 max-w-7xl mx-auto z-20">
        <div className="bg-gradient-to-br from-gray-950/50 to-black/85 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-[1.6rem] shadow-[0_24px_70px_rgba(0,0,0,0.45)] p-4 md:p-6 transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
            <div className="flex items-end gap-4 md:gap-6 min-w-0 flex-1">
              <div className="shrink-0">
                {user.avatar ? (
                  <img
                    src={`/uploads/${user.avatar}`}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-black ring-2 ring-white/10 shadow-2xl object-cover bg-gray-800"
                    alt="Avatar"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-black ring-2 ring-white/10 shadow-2xl bg-gray-800 flex items-center justify-center text-4xl">
                    👤
                  </div>
                )}
              </div>

              <div className="min-w-0 pb-1">
                <div className="text-[11px] uppercase tracking-[0.3em] text-gray-400 mb-2">Portfolio</div>
                <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                  {user.name}
                </h1>
                <p className="text-sm md:text-base text-gray-300 mt-2 italic max-w-2xl">
                  {tagline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

interface PortfolioMenuProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  username: string;
  blogUrl: string;
  seriesPages: any[];
  exhibitionPages: any[];
}

const PortfolioMenu = ({
  activeTab,
  setActiveTab,
  username,
  blogUrl,
  seriesPages,
  exhibitionPages,
}: PortfolioMenuProps) => {
  const [openDropdown, setOpenDropdown] = useState<ActiveTab | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDropdown = (tab: ActiveTab) => {
    setOpenDropdown(current => (current === tab ? null : tab));
  };

  const handleParentTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setOpenDropdown(null);
  };

  const renderDropdown = (pages: any[], group: 'series' | 'exhibitions') => {
    if (pages.length === 0 || openDropdown !== group) return null;

    const dropdownId = `${group}-dropdown-menu`;

    return (
      <div id={dropdownId} className="lv-dropdown-safe">
        <div className="max-h-[26rem] overflow-y-auto divide-y divide-gray-800">
          {pages.map(page => (
            <Link
              key={page._id}
              to={`/portfolio/${username}/${page.slug}`}
              className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/5 transition"
              onClick={() => setOpenDropdown(null)}
            >
              <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                {page.coverImage ? (
                  <img
                    src={`/uploads/${page.coverImage}`}
                    alt={page.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center text-gray-500 text-[10px] uppercase tracking-[0.2em]">
                    {group === 'exhibitions' ? 'Expo' : 'Série'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500 mb-1">
                  {group === 'exhibitions' ? 'Exposition' : 'Série'}
                </div>
                <div className="text-white text-sm md:text-base font-medium leading-tight line-clamp-2">
                  {page.title}
                </div>
              </div>
              <div className="text-gray-500 text-lg">›</div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 mb-12 relative z-30" ref={menuRef}>
      <div className="rounded-[1.25rem] border border-white/10 bg-black/35 backdrop-blur-sm px-3 py-3 md:px-4">
        <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
          <button
            onClick={() => handleParentTabClick('home')}
            className={`lv-menu-btn-safe ${activeTab === 'home' ? 'lv-menu-btn-safe-active' : 'lv-menu-btn-safe-inactive'}`}
          >
            Accueil
          </button>

          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleParentTabClick('series')}
              className={`lv-menu-btn-safe ${activeTab === 'series' ? 'lv-menu-btn-safe-active' : 'lv-menu-btn-safe-inactive'}`}
            >
              Séries
            </button>
            <button
              type="button"
              aria-label="Ouvrir le sous-menu Séries"
              aria-expanded={openDropdown === 'series'}
              aria-controls="series-dropdown-menu"
              onClick={() => toggleDropdown('series')}
              className={`lv-menu-chevron-safe ${openDropdown === 'series' || activeTab === 'series' ? 'lv-menu-btn-safe-active' : 'lv-menu-btn-safe-inactive'}`}
            >
              <span
                className={`text-xs transition-transform duration-200 ${openDropdown === 'series' ? 'rotate-180' : ''}`}
              >
                ▾
              </span>
            </button>
            {renderDropdown(seriesPages, 'series')}
          </div>

          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleParentTabClick('exhibitions')}
              className={`lv-menu-btn-safe ${activeTab === 'exhibitions' ? 'lv-menu-btn-safe-active' : 'lv-menu-btn-safe-inactive'}`}
            >
              Expositions
            </button>
            <button
              type="button"
              aria-label="Ouvrir le sous-menu Expositions"
              aria-expanded={openDropdown === 'exhibitions'}
              aria-controls="exhibitions-dropdown-menu"
              onClick={() => toggleDropdown('exhibitions')}
              className={`lv-menu-chevron-safe ${openDropdown === 'exhibitions' || activeTab === 'exhibitions' ? 'lv-menu-btn-safe-active' : 'lv-menu-btn-safe-inactive'}`}
            >
              <span
                className={`text-xs transition-transform duration-200 ${openDropdown === 'exhibitions' ? 'rotate-180' : ''}`}
              >
                ▾
              </span>
            </button>
            {renderDropdown(exhibitionPages, 'exhibitions')}
          </div>

          <a
            href={blogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="lv-menu-btn-safe lv-menu-btn-safe-inactive"
          >
            Blog
          </a>
          <button
            onClick={() => handleParentTabClick('about')}
            className={`lv-menu-btn-safe ${activeTab === 'about' ? 'lv-menu-btn-safe-active' : 'lv-menu-btn-safe-inactive'}`}
          >
            À propos
          </button>
        </div>
      </div>
    </div>
  );
};

interface HomeIntroProps {
  title?: string;
  portfolioIntro?: string;
}

const HomeIntro = ({ title, portfolioIntro }: HomeIntroProps) => (
  <div className="max-w-4xl mx-auto mb-12 md:mb-14">
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-sm px-6 py-7 md:px-8 md:py-9 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      {title && (
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-yellow-400 mb-5">
          {title}
        </h2>
      )}

      {portfolioIntro ? (
        <div className="prose prose-invert max-w-none text-left prose-p:my-3 prose-p:text-gray-200 prose-headings:text-yellow-200 prose-strong:text-white prose-a:text-yellow-300">
          <ReactMarkdown>{portfolioIntro}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-gray-400 text-lg italic text-left">Découvrez mes projets et ensembles photographiques.</p>
      )}
    </div>
  </div>
);

interface AlbumGridProps {
  albums: any[];
  username: string;
  emptyText?: string;
}

const AlbumGrid = ({ albums, username, emptyText }: AlbumGridProps) => {
  if (albums.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-xl">{emptyText || 'Aucun album mis en avant.'}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 md:gap-8">
      {albums.map((album: any) => (
        <Link
          key={album._id}
          to={`/album/${album._id}?mode=viewer`}
          state={{
            fromPortfolio: true,
            portfolioPath: `/portfolio/${username}`,
            portfolioLabel: `← Retour au portfolio de ${username}`,
          }}
          className="group block"
        >
          <article className="h-full overflow-hidden rounded-[1.2rem] border border-white/10 hover:border-yellow-500/20 bg-black shadow-[0_12px_45px_rgba(0,0,0,0.45)] transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_20px_50px_rgba(234,179,8,0.1)]">
            <div className="relative aspect-[4/3] overflow-hidden bg-black">
              {album.coverImage ? (
                <>
                  <img
                    src={`/uploads/${album.coverImage}`}
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.04]"
                    alt={album.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center text-4xl">📷</div>
              )}

              <div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between">
                <span className="text-[10px] uppercase tracking-[0.28em] text-white/70 bg-black/35 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                  Album
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="max-w-[85%]">
                  <h3 className="text-white text-[1.3rem] font-semibold leading-tight line-clamp-2 drop-shadow-md">
                    {album.title}
                  </h3>
                </div>
              </div>
            </div>

            <div className="lv-page-card-footer from-[#0d0d0d] to-black">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="lv-page-card-kicker text-gray-400">Sélection portfolio</div>
                </div>
                <span className="lv-page-card-meta">Album</span>
              </div>

              <p className="lv-page-card-excerpt">
                {album.description || 'Découvrir cette série d’images dans la vue portfolio.'}
              </p>

              <div className="lv-page-card-bottom">
                <span className="lv-page-card-label">Galerie</span>
                <span className="lv-page-card-link group-hover:translate-x-0.5 transition-transform">Ouvrir →</span>
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
};

interface PageGridProps {
  pages: any[];
  username: string;
  title: string;
  intro: string;
  emptyText: string;
}

const PageGrid = ({ pages, username, title, intro, emptyText }: PageGridProps) => (
  <div>
    <div className="max-w-3xl mx-auto mb-10 md:mb-12 text-center">
      <div className="text-[11px] uppercase tracking-[0.28em] text-gray-500 mb-3">Portfolio</div>
      <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4 tracking-tight">{title}</h2>
      <p className="text-center text-gray-400 text-lg italic">{intro}</p>
    </div>

    {pages.length === 0 ? (
      <div className="text-center py-20">
        <p className="text-gray-500 text-xl">{emptyText}</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pages.map(page => {
          const placeholder = getPagePlaceholder(page);
          const cover = getPageCover(page);
          const excerpt = getPageExcerpt(page);

          return (
            <Link
              key={page._id}
              to={`/portfolio/${username}/${page.slug}`}
              className="group block h-full"
            >
              <article
                className={`h-full overflow-hidden rounded-[1.2rem] bg-black border ${placeholder.cardBorder} hover:border-yellow-500/20 shadow-[0_12px_45px_rgba(0,0,0,0.45)] transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_20px_50px_rgba(234,179,8,0.1)]`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-black">
                  {cover ? (
                    <>
                      <img
                        src={`/uploads/${cover}`}
                        alt={page.title}
                        className="w-full h-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" />
                      <div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between">
                        <span
                          className={`text-[10px] uppercase tracking-[0.28em] ${placeholder.accent} bg-black/35 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-sm`}
                        >
                          {placeholder.label}
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <div className="max-w-[85%]">
                          <h3 className="text-white text-[1.35rem] font-semibold leading-tight line-clamp-2 drop-shadow-md">
                            {page.title}
                          </h3>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={`w-full h-full ${placeholder.sheetTone} relative overflow-hidden p-4 sm:p-5`}>
                      <div className="absolute inset-0 opacity-[0.10] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_18%),radial-gradient(circle_at_78%_24%,rgba(255,255,255,0.08),transparent_16%),radial-gradient(circle_at_50%_78%,rgba(255,255,255,0.06),transparent_20%)]" />
                      <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,transparent_20%,transparent_80%,rgba(255,255,255,0.08)_100%)]" />

                      <div
                        className={`relative h-full rounded-[18px] ${placeholder.frameTone} border border-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] overflow-hidden`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${placeholder.filmTone}`} />
                        <div className="absolute inset-0 opacity-[0.10] bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)]" />
                        <div className="absolute left-0 right-0 top-0 h-10 border-b border-white/10 bg-black/20" />
                        <div className="absolute left-0 right-0 bottom-0 h-14 border-t border-white/10 bg-black/30" />

                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-white/28" />
                          <span className="w-2 h-2 rounded-full bg-white/10" />
                          <span className="w-2 h-2 rounded-full bg-white/10" />
                        </div>

                        <div className="absolute top-3 right-3 text-[9px] uppercase tracking-[0.28em] text-white/40">
                          {placeholder.mark}
                        </div>

                        <div className="absolute inset-0 px-6 py-8 flex flex-col justify-between">
                          <div>
                            <div className={`text-[10px] uppercase tracking-[0.30em] ${placeholder.accent} mb-4`}>
                              {placeholder.label}
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-5 opacity-75">
                              <div className="aspect-square border border-white/10 bg-black/20" />
                              <div className="aspect-square border border-white/10 bg-black/30" />
                              <div className="aspect-square border border-white/10 bg-black/10" />
                            </div>
                          </div>

                          <div className="max-w-[14rem]">
                            <div className="w-20 h-px bg-white/20 mb-4" />
                            <div className="text-[10px] uppercase tracking-[0.24em] text-white/42">
                              Sans visuel de couverture
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`lv-page-card-footer ${placeholder.footerTone}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className={`lv-page-card-kicker ${placeholder.accent}`}>
                        {getPageSecondaryMeta(page)}
                      </div>

                      {!cover && (
                        <h3 className="lv-page-card-title group-hover:text-yellow-200 transition">
                          {page.title}
                        </h3>
                      )}
                    </div>

                    <span className="lv-page-card-meta">{getPageMeta(page)}</span>
                  </div>

                  <p className="lv-page-card-excerpt">{excerpt || 'Découvrir cette page.'}</p>

                  <div className="lv-page-card-bottom">
                    <span className="lv-page-card-label">Portfolio</span>
                    <span className="lv-page-card-link group-hover:translate-x-0.5 transition-transform">
                      Ouvrir →
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    )}
  </div>
);

interface ContentTabProps {
  title: string;
  content: string | undefined;
  emptyText: string;
  ctaLabel: string;
  onCtaClick: () => void;
}

const ContentTab = ({ title, content, emptyText, ctaLabel, onCtaClick }: ContentTabProps) => (
  <div className="max-w-4xl mx-auto">
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-sm px-6 py-7 md:px-8 md:py-9 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      <div className="text-[11px] uppercase tracking-[0.28em] text-gray-500 mb-3">À propos</div>
      <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-6 tracking-tight">{title}</h2>
      {content ? (
        <div className="prose prose-invert max-w-none prose-p:text-gray-200 prose-headings:text-white prose-strong:text-white prose-a:text-yellow-300">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-gray-500 italic">{emptyText}</p>
      )}
      <div className="mt-8 pt-8 border-t border-gray-800 text-center">
        <button
          onClick={onCtaClick}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-full font-bold transition text-lg"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  </div>
);

interface ContactModalProps {
  userName: string;
  form: ContactForm;
  status: ContactStatus;
  onChange: (field: keyof ContactForm, value: string) => void;
  onSend: () => void;
  onClose: () => void;
}

const ContactModal = ({ userName, form, status, onChange, onSend, onClose }: ContactModalProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        className="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-md w-full relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la fenêtre de contact"
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          ✕
        </button>

        <h3 id="contact-modal-title" className="text-xl font-bold text-yellow-400 mb-4 pr-10">
          Contacter {userName}
        </h3>

        {status === 'sent' ? (
          <div className="text-center py-8">
            <p className="text-green-400 text-lg font-bold">✓ Message envoyé !</p>
            <button onClick={onClose} className="mt-4 text-sm text-gray-400 hover:text-white">
              Fermer
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Votre nom *"
              value={form.name}
              onChange={e => onChange('name', e.target.value)}
              className="lv-input-safe mb-3"
            />
            <input
              type="email"
              placeholder="Votre email *"
              value={form.email}
              onChange={e => onChange('email', e.target.value)}
              className="lv-input-safe mb-3"
            />
            <textarea
              placeholder="Votre message *"
              value={form.message}
              onChange={e => onChange('message', e.target.value)}
              className="lv-textarea-safe mb-4"
            />
            {status === 'error' && (
              <p className="text-red-400 text-sm mb-3">Erreur lors de l&apos;envoi. Réessayez.</p>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400">
                Annuler
              </button>
              <button
                onClick={onSend}
                disabled={status === 'sending'}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded text-sm font-bold disabled:opacity-50"
              >
                {status === 'sending' ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PortfolioPage = () => {
  const { username } = useParams<{ username: string }>();
  const { user: authUser } = useAuth();

  const [user, setUser] = useState<any>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [userPages, setUserPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  const [showContact, setShowContact] = useState(false);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: '',
    email: '',
    message: '',
  });
  const [contactStatus, setContactStatus] = useState<ContactStatus>('idle');

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await api.get(`/albums/portfolio/${username}`);
        setUser(res.data.user);
        setAlbums(res.data.albums);
        api
          .get(`/user-pages/${username}`)
          .then(r => setUserPages(r.data))
          .catch(() => {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [username]);

  const seriesPages = useMemo(() => filterMenuPages(userPages, 'series'), [userPages]);
  const exhibitionPages = useMemo(() => filterMenuPages(userPages, 'exhibitions'), [userPages]);

  const handleContactChange = (field: keyof ContactForm, value: string) => {
    setContactForm(f => ({ ...f, [field]: value }));
  };

  const handleSendContact = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert('Merci de remplir tous les champs.');
      return;
    }
    setContactStatus('sending');
    try {
      await api.post('/users/contact', {
        toUserId: user._id,
        fromName: contactForm.name,
        fromEmail: contactForm.email,
        message: contactForm.message,
      });
      setContactStatus('sent');
    } catch {
      setContactStatus('error');
    }
  };

  const handleCloseContact = () => {
    setShowContact(false);
    setContactStatus('idle');
    setContactForm({ name: '', email: '', message: '' });
  };

  const openContact = () => setShowContact(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Chargement...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Utilisateur introuvable
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <PortfolioHero user={user} authUser={authUser} onContact={openContact} />

      <PortfolioMenu
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        username={username!}
        blogUrl={getBlogUrl(user.name)}
        seriesPages={seriesPages}
        exhibitionPages={exhibitionPages}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 pb-24">
        {activeTab === 'home' && (
          <>
            <HomeIntro
              portfolioIntro={user.portfolioIntro}
              title="Accueil"
            />
            <AlbumGrid
              albums={albums}
              username={username!}
              emptyText="Aucun contenu mis en avant pour le moment."
            />
          </>
        )}

        {activeTab === 'series' && (
          <PageGrid
            pages={seriesPages}
            username={username!}
            title="Séries"
            intro="Explorez les séries photographiques présentées comme des ensembles éditoriaux complets."
            emptyText="Aucune série publiée pour le moment."
          />
        )}

        {activeTab === 'exhibitions' && (
          <PageGrid
            pages={exhibitionPages}
            username={username!}
            title="Expositions"
            intro="Retrouvez ici les expositions, accrochages et présentations publiques du travail."
            emptyText="Aucune exposition publiée pour le moment."
          />
        )}

        {activeTab === 'about' && (
          <ContentTab
            title={`À propos de ${user.name}`}
            content={user.bio}
            emptyText="Aucune biographie renseignée."
            ctaLabel="Me contacter"
            onCtaClick={openContact}
          />
        )}
      </main>

      <footer className="text-center py-10 border-t border-gray-900 mt-14 text-gray-600 text-sm">
        © {new Date().getFullYear()} {user.name}. Portfolio Hélioscope.
      </footer>

      <button onClick={openContact} title="Me contacter" className="lv-btn-contact-safe">
        <span>✉️</span>
        <span className="hidden sm:inline">Me Contacter</span>
      </button>

      {selectedPhoto && <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}

      {showContact && (
        <ContactModal
          userName={user.name}
          form={contactForm}
          status={contactStatus}
          onChange={handleContactChange}
          onSend={handleSendContact}
          onClose={handleCloseContact}
        />
      )}
    </div>
  );
};

export default PortfolioPage;
