// ============================================================
// LUMINAVIEW — PortfolioPage.tsx
// Page publique du portfolio d'un utilisateur
// v2.3.0
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';


// ============================================================
// TYPES
// ============================================================

type ContactStatus = 'idle' | 'sending' | 'sent' | 'error';
type ActiveTab     = 'projects' | 'about' | 'services';

interface ContactForm {
  name: string;
  email: string;
  message: string;
}


// ============================================================
// UTILITAIRES
// ============================================================

const getBlogUrl = (userName: string): string => {
  const name = userName.toLowerCase();
  const host = window.location.hostname;
  return host === 'localhost'
    ? `http://localhost:8080/?user=${name}`
    : `https://${name}-blog.helioscope.fr`;
};


// ============================================================
// SOUS-COMPOSANT — Formulaire Commentaire Photo
// ============================================================

const CommentForm = ({ photoId }: { photoId: string }) => {
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [message, setMessage] = useState('');
  const [status,  setStatus]  = useState<'idle'|'sending'|'ok'|'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await api.post(`/comments/${photoId}`, {
        authorName: name, authorEmail: email, message
      });
      setStatus('ok');
      setName(''); setEmail(''); setMessage('');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'ok') return (
    <div className="mt-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg text-green-400 text-sm text-center">
      ✅ Merci pour votre commentaire !
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="mt-6 border-t border-white/10 pt-5 space-y-3">
      <h4 className="text-sm font-semibold text-gray-300">💬 Laisser un commentaire</h4>
      <div className="flex gap-3">
        <input type="text" placeholder="Votre nom *" value={name}
          onChange={e => setName(e.target.value)} required
          className="flex-1 bg-black/30 border border-white/20 text-white placeholder-gray-500 p-2.5 rounded-lg text-sm" />
        <input type="email" placeholder="Email (optionnel)" value={email}
          onChange={e => setEmail(e.target.value)}
          className="flex-1 bg-black/30 border border-white/20 text-white placeholder-gray-500 p-2.5 rounded-lg text-sm" />
      </div>
      <textarea placeholder="Votre message *" value={message}
        onChange={e => setMessage(e.target.value)} required rows={3}
        className="w-full bg-black/30 border border-white/20 text-white placeholder-gray-500 p-2.5 rounded-lg text-sm resize-none" />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={status === 'sending'}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm px-5 py-2 rounded-lg transition">
          {status === 'sending' ? 'Envoi...' : 'Envoyer'}
        </button>
        {status === 'error' && <p className="text-red-400 text-xs">❌ Erreur, réessayez.</p>}
      </div>
    </form>
  );
};


// ============================================================
// SOUS-COMPOSANT — Modale Photo avec Commentaire
// ============================================================

