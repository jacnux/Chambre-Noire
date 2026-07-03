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
  photos?: Photo[];
}

interface Photo {
  _id: string;
  filename: string;
  title: string;
  description?: string;
  tags?: string[];
  createdAt: string;
}

interface UserPageSection {
  _id: string;
  type: 'text' | 'gallery' | 'image' | 'split_text_gallery';
  content?: string;
  albumIds?: Album[];
  imageUrl?: string;
  summary?: boolean;
}

interface UserPage {
  _id: string;
  title: string;
  slug: string;
  coverImage?: string;
  menuGroup: 'none' | 'series' | 'exhibitions' | 'blog' | 'about';
  parentPageId?: string | { _id: string; title: string; slug: string };
  menuOrder: number;
  showInMenu: boolean;
  sections?: UserPageSection[];
  editorialSummary?: string;
}

const App: React.FC = () => {
  // Navigation par hash ou onglet
  const [currentPage, setCurrentPage] = useState<'home' | 'galleries' | 'album' | 'about' | 'contact' | 'page'>('home');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  
  // États de données
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pages, setPages] = useState<UserPage[]>([]);
  const [currentPageData, setCurrentPageData] = useState<UserPage | null>(null);
  
  // États UI
  const [loadingPageDetail, setLoadingPageDetail] = useState(false);
  
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

  // États pour le formulaire de signalement
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // État plein écran
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Choix de la couleur du fond de la lightbox ('black', 'gray', 'white')
  const [lightboxBgColor, setLightboxBgColor] = useState<'black' | 'gray' | 'white'>('black');

  // Afficher/Masquer le commentaire (description) de la photo
  const [showDescription, setShowDescription] = useState(false);

  // Charger le profil, les albums vedettes et les pages
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingProfile(true);
        const [profileRes, pagesRes] = await Promise.all([
          axios.get(`/api/albums/portfolio/${USERNAME}`),
          axios.get(`/api/user-pages/${USERNAME}`)
        ]);
        
        setProfile(profileRes.data.user);
        setAlbums(profileRes.data.albums || []);
        setPages(pagesRes.data || []);
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
    fetchData();
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

  // Nettoyer le formulaire de commentaire et de signalement lors d'un changement de photo
  useEffect(() => {
    setCommentAuthor('');
    setCommentEmail('');
    setCommentMessage('');
    setCommentSuccess(null);
    setCommentError(null);
    setShowCommentModal(false);
    setShowReportModal(false);
    setReportReason('');
    setReportSuccess(null);
    setReportError(null);
    setShowDescription(false);
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

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlbumId) {
      setReportError("Impossible de signaler cette image car l'album est introuvable.");
      return;
    }
    
    try {
      setSubmittingReport(true);
      setReportSuccess(null);
      setReportError(null);
      
      await axios.post('/api/reports', {
        type: 'album',
        targetId: selectedAlbumId,
        reason: reportReason.trim()
      });
      
      setReportSuccess("Le signalement a été transmis avec succès à l'administrateur.");
      setReportReason('');
      setTimeout(() => setShowReportModal(false), 2000);
    } catch (err: any) {
      console.error("Erreur envoi signalement:", err);
      setReportError(err.response?.data?.error || "Impossible d'envoyer le signalement pour le moment.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error("Erreur d'activation du plein écran:", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error("Erreur de sortie du plein écran:", err));
    }
  };

  // Écouter le changement de mode plein écran (ex: touche Échap)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Gérer la navigation
  const navigateTo = (page: 'home' | 'galleries' | 'album' | 'about' | 'contact' | 'page', albumId: string | null = null) => {
    setCurrentPage(page);
    setSelectedAlbumId(albumId);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPage = async (slug: string) => {
    try {
      setLoadingPageDetail(true);
      setMenuOpen(false);
      const res = await axios.get(`/api/user-pages/${USERNAME}/${slug}`);
      setCurrentPageData(res.data);
      setCurrentPage('page');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Erreur lors du chargement de la page:", err);
    } finally {
      setLoadingPageDetail(false);
    }
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

              {/* SECTION SÉRIES */}
              {pages.filter(p => p.menuGroup === 'series' && !p.parentPageId && p.showInMenu).length > 0 && (
                <li>
                  <span className="menu-section-title">Séries</span>
                  <ul className="submenu">
                    {pages.filter(p => p.menuGroup === 'series' && !p.parentPageId && p.showInMenu).map((page) => {
                      const children = pages.filter(p => typeof p.parentPageId === 'object' ? (p.parentPageId as any)?._id === page._id : p.parentPageId === page._id);
                      return (
                        <li key={page._id}>
                          <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); navigateToPage(page.slug); }}
                            className={currentPage === 'page' && currentPageData?.slug === page.slug ? 'active' : ''}
                          >
                            {page.title}
                          </a>
                          {children.length > 0 && (
                            <ul className="submenu-nested">
                              {children.map(child => (
                                <li key={child._id}>
                                  <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); navigateToPage(child.slug); }}
                                    className={currentPage === 'page' && currentPageData?.slug === child.slug ? 'active' : ''}
                                  >
                                    {child.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              )}

              {/* SECTION EXPOSITIONS */}
              {pages.filter(p => p.menuGroup === 'exhibitions' && !p.parentPageId && p.showInMenu).length > 0 && (
                <li>
                  <span className="menu-section-title">Expositions</span>
                  <ul className="submenu">
                    {pages.filter(p => p.menuGroup === 'exhibitions' && !p.parentPageId && p.showInMenu).map((page) => {
                      const children = pages.filter(p => typeof p.parentPageId === 'object' ? (p.parentPageId as any)?._id === page._id : p.parentPageId === page._id);
                      return (
                        <li key={page._id}>
                          <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); navigateToPage(page.slug); }}
                            className={currentPage === 'page' && currentPageData?.slug === page.slug ? 'active' : ''}
                          >
                            {page.title}
                          </a>
                          {children.length > 0 && (
                            <ul className="submenu-nested">
                              {children.map(child => (
                                <li key={child._id}>
                                  <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); navigateToPage(child.slug); }}
                                    className={currentPage === 'page' && currentPageData?.slug === child.slug ? 'active' : ''}
                                  >
                                    {child.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              )}

              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); navigateTo('galleries'); }}
                  className={currentPage === 'galleries' || currentPage === 'album' ? 'active' : ''}
                >
                  Galeries (Toutes)
                </a>
              </li>
              
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); navigateTo('about'); }}
                  className={currentPage === 'about' ? 'active' : ''}
                >
                  À propos
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

            {/* PAGE DE CONTENU DYNAMIQUE (SERIES / EXPOSITIONS) */}
            {loadingPageDetail ? (
              <div className="loader-container">
                <div className="spinner"></div>
                <p>Chargement de la page...</p>
              </div>
            ) : currentPage === 'page' && currentPageData && (
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                key={currentPageData.slug}
              >
                <h2 className="section-title">{currentPageData.title}</h2>
                {currentPageData.editorialSummary && (
                  <div className="home-text" style={{ padding: 0, marginBottom: '30px' }}>
                    <ReactMarkdown>{currentPageData.editorialSummary}</ReactMarkdown>
                  </div>
                )}
                
                <div className="page-sections">
                  {currentPageData.sections?.map((section) => {
                    if (section.type === 'text' && section.content) {
                      return (
                        <div key={section._id} className="home-text" style={{ padding: 0, marginBottom: '30px' }}>
                          <ReactMarkdown>{section.content}</ReactMarkdown>
                        </div>
                      );
                    }
                    
                    if ((section.type === 'gallery' || section.type === 'split_text_gallery') && section.albumIds) {
                      return (
                        <div key={section._id} className="nested-album-sections" style={{ marginBottom: '40px' }}>
                          {section.albumIds.map((album) => {
                            const albumPhotos = album.photos || [];
                            return (
                              <div key={album._id} className="nested-album-gallery" style={{ marginBottom: '30px' }}>
                                {album.title && <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--color-accent)', textTransform: 'uppercase', fontSize: '1.2rem', marginBottom: '10px' }}>{album.title}</h3>}
                                {album.description && <p style={{ fontStyle: 'italic', color: '#666', marginBottom: '20px' }}>{album.description}</p>}
                                
                                {albumPhotos.length === 0 ? (
                                  <p style={{ color: '#999', fontSize: '0.9rem' }}>Cette galerie ne contient pas de photos.</p>
                                ) : (
                                  <motion.div 
                                    className="masonry-grid"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                  >
                                    {albumPhotos.map((photo, idx) => (
                                      <motion.div 
                                        key={photo._id} 
                                        className="masonry-item" 
                                        onClick={() => {
                                          setPhotos(albumPhotos);
                                          setLightboxIndex(idx);
                                        }}
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
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    
                    if (section.type === 'image' && section.imageUrl) {
                      return (
                        <div key={section._id} className="section-block image-block" style={{ marginBottom: '30px' }}>
                          <img src={`/uploads/${section.imageUrl}`} alt="" style={{ maxWidth: '100%', borderRadius: '4px' }} />
                        </div>
                      );
                    }
                    
                    return null;
                  })}
                </div>
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
            className={`lightbox-overlay bg-${lightboxBgColor}`}
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

              <div className="lightbox-bg-selector">
                <button 
                  className={`bg-dot black ${lightboxBgColor === 'black' ? 'active' : ''}`}
                  onClick={() => setLightboxBgColor('black')}
                  title="Fond Noir"
                />
                <button 
                  className={`bg-dot gray ${lightboxBgColor === 'gray' ? 'active' : ''}`}
                  onClick={() => setLightboxBgColor('gray')}
                  title="Fond Gris"
                />
                <button 
                  className={`bg-dot white ${lightboxBgColor === 'white' ? 'active' : ''}`}
                  onClick={() => setLightboxBgColor('white')}
                  title="Fond Blanc"
                />
              </div>
              <button className="lightbox-close" onClick={() => {
                setLightboxIndex(null);
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(err => console.error("Erreur exit fullscreen:", err));
                }
              }}>
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
              {showDescription && photos[lightboxIndex].description && (
                <p className="lightbox-desc">{photos[lightboxIndex].description}</p>
              )}
            </div>

            {/* BOUTONS D'ACTION FLOTTANTS EN BAS À DROITE */}
            <div className="lightbox-actions">
              {photos[lightboxIndex].description && (
                <button 
                  className={`lightbox-action-btn desc-toggle-btn ${showDescription ? 'active' : ''}`}
                  onClick={() => setShowDescription(!showDescription)}
                  title={showDescription ? "Masquer la description" : "Afficher la description"}
                >
                  ℹ️
                </button>
              )}
              <button 
                className="lightbox-action-btn fullscreen-btn" 
                onClick={toggleFullscreen}
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? "🗗" : "⛶"}
              </button>
              <button 
                className="lightbox-action-btn comment-btn" 
                onClick={() => setShowCommentModal(true)}
                title="Ajouter un commentaire"
              >
                💬
              </button>
              <button 
                className="lightbox-action-btn report-btn" 
                onClick={() => setShowReportModal(true)}
                title="Signaler l'image"
              >
                🚩
              </button>
            </div>

            {/* MODALE INTERNE : AJOUTER UN COMMENTAIRE */}
            {showCommentModal && (
              <div className="lightbox-popup-overlay" onClick={() => setShowCommentModal(false)}>
                <div className="lightbox-popup-card" onClick={e => e.stopPropagation()}>
                  <div className="popup-header">
                    <h4>Ajouter un commentaire</h4>
                    <button className="popup-close" onClick={() => setShowCommentModal(false)}>×</button>
                  </div>
                  
                  {commentSuccess && <div className="comment-alert success">{commentSuccess}</div>}
                  {commentError && <div className="comment-alert error">{commentError}</div>}
                  
                  <form onSubmit={handleCommentSubmit} className="lightbox-comment-form">
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
                      <label>Email (optionnel) :</label>
                      <input 
                        type="email" 
                        value={commentEmail} 
                        onChange={e => setCommentEmail(e.target.value)} 
                        placeholder="nom@exemple.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Message :</label>
                      <textarea 
                        rows={4} 
                        value={commentMessage} 
                        onChange={e => setCommentMessage(e.target.value)} 
                        required 
                        placeholder="Laissez votre commentaire..."
                      />
                    </div>
                    <div className="popup-actions">
                      <button type="button" className="btn-cancel" onClick={() => setShowCommentModal(false)}>Annuler</button>
                      <button 
                        type="submit" 
                        className="btn-submit-comment"
                        disabled={submittingComment}
                      >
                        {submittingComment ? "Envoi..." : "Envoyer"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODALE INTERNE : SIGNALER UN CONTENU INAPPROPRIÉ */}
            {showReportModal && (
              <div className="lightbox-popup-overlay" onClick={() => setShowReportModal(false)}>
                <div className="lightbox-popup-card" onClick={e => e.stopPropagation()}>
                  <div className="popup-header">
                    <h4 style={{ color: '#ef4444' }}>Signaler l'image</h4>
                    <button className="popup-close" onClick={() => setShowReportModal(false)}>×</button>
                  </div>
                  
                  {reportSuccess && <div className="comment-alert success">{reportSuccess}</div>}
                  {reportError && <div className="comment-alert error">{reportError}</div>}
                  
                  <form onSubmit={handleSendReport} className="lightbox-comment-form">
                    <p style={{ fontSize: '0.8rem', color: '#b3b3b3', marginBottom: '10px' }}>
                      Veuillez indiquer la raison pour laquelle vous estimez cette image inappropriée.
                    </p>
                    <div className="form-group">
                      <label>Raison du signalement :</label>
                      <textarea 
                        rows={4} 
                        value={reportReason} 
                        onChange={e => setReportReason(e.target.value)} 
                        required 
                        placeholder="Ex: Image inappropriée, droit d'auteur..."
                      />
                    </div>
                    <div className="popup-actions">
                      <button type="button" className="btn-cancel" onClick={() => setShowReportModal(false)}>Annuler</button>
                      <button 
                        type="submit" 
                        className="btn-submit-comment"
                        style={{ backgroundColor: '#ef4444' }}
                        disabled={submittingReport}
                      >
                        {submittingReport ? "Envoi..." : "Signaler"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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
