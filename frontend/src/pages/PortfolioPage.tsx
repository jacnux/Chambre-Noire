// ============================================================
// LUMINAVIEW — PortfolioPage.tsx
// Page publique du portfolio d'un utilisateur
// v2.5.5
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

const PortfolioHero = ({ user, authUser }: any) => {
  const tagline = user.bio ? user.bio.split('.')[0] + '.' : 'Photographe & Créateur Visuel';
  const isOwner = authUser && String((authUser as any)?.id) === String(user._id);

  return (
    <div className="relative w-full bg-gray-800 overflow-hidden">
      <div className="h-64 md:h-80 w-full">
        {user.bannerImage ? (
          <img src={`/uploads/${user.bannerImage}`} className="w-full h-full object-cover opacity-60" alt="Bannière" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-black/60 backdrop-blur-sm flex items-center px-6 md:px-12">
        <div className="absolute -bottom-2 left-8 md:left-12">
          {user.avatar ? (
            <img
              src={`/uploads/${user.avatar}`}
              className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-gray-900 shadow-xl object-cover bg-gray-700"
              alt="Avatar"
            />
          ) : (
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-gray-900 shadow-xl bg-gray-700 flex items-center justify-center text-4xl">
              👤
            </div>
          )}
        </div>
        <div className="ml-36 md:ml-44 flex-1 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-lg tracking-tight">{user.name}</h1>
            <p className="text-sm md:text-base text-gray-300 mt-1 italic drop-shadow">{tagline}</p>
          </div>
          {!isOwner && (
            <Link to="/" className="text-xs text-gray-300 hover:text-white bg-white/10 px-3 py-2 rounded-full transition hidden sm:block">
              ← Retour au site
            </Link>
          )}
        </div>
      </div>
    </div>
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

const baseMenuButtonClass = 'px-5 py-3 text-sm font-bold rounded-t-lg transition';
const activeMenuButtonClass = 'bg-gray-800 text-yellow-400 border-b-2 border-yellow-400';
const inactiveMenuButtonClass = 'text-gray-400 hover:text-white';

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

  const toggleDropdown = (tab: ActiveTab) => {
    setActiveTab(tab);
    setOpenDropdown(current => (current === tab ? null : tab));
  };

  const renderDropdown = (pages: any[], group: 'series' | 'exhibitions') => {
    if (pages.length === 0 || openDropdown !== group) return null;

    return (
      <div className="absolute left-1/2 top-full z-40 mt-2 w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-gray-800 bg-gray-900/95 shadow-2xl backdrop-blur overflow-hidden">
        <div className="max-h-[26rem] overflow-y-auto divide-y divide-gray-800">
          {pages.map(page => (
            <Link
              key={page._id}
              to={`/portfolio/${username}/${page.slug}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition"
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
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-850 to-black flex items-center justify-center text-gray-500 text-[10px] uppercase tracking-[0.2em]">
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
    <div className="max-w-7xl mx-auto px-4 border-b border-gray-800 mb-10" ref={menuRef}>
      <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
        <button
          onClick={() => {
            setActiveTab('home');
            setOpenDropdown(null);
          }}
          className={`${baseMenuButtonClass} ${activeTab === 'home' ? activeMenuButtonClass : inactiveMenuButtonClass}`}
        >
          Accueil
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('series')}
            aria-expanded={openDropdown === 'series'}
            className={`${baseMenuButtonClass} ${activeTab === 'series' ? activeMenuButtonClass : inactiveMenuButtonClass} flex items-center gap-2`}
          >
            <span>Séries</span>
            <span className={`text-xs transition-transform duration-200 ${openDropdown === 'series' ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {renderDropdown(seriesPages, 'series')}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('exhibitions')}
            aria-expanded={openDropdown === 'exhibitions'}
            className={`${baseMenuButtonClass} ${activeTab === 'exhibitions' ? activeMenuButtonClass : inactiveMenuButtonClass} flex items-center gap-2`}
          >
            <span>Expositions</span>
            <span className={`text-xs transition-transform duration-200 ${openDropdown === 'exhibitions' ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {renderDropdown(exhibitionPages, 'exhibitions')}
        </div>

        <a
          href={blogUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseMenuButtonClass} ${inactiveMenuButtonClass}`}
        >
          Blog
        </a>
        <button
          onClick={() => {
            setActiveTab('about');
            setOpenDropdown(null);
          }}
          className={`${baseMenuButtonClass} ${activeTab === 'about' ? activeMenuButtonClass : inactiveMenuButtonClass}`}
        >
          À propos
        </button>
      </div>
    </div>
  );
};

interface TabProjectsProps {
  albums: any[];
  portfolioIntro?: string;
  username: string;
  title?: string;
  emptyText?: string;
}

const TabProjects = ({ albums, portfolioIntro, username, title, emptyText }: TabProjectsProps) => (
  <div>
    {title && <h2 className="text-3xl font-bold text-yellow-400 text-center mb-4">{title}</h2>}
    <p className="text-center text-gray-400 mb-10 text-lg italic">
      {portfolioIntro || 'Découvrez mes projets.'}
    </p>
    {albums.length === 0 ? (
      <div className="text-center py-20">
        <p className="text-gray-500 text-xl">{emptyText || 'Aucun album mis en avant.'}</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <div className="relative overflow-hidden rounded-xl shadow-2xl bg-gray-800 transform transition duration-500 group-hover:scale-[1.02] group-hover:shadow-yellow-500/10">
              <div className="aspect-[4/3] overflow-hidden">
                {album.coverImage ? (
                  <img
                    src={`/uploads/${album.coverImage}`}
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                    alt={album.title}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-4xl">📷</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 flex items-end p-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{album.title}</h3>
                    <p className="text-gray-300 text-sm mt-1 line-clamp-2">{album.description}</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 group-hover:opacity-0 transition">
                <h3 className="text-lg font-bold text-white drop-shadow-lg">{album.title}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
);

interface PageGridProps {
  pages: any[];
  username: string;
  title: string;
  intro: string;
  emptyText: string;
}

const getPageExcerpt = (page: any) => {
  const textSection = page.sections?.find((section: any) => section.type === 'text' || section.type === 'split_text_gallery');
  const raw = textSection?.content || page.seoDescription || '';
  const cleaned = String(raw).replace(/[#*_>`~-]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.length > 140 ? `${cleaned.slice(0, 140).trim()}…` : cleaned;
};

const getPageMeta = (page: any) => {
  const galleryCount = Array.isArray(page.sections)
    ? page.sections.filter((section: any) => section.type === 'gallery' || section.type === 'split_text_gallery').length
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

const getPageCover = (page: any) => {
  return page.coverImage || page.heroImage || page.bannerImage || null;
};

const getPagePlaceholder = (page: any) => {
  if (page.menuGroup === 'exhibitions') {
    return {
      label: 'Exposition',
      accent: 'text-orange-100',
      cardBorder: 'border-orange-200/15',
      filmTone: 'from-stone-900 via-zinc-900 to-black',
      sheetTone: 'bg-stone-950',
      frameTone: 'bg-[#111111]',
      mark: 'Cartel d’exposition',
    };
  }

  return {
    label: 'Série',
    accent: 'text-amber-50',
    cardBorder: 'border-amber-200/15',
    filmTone: 'from-neutral-950 via-zinc-900 to-black',
    sheetTone: 'bg-neutral-950',
    frameTone: 'bg-[#101010]',
    mark: 'Planche-contact',
  };
};

const PageGrid = ({ pages, username, title, intro, emptyText }: PageGridProps) => (
  <div>
    <h2 className="text-3xl font-bold text-yellow-400 text-center mb-4">{title}</h2>
    <p className="text-center text-gray-400 mb-10 text-lg italic">{intro}</p>

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
              className="group block"
            >
              <div className={`h-full overflow-hidden rounded-xl shadow-2xl bg-black border ${placeholder.cardBorder} transition duration-500 group-hover:scale-[1.02] group-hover:shadow-black/60`}>
                <div className="aspect-[4/3] overflow-hidden bg-black relative">
                  {cover ? (
                    <>
                      <img
                        src={`/uploads/${cover}`}
                        alt={page.title}
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <div className={`text-[11px] uppercase tracking-[0.3em] ${placeholder.accent} mb-2`}>
                          {placeholder.label}
                        </div>
                        <div className="text-white text-xl font-semibold leading-tight line-clamp-2 drop-shadow-lg">
                          {page.title}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={`w-full h-full ${placeholder.sheetTone} relative overflow-hidden p-4 sm:p-5`}>
                      <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_18%),radial-gradient(circle_at_78%_24%,rgba(255,255,255,0.08),transparent_16%),radial-gradient(circle_at_50%_78%,rgba(255,255,255,0.06),transparent_20%)]" />
                      <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,transparent_20%,transparent_80%,rgba(255,255,255,0.08)_100%)]" />

                      <div className={`relative h-full rounded-[18px] ${placeholder.frameTone} border border-white/8 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${placeholder.filmTone}`} />
                        <div className="absolute inset-0 opacity-[0.12] bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)]" />
                        <div className="absolute left-0 right-0 top-0 h-10 border-b border-white/5 bg-black/20" />
                        <div className="absolute left-0 right-0 bottom-0 h-14 border-t border-white/5 bg-black/30" />

                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-white/30" />
                          <span className="w-2 h-2 rounded-full bg-white/10" />
                          <span className="w-2 h-2 rounded-full bg-white/10" />
                        </div>

                        <div className="absolute top-3 right-3 text-[9px] uppercase tracking-[0.28em] text-white/45">
                          {placeholder.mark}
                        </div>

                        <div className="absolute inset-0 px-6 py-8 flex flex-col justify-between">
                          <div>
                            <div className={`text-[11px] uppercase tracking-[0.3em] ${placeholder.accent} mb-4`}>
                              {placeholder.label}
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-5 opacity-80">
                              <div className="aspect-square border border-white/10 bg-black/20" />
                              <div className="aspect-square border border-white/10 bg-black/30" />
                              <div className="aspect-square border border-white/10 bg-black/10" />
                            </div>
                          </div>

                          <div>
                            <div className="w-20 h-px bg-white/25 mb-4" />
                            <div className="text-white text-2xl font-semibold leading-tight max-w-[13rem] line-clamp-3 mb-3">
                              {page.title}
                            </div>
                            <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                              Tirage sans visuel
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-gradient-to-b from-zinc-950 to-black">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-yellow-300 transition line-clamp-2">
                      {page.title}
                    </h3>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-gray-500 whitespace-nowrap pt-1">
                      {getPageMeta(page)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-3 min-h-[4.5rem]">
                    {excerpt || 'Découvrir cette page.'}
                  </p>
                  <div className="mt-5 text-sm text-yellow-300 font-medium">
                    Ouvrir →
                  </div>
                </div>
              </div>
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
  <div className="max-w-3xl mx-auto">
    <div className="bg-gray-800/50 backdrop-blur border border-white/10 rounded-xl p-8 shadow-2xl">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6">{title}</h2>
      {content ? (
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-gray-500 italic">{emptyText}</p>
      )}
      <div className="mt-8 pt-8 border-t border-gray-700 text-center">
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

const ContactModal = ({ userName, form, status, onChange, onSend, onClose }: ContactModalProps) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
    <div className="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-md w-full">
      <h3 className="text-xl font-bold text-yellow-400 mb-4">Contacter {userName}</h3>

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
            className="w-full bg-black/30 p-3 rounded border border-white/10 text-white mb-3"
          />
          <input
            type="email"
            placeholder="Votre email *"
            value={form.email}
            onChange={e => onChange('email', e.target.value)}
            className="w-full bg-black/30 p-3 rounded border border-white/10 text-white mb-3"
          />
          <textarea
            placeholder="Votre message *"
            value={form.message}
            onChange={e => onChange('message', e.target.value)}
            className="w-full bg-black/30 p-3 rounded border border-white/10 text-white h-28 mb-4"
          />
          {status === 'error' && <p className="text-red-400 text-sm mb-3">Erreur lors de l'envoi. Réessayez.</p>}
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

const filterMenuPages = (pages: any[], group: MenuGroup) => {
  return [...pages]
    .filter(page => page.menuGroup === group)
    .filter(page => page.showInMenu === true)
    .sort((a, b) => {
      const orderA = a.menuOrder ?? 0;
      const orderB = b.menuOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' });
    });
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
  const [contactForm, setContactForm] = useState<ContactForm>({ name: '', email: '', message: '' });
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
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Chargement...</div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Utilisateur introuvable</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <PortfolioHero user={user} authUser={authUser} username={username} />
      <div className="h-12 bg-gray-900" />

      <PortfolioMenu
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        username={username!}
        blogUrl={getBlogUrl(user.name)}
        seriesPages={seriesPages}
        exhibitionPages={exhibitionPages}
      />

      <div className="max-w-7xl mx-auto px-4 pb-24">
        {activeTab === 'home' && (
          <TabProjects
            albums={albums}
            portfolioIntro={user.portfolioIntro}
            username={username!}
            title="Accueil"
            emptyText="Aucun contenu mis en avant pour le moment."
          />
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
      </div>

      <div className="text-center py-10 border-t border-gray-800 mt-10 text-gray-600 text-sm">
        © {new Date().getFullYear()} {user.name}. Portfolio Hélioscope.
      </div>

      <button
        onClick={openContact}
        title="Me contacter"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-400 text-black p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm transition transform hover:scale-110 z-50"
      >
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
