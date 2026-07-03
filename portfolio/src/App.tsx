import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// Configuration du nom d'utilisateur LuminaView
const USERNAME = 'jac';

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
            {profile ? profile.name : 'Jac'}
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
              <div>
                <div className="home-photo-container">
                  {getHomeImage() ? (
                    <img 
                      src={getHomeImage()!} 
                      alt={profile?.name || 'Jac'} 
                      className="home-photo" 
                    />
                  ) : (
                    <div style={{ height: '300px', backgroundColor: '#eaeaea', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#999' }}>Aucun visuel d'accueil configuré</span>
                    </div>
                  )}
                </div>
                <div className="home-text">
                  <ReactMarkdown>{profile?.bio || "Bienvenue sur mon site, avec les photos que j'aime partager !"}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* PAGE : LISTE DES GALERIES */}
            {currentPage === 'galleries' && (
              <div>
                <h2 className="section-title">Mes Galeries</h2>
                {albums.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999', margin: '40px 0' }}>Aucune galerie publique configurée comme vedette.</p>
                ) : (
                  <div className="grid-gallery">
                    {albums.map((album) => (
                      <a 
                        key={album._id} 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); navigateTo('album', album._id); }}
                        className="gallery-card"
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
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PAGE : PHOTOS D'UN ALBUM (MASONRY GRID) */}
            {currentPage === 'album' && (
              <div>
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
                  <div className="masonry-grid">
                    {photos.map((photo, idx) => (
                      <div 
                        key={photo._id} 
                        className="masonry-item" 
                        onClick={() => setLightboxIndex(idx)}
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PAGE : A PROPOS */}
            {currentPage === 'about' && (
              <div>
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
                      {profile?.name || 'Jac'} — Photographies
                    </p>
                    <ReactMarkdown>{profile?.bio || "Bonjour à tous les amoureux de photographie et aux curieux qui passent par ici ! Bienvenue sur mon site, avec les photos que j'aime partager !"}</ReactMarkdown>
                    <p>Découvrez mes clichés classés par séries thématiques à travers l'onglet Galeries.</p>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE : CONTACT */}
            {currentPage === 'contact' && (
              <div>
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
              </div>
            )}
          </>
        )}
        
        {/* FOOTER & MENTION LUMINAVIEW */}
        <footer className="footer">
          <div>© 2026 - {profile?.name || 'Jac'}.</div>
          <div>
            Propulsé par <a href={window.location.origin} target="_blank" rel="noopener noreferrer">LuminaView</a>
          </div>
        </footer>
      </main>

      {/* VISIONNEUSE LIGHTBOX (PLEIN ÉCRAN NOIR) */}
      {lightboxIndex !== null && photos.length > 0 && (
        <div className="lightbox-overlay">
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

            <img 
              src={`/uploads/${photos[lightboxIndex].filename}`} 
              alt="Zoomed" 
              className="lightbox-img" 
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
        </div>
      )}

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