const PhotoModal = ({ photo, onClose }: { photo: any; onClose: () => void }) => {
  if (!photo) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="relative">
          <img src={`/uploads/${photo.filename}`} alt={photo.title}
            className="w-full max-h-[50vh] object-contain rounded-t-xl bg-black" />
          <button onClick={onClose}
            className="absolute top-3 right-3 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black transition text-lg">
            ✕
          </button>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-white">{photo.title}</h3>
          {photo.description && (
            <p className="text-gray-400 text-sm mt-1">{photo.description}</p>
          )}
          {photo.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {photo.tags.map((tag: string) => (
                <span key={tag} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {/* ← Formulaire commentaire intégré ici */}
          <CommentForm photoId={photo._id} />
        </div>
      </div>
    </div>
  );
};


// ============================================================
// SOUS-COMPOSANT — Hero Header
// ============================================================

const PortfolioHero = ({ user, authUser, username }: any) => {
  const tagline = user.bio ? user.bio.split('.')[0] + '.' : 'Photographe & Créateur Visuel';
  const isOwner = authUser && String((authUser as any)?.id) === String(user._id);

  return (
    <div className="relative w-full bg-gray-800 overflow-hidden">
      {/* Bannière */}
      <div className="h-64 md:h-80 w-full">
        {user.bannerImage
          ? <img src={`/uploads/${user.bannerImage}`} className="w-full h-full object-cover opacity-60" alt="Bannière" />
          : <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
        }
      </div>

      {/* Barre avatar + nom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-black/60 backdrop-blur-sm flex items-center px-6 md:px-12">
        <div className="absolute -bottom-2 left-8 md:left-12">
          {user.avatar
            ? <img src={`/uploads/${user.avatar}`} className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-gray-900 shadow-xl object-cover bg-gray-700" alt="Avatar" />
            : <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-gray-900 shadow-xl bg-gray-700 flex items-center justify-center text-4xl">👤</div>
          }
        </div>
        <div className="ml-36 md:ml-44 flex-1 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-lg tracking-tight">{user.name}</h1>
            <p className="text-sm md:text-base text-gray-300 mt-1 italic drop-shadow">{tagline}</p>
          </div>
          {isOwner
            ? <Link to="/dashboard" className="text-xs text-gray-300 hover:text-white bg-white/10 px-3 py-2 rounded-full transition hidden sm:block">← Dashboard</Link>
            : <Link to="/"          className="text-xs text-gray-300 hover:text-white bg-white/10 px-3 py-2 rounded-full transition hidden sm:block">← Retour au site</Link>
          }
        </div>
      </div>
    </div>
  );
};


// ============================================================
// SOUS-COMPOSANT — Onglets
// ============================================================

const TAB_STYLE_ACTIVE  = 'bg-gray-800 text-yellow-400 border-b-2 border-yellow-400';
const TAB_STYLE_DEFAULT = 'text-gray-500 hover:text-white';
const TAB_BASE          = 'px-6 py-3 text-sm font-bold rounded-t-lg transition';

interface TabBarProps {
  activeTab:   ActiveTab;
  setActiveTab: (t: ActiveTab) => void;
  userPages:   any[];
  username:    string;
  blogUrl:     string;
}

const TabBar = ({ activeTab, setActiveTab, userPages, username, blogUrl }: TabBarProps) => (
  <div className="max-w-7xl mx-auto px-4 border-b border-gray-800 mb-10">
    <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
      <button onClick={() => setActiveTab('about')}    className={`${TAB_BASE} ${activeTab === 'about'    ? TAB_STYLE_ACTIVE : TAB_STYLE_DEFAULT}`}>À propos</button>
      <button onClick={() => setActiveTab('projects')} className={`${TAB_BASE} ${activeTab === 'projects' ? TAB_STYLE_ACTIVE : TAB_STYLE_DEFAULT}`}>Galeries</button>
      <a href={blogUrl} target="_blank" rel="noopener noreferrer" className={`${TAB_BASE} ${TAB_STYLE_DEFAULT}`}>Blog</a>
      {userPages.map(p => (
        <Link key={p._id} to={`/portfolio/${username}/${p.slug}`} className={`${TAB_BASE} ${TAB_STYLE_DEFAULT}`}>{p.title}</Link>
      ))}
      <button onClick={() => setActiveTab('services')} className={`${TAB_BASE} ${activeTab === 'services' ? TAB_STYLE_ACTIVE : TAB_STYLE_DEFAULT}`}>Mes Actualités</button>
    </div>
  </div>
);


// ============================================================
// SOUS-COMPOSANT — Onglet Galeries (avec clic photo → modale)
// ============================================================

const TabProjects = ({ albums, portfolioIntro, onPhotoClick }: any) => (
  <div>
    <p className="text-center text-gray-400 mb-10 text-lg italic">
      {portfolioIntro || 'Découvrez mes projets.'}
    </p>
    {albums.length === 0 ? (
      <div className="text-center py-20">
        <p className="text-gray-500 text-xl">Aucun album mis en avant.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {albums.map((album: any) => (
          <Link to={`/album/${album._id}?mode=viewer`} key={album._id} className="group block">
            <div className="relative overflow-hidden rounded-xl shadow-2xl bg-gray-800 transform transition duration-500 group-hover:scale-[1.02] group-hover:shadow-yellow-500/10">
              <div className="aspect-[4/3] overflow-hidden">
                {album.coverImage
                  ? <img src={`/uploads/${album.coverImage}`} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt={album.title} />
                  : <div className="w-full h-full bg-gray-700 flex items-center justify-center text-4xl">📷</div>
                }
                {/* Overlay au hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 flex items-end p-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{album.title}</h3>
                    <p className="text-gray-300 text-sm mt-1 line-clamp-2">{album.description}</p>
                  </div>
                </div>
              </div>
              {/* Titre par défaut (masqué au hover) */}
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


// ============================================================
// SOUS-COMPOSANT — Onglet À propos / Actualités (partagé)
// ============================================================

interface ContentTabProps {
  title:       string;
  content:     string | undefined;
  emptyText:   string;
  ctaLabel:    string;
  onCtaClick:  () => void;
}

const ContentTab = ({ title, content, emptyText, ctaLabel, onCtaClick }: ContentTabProps) => (
  <div className="max-w-3xl mx-auto">
    <div className="bg-gray-800/50 backdrop-blur border border-white/10 rounded-xl p-8 shadow-2xl">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6">{title}</h2>
      {content
        ? <div className="prose prose-invert max-w-none"><ReactMarkdown>{content}</ReactMarkdown></div>
        : <p className="text-gray-500 italic">{emptyText}</p>
      }
      <div className="mt-8 pt-8 border-t border-gray-700 text-center">
        <button onClick={onCtaClick} className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-full font-bold transition text-lg">
          {ctaLabel}
        </button>
      </div>
    </div>
  </div>
);


// ============================================================
// SOUS-COMPOSANT — Modale Contact
// ============================================================

interface ContactModalProps {
  userName:      string;
  form:          ContactForm;
  status:        ContactStatus;
  onChange:      (field: keyof ContactForm, value: string) => void;
  onSend:        () => void;
  onClose:       () => void;
}

const ContactModal = ({ userName, form, status, onChange, onSend, onClose }: ContactModalProps) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
    <div className="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-md w-full">
      <h3 className="text-xl font-bold text-yellow-400 mb-4">Contacter {userName}</h3>

      {status === 'sent' ? (
        <div className="text-center py-8">
          <p className="text-green-400 text-lg font-bold">✓ Message envoyé !</p>
          <button onClick={onClose} className="mt-4 text-sm text-gray-400 hover:text-white">Fermer</button>
        </div>
      ) : (
        <>
          <input type="text"  placeholder="Votre nom *"   value={form.name}    onChange={e => onChange('name',    e.target.value)} className="w-full bg-black/30 p-3 rounded border border-white/10 text-white mb-3" />
          <input type="email" placeholder="Votre email *" value={form.email}   onChange={e => onChange('email',   e.target.value)} className="w-full bg-black/30 p-3 rounded border border-white/10 text-white mb-3" />
          <textarea           placeholder="Votre message *" value={form.message} onChange={e => onChange('message', e.target.value)} className="w-full bg-black/30 p-3 rounded border border-white/10 text-white h-28 mb-4" />
          {status === 'error' && <p className="text-red-400 text-sm mb-3">Erreur lors de l'envoi. Réessayez.</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400">Annuler</button>
            <button onClick={onSend} disabled={status === 'sending'}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded text-sm font-bold disabled:opacity-50">
              {status === 'sending' ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </>
      )}
    </div>
  </div>
);


// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

const PortfolioPage = () => {
  const { username }       = useParams<{ username: string }>();
  const { user: authUser } = useAuth();

  const [user, setUser]         = useState<any>(null);
  const [albums, setAlbums]     = useState<any[]>([]);
  const [userPages, setUserPages] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('projects');
  // Modale photo
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);


  const [showContact, setShowContact]   = useState(false);
  const [contactForm, setContactForm]   = useState<ContactForm>({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState<ContactStatus>('idle');


  // ── Chargement des données ────────────────────────────────

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await api.get(`/albums/portfolio/${username}`);
        setUser(res.data.user);
        setAlbums(res.data.albums);
        api.get(`/user-pages/${username}`)
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


  // ── Actions contact ───────────────────────────────────────

  const handleContactChange = (field: keyof ContactForm, value: string) =>
    setContactForm(f => ({ ...f, [field]: value }));

  const handleSendContact = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert('Merci de remplir tous les champs.');
      return;
    }
    setContactStatus('sending');
    try {
      await api.post('/users/contact', {
        toUserId:  user._id,
        fromName:  contactForm.name,
        fromEmail: contactForm.email,
        message:   contactForm.message
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


  // ── Rendu ─────────────────────────────────────────────────

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Chargement...</div>;
  if (!user)   return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Utilisateur introuvable</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">

      <PortfolioHero user={user} authUser={authUser} username={username} />
      <div className="h-12 bg-gray-900" />

      <TabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userPages={userPages}
        username={username!}
        blogUrl={getBlogUrl(user.name)}
      />

      {/* Contenu des onglets */}
      <div className="max-w-7xl mx-auto px-4 pb-24">
        {activeTab === 'projects' && (
          <TabProjects albums={albums} portfolioIntro={user.portfolioIntro} />
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
        {activeTab === 'services' && (
          <ContentTab
            title="Actualités"
            content={user.servicesDescription}
            emptyText="Informations non renseignées."
            ctaLabel="Demander un devis"
            onCtaClick={openContact}
          />
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-10 border-t border-gray-800 mt-10 text-gray-600 text-sm">
        © {new Date().getFullYear()} {user.name}. Portfolio Hélioscope.
      </div>

      {/* Bouton flottant contact */}
      <button onClick={openContact} title="Me contacter"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-400 text-black p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm transition transform hover:scale-110 z-50">
        <span>✉️</span>
        <span className="hidden sm:inline">Me Contacter</span>
      </button>

      {/* Modale photo + commentaire */}
      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}

      {/* Modale contact */}
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
