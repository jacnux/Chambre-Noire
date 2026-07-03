import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.2 } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const lightboxVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const imageVariants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } }
};

// Détection dynamique de l'utilisateur pour le multi-hébergement (multi-tenant)
const getUsernameFromEnvironment = (): string => {
  // 1. Détection via paramètre de requête (ex: http://localhost:8090/?u=anita)
  const params = new URLSearchParams(window.location.search);
  const queryUser = params.get('u') || params.get('user');
  if (queryUser) return queryUser.trim();

  // 2. Détection via sous-domaine (ex: anita.luminaview.local)
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
    return parts[0].trim();
  }

  // 3. Utilisateur par défaut
  return 'jac';
};

const USERNAME = getUsernameFromEnvironment();

const formatName = (name?: string): string => {
  if (!name) return 'Jac';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Jac';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  portfolioIntro?: string;
  bannerImage?: string;
}

interface Album {
  _id: string;
  title: string;
  description?: string;
  coverImage?: string;
  isPublic: boolean;
}

interface Photo {
  _id: string;
  filename: string;
  title: string;
  description?: string;
  tags?: string[];
  createdAt: string;
}

const App: React.FC = () => {
  // Navigation par hash ou onglet
  const [currentPage, setCurrentPage] = useState<'home' | 'galleries' | 'album' | 'about' | 'contact'>('home');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  
  // États de données
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  
  // États UI
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // États pour le formulaire de commentaire
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentMessage, setCommentMessage] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Charger le profil et les albums vedettes
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await axios.get(`/api/albums/portfolio/${USERNAME}`);
        setProfile(res.data.user);
        setAlbums(res.data.albums || []);
      } catch (err: any) {
        console.error("Erreur lors de la récupération du portfolio:", err);
        // Profil de secours si l'API n'est pas accessible
        setProfile({
          name: "Jac",
          email: "jeanalbert.canal@gmail.com",
          bio: "Bonjour à tous les amoureux de photographie et aux curieux qui passent par ici ! Bienvenue sur mon site, avec les photos que j'aime partager !",
          portfolioIntro: "Bonjour à tous les amoureux de photographie et aux curieux qui passent par ici !"
        });
        setError("Impossible de charger les galeries depuis le serveur LuminaView. Affichage du mode hors-ligne.");
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Charger les photos quand un album est sélectionné
  useEffect(() => {
    if (!selectedAlbumId) return;
    const fetchPhotos = async () => {
      try {
        setLoadingPhotos(true);
        const res = await axios.get(`/api/albums/photos/${selectedAlbumId}`);
        setPhotos(res.data || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des photos:", err);
        setPhotos([]);
      } finally {
        setLoadingPhotos(false);
      }
    };
    fetchPhotos();
  }, [selectedAlbumId]);

  // Nettoyer le formulaire de commentaire lors d'un changement de photo
  useEffect(() => {
    setCommentAuthor('');
    setCommentEmail('');
    setCommentMessage('');
    setCommentSuccess(null);
    setCommentError(null);
  }, [lightboxIndex]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lightboxIndex === null || photos.length === 0) return;
    const photo = photos[lightboxIndex];
    
    try {
      setSubmittingComment(true);
      setCommentSuccess(null);
      setCommentError(null);
      
      await axios.post(`/api/comments/${photo._id}`, {
        authorName: commentAuthor,
        authorEmail: commentEmail,
        message: commentMessage
      });
      
      setCommentSuccess("Votre commentaire a été envoyé avec succès au photographe !");
      setCommentMessage('');
    } catch (err: any) {
      console.error("Erreur envoi commentaire:", err);
      setCommentError(err.response?.data?.error || "Impossible d'envoyer le commentaire pour le moment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Gérer la navigation
  const navigateTo = (page: 'home' | 'galleries' | 'album' | 'about' | 'contact', albumId: string | null = null) => {
    setCurrentPage(page);
    setSelectedAlbumId(albumId);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Trouver l'image d'accueil (bannière de l'utilisateur ou couverture du premier album)
  const getHomeImage = () => {
    if (profile?.bannerImage) return `/uploads/${profile.bannerImage}`;
    if (albums.length > 0 && albums[0].coverImage) return `/uploads/${albums[0].coverImage}`;
    return null;
  };

  return (
    <div className="page-container">
      {/* HEADER COMPOSANT - Inspiré de jac.artfolio.com */}
      <header className="header">
        <div className="header-title">
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} className="logo">
            {formatName(profile?.name)}
          </a>
          <div className="header-subtitle">Photographies</div>
        </div>

        {/* Bouton Hamburger Mobile */}
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>

        {/* Barre de navigation */}
        <div className="menu-bg">
          <nav id="menu-container">
            <ul className={`menu ${menuOpen ? 'open' : ''}`}>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); navigateTo('home'); }}
                  className={currentPage === 'home' ? 'active' : ''}
                >
                  Accueil
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); navigateTo('galleries'); }}
                  className={currentPage === 'galleries' || currentPage === 'album' ? 'active' : ''}
                >
                  Galeries
                </a>
              </li>
              
              {/* Albums Vedettes insérés dynamiquement dans le menu */}
              {albums.slice(0, 3).map((album) => (
                <li key={album._id}>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); navigateTo('album', album._id); }}
                    className={currentPage === 'album' && selectedAlbumId === album._id ? 'active' : ''}
                  >
                    {album.title}
                  </a>
                </li>
              ))}
              
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); navigateTo('about'); }}
                  className={currentPage === 'about' ? 'active' : ''}
                >
                  À propos de...
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); navigateTo('contact'); }}
                  className={currentPage === 'contact' ? 'active' : ''}
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* ZONE DE CONTENU PRINCIPALE */}
      <main className="content-wrapper">
        {loadingProfile ? (
          <div className="loader-container">
            <div className="spinner"></div>
            <p>Chargement du portfolio...</p>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', padding: '10px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.85rem', textAlign: 'center', fontFamily: 'var(--font-title)' }}>
                ⚠️ {error}
              </div>
            )}
            {/* PAGE : ACCUEIL */}
            {currentPage === 'home' && (
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                key="home"
              >
                <div className="home-photo-container">
                  {getHomeImage() ? (
                    <img 
                      src={getHomeImage()!} 
                      alt={formatName(profile?.name)} 
                      className="home-photo" 
                    />
                  ) : (
                    <div style={{ height: '300px', backgroundColor: '#eaeaea', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#999' }}>Aucun visuel d'accueil configuré</span>
                    </div>
                  )}
                </div>
                <div className="home-text">
                  <ReactMarkdown>{profile?.portfolioIntro || "Bienvenue sur mon site, avec les photos que j'aime partager !"}</ReactMarkdown>
                </div>
              </motion.div>
            )}

            {/* PAGE : LISTE DES GALERIES */}
            {currentPage === 'galleries' && (
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                key="galleries"
              >
                <h2 className="section-title">Mes Galeries</h2>
                {albums.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999', margin: '40px 0' }}>Aucune galerie publique configurée comme vedette.</p>
                ) : (
                  <motion.div 
                    className="grid-gallery"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {albums.map((album) => (
                      <motion.a 
                        key={album._id} 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); navigateTo('album', album._id); }}
                        className="gallery-card"
                        variants={itemVariants}
                      >
                        <div className="gallery-cover-container">
                          {album.coverImage ? (
                            <img 
                              src={`/uploads/${album.coverImage}`} 
                              alt={album.title} 
                              className="gallery-cover" 
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', color: '#9ca3af' }}>📷</div>
                          )}
                        </div>
                        <div className="gallery-info">
                          <h3>{album.title}</h3>
                          {album.description && <p>{album.description}</p>}
                        </div>
                      </motion.a>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* PAGE : PHOTOS D'UN ALBUM (MASONRY GRID) */}
            {currentPage === 'album' && (
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                key="album"
              >
                {(() => {
                  const currentAlbum = albums.find(a => a._id === selectedAlbumId);
                  return (
                    <>
                      <h2 className="section-title">{currentAlbum ? currentAlbum.title : 'Galerie'}</h2>
                      {currentAlbum?.description && (
                        <p style={{ color: '#666', marginBottom: '25px', fontStyle: 'italic' }}>
                          {currentAlbum.description}
                        </p>
                      )}
                    </>
                  );
                })()}

                {loadingPhotos ? (
                  <div className="loader-container">
                    <div className="spinner"></div>
                    <p>Chargement des photos...</p>
                  </div>
                ) : photos.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999', margin: '40px 0' }}>Cette galerie ne contient aucune photo.</p>
                ) : (
                  <motion.div 
                    className="masonry-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {photos.map((photo, idx) => (
                      <motion.div 
                        key={photo._id} 
                        className="masonry-item" 
                        onClick={() => setLightboxIndex(idx)}
                        variants={itemVariants}
                      >
                        <img 
                          src={`/uploads/${photo.filename}`} 
                          alt={photo.title} 
                          className="masonry-img" 
                          loading="lazy"
                        />
                        <div className="masonry-overlay">
                          <h4>{photo.title || 'Sans titre'}</h4>
                          {photo.description && <p>{photo.description}</p>}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* PAGE : A PROPOS */}
            {currentPage === 'about' && (
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                key="about"
              >
                <h2 className="section-title">À propos</h2>
                <div className="about-section">
                  <div className="about-avatar-container">
                    {profile?.avatar ? (
                      <img src={`/uploads/${profile.avatar}`} alt="Avatar" className="about-avatar" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', color: '#9ca3af', fontSize: '2rem' }}>👤</div>
                    )}
                  </div>
                  <div className="about-content">
                    <p style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--color-accent)', marginBottom: '15px' }}>
                      {formatName(profile?.name)} — Photographies
                    </p>
                    <ReactMarkdown>{profile?.bio || "Bonjour à tous les amoureux de photographie et aux curieux qui passent par ici ! Bienvenue sur mon site, avec les photos que j'aime partager !"}</ReactMarkdown>
                    <p>Découvrez mes clichés classés par séries thématiques à travers l'onglet Galeries.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PAGE : CONTACT */}
            {currentPage === 'contact' && (
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                key="contact"
              >
                <h2 className="section-title">Me Contacter</h2>
                <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert("Message envoyé ! (Simulation)"); }}>
                  <div>
                    <label>Nom complet :</label>
                    <input type="text" className="form-input" required placeholder="Votre nom" />
                  </div>
                  <div>
                    <label>Adresse e-mail :</label>
                    <input type="email" className="form-input" required placeholder="Votre email" />
                  </div>
                  <div>
                    <label>Message :</label>
                    <textarea rows={6} className="form-textarea" required placeholder="Votre message..."></textarea>
                  </div>
                  <button type="submit" className="btn-submit">Envoyer</button>
                </form>
              </motion.div>
            )}
          </>
        )}
        
        {/* FOOTER & MENTION LUMINAVIEW */}
        <footer className="footer">
          <div>© 2026 - {formatName(profile?.name)}.</div>
          <div>
            Propulsé par <a href={window.location.origin} target="_blank" rel="noopener noreferrer">LuminaView</a>
          </div>
        </footer>
      </main>

      {/* VISIONNEUSE LIGHTBOX (PLEIN ÉCRAN NOIR) */}
      <AnimatePresence>
        {lightboxIndex !== null && photos.length > 0 && (
          <motion.div 
            className="lightbox-overlay"
            variants={lightboxVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Header */}
            <div className="lightbox-header">
              <span className="lightbox-title">
                {photos[lightboxIndex].title || 'Sans titre'}
              </span>
              <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>
                ×
              </button>
            </div>

            {/* Corps avec l'image zoomée */}
            <div className="lightbox-body">
              {photos.length > 1 && (
                <button 
                  className="lightbox-nav-btn prev"
                  onClick={() => setLightboxIndex(prev => (prev === null || prev === 0 ? photos.length - 1 : prev - 1))}
                >
                  ‹
                </button>
              )}

              <motion.img 
                key={lightboxIndex}
                src={`/uploads/${photos[lightboxIndex].filename}`} 
                alt="Zoomed" 
                className="lightbox-img" 
                variants={imageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              />

              {photos.length > 1 && (
                <button 
                  className="lightbox-nav-btn next"
                  onClick={() => setLightboxIndex(prev => (prev === null || prev === photos.length - 1 ? 0 : prev + 1))}
                >
                  ›
                </button>
              )}
            </div>

            {/* Footer descriptif */}
            <div className="lightbox-footer">
              <span>{lightboxIndex + 1} / {photos.length}</span>
              {photos[lightboxIndex].description && (
                <p className="lightbox-desc">{photos[lightboxIndex].description}</p>
              )}
            </div>

            {/* Formulaire de commentaire sous le footer de la lightbox */}
            <div className="lightbox-comments">
              <h4>Ajouter un commentaire</h4>
              <p className="comments-notice">Votre message sera envoyé directement au photographe.</p>
              
              {commentSuccess && <div className="comment-alert success">{commentSuccess}</div>}
              {commentError && <div className="comment-alert error">{commentError}</div>}
              
              <form onSubmit={handleCommentSubmit} className="lightbox-comment-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom :</label>
                    <input 
                      type="text" 
                      value={commentAuthor} 
                      onChange={e => setCommentAuthor(e.target.value)} 
                      required 
                      placeholder="Votre nom"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email :</label>
                    <input 
                      type="email" 
                      value={commentEmail} 
                      onChange={e => setCommentEmail(e.target.value)} 
                      placeholder="nom@exemple.com"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Message :</label>
                  <textarea 
                    rows={3} 
                    value={commentMessage} 
                    onChange={e => setCommentMessage(e.target.value)} 
                    required 
                    placeholder="Laissez votre commentaire..."
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-submit-comment"
                  disabled={submittingComment}
                >
                  {submittingComment ? "Envoi..." : "Envoyer le commentaire"}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILIGRANE FLOTTANT D'INTÉGRATION */}
      <a 
        href={window.location.origin} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="watermark-badge"
      >
        <span className="dot"></span>
        <span>Propulsé par <strong style={{ color: 'var(--color-accent)' }}>LuminaView</strong></span>
      </a>
    </div>
  );
};

export default App;
