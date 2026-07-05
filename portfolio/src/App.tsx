import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AnimatePresence } from 'framer-motion';

// Types
import { UserProfile, Album, Photo, UserPage } from './types';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Lightbox from './components/Lightbox';
import CommentModal from './components/CommentModal';
import ReportModal from './components/ReportModal';

// Views
import HomeView from './components/views/HomeView';
import GalleriesView from './components/views/GalleriesView';
import AlbumView from './components/views/AlbumView';
import AboutView from './components/views/AboutView';
import ContactView from './components/views/ContactView';
import PageView from './components/views/PageView';

// Détection dynamique de l'utilisateur pour le multi-hébergement (multi-tenant)
const getUsernameFromEnvironment = (): string => {
  const params = new URLSearchParams(window.location.search);
  const queryUser = params.get('u') || params.get('user');
  if (queryUser) return queryUser.trim();

  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
    return parts[0].trim();
  }

  return 'jac';
};

const USERNAME = getUsernameFromEnvironment();

const App: React.FC = () => {
  // Navigation
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
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // États pour les formulaires de retour
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

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

  // Réinitialiser les états de popup lors du changement de photo
  useEffect(() => {
    setCommentSuccess(null);
    setCommentError(null);
    setReportSuccess(null);
    setReportError(null);
    setShowCommentModal(false);
    setShowReportModal(false);
  }, [lightboxIndex]);

  const handleCommentSubmit = async (authorName: string, authorEmail: string, message: string) => {
    if (lightboxIndex === null || photos.length === 0) return;
    const photo = photos[lightboxIndex];
    
    try {
      setSubmittingComment(true);
      setCommentSuccess(null);
      setCommentError(null);
      
      await axios.post(`/api/comments/${photo._id}`, {
        authorName,
        authorEmail,
        message
      });
      
      setCommentSuccess("Votre commentaire a été envoyé avec succès au photographe !");
    } catch (err: any) {
      console.error("Erreur envoi commentaire:", err);
      setCommentError(err.response?.data?.error || "Impossible d'envoyer le commentaire pour le moment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSendReport = async (reason: string) => {
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
        reason: reason.trim()
      });
      
      setReportSuccess("Le signalement a été transmis avec succès à l'administrateur.");
      setTimeout(() => setShowReportModal(false), 2000);
    } catch (err: any) {
      console.error("Erreur envoi signalement:", err);
      setReportError(err.response?.data?.error || "Impossible d'envoyer le signalement pour le moment.");
    } finally {
      setSubmittingReport(false);
    }
  };

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

  return (
    <div className="page-container">
      {/* Sidebar Navigation */}
      <Header
        profile={profile}
        pages={pages}
        currentPage={currentPage}
        currentPageData={currentPageData}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        navigateTo={navigateTo}
        navigateToPage={navigateToPage}
      />

      {/* Main Content Area */}
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

            {currentPage === 'home' && (
              <HomeView profile={profile} albums={albums} navigateTo={navigateTo} />
            )}

            {currentPage === 'galleries' && (
              <GalleriesView albums={albums} navigateTo={navigateTo} />
            )}

            {currentPage === 'album' && (
              <AlbumView
                selectedAlbumId={selectedAlbumId}
                albums={albums}
                photos={photos}
                loadingPhotos={loadingPhotos}
                onPhotoClick={(idx) => setLightboxIndex(idx)}
              />
            )}

            {currentPage === 'page' && (
              loadingPageDetail ? (
                <div className="loader-container">
                  <div className="spinner"></div>
                  <p>Chargement de la page...</p>
                </div>
              ) : currentPageData && (
                <PageView
                  pageData={currentPageData}
                  onPhotoClick={(albumPhotos, idx) => {
                    setPhotos(albumPhotos);
                    setLightboxIndex(idx);
                  }}
                  navigateToPage={navigateToPage}
                />
              )
            )}

            {currentPage === 'about' && (
              <AboutView profile={profile} />
            )}

            {currentPage === 'contact' && (
              <ContactView />
            )}
          </>
        )}

        <Footer profile={profile} />
      </main>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && photos.length > 0 && (
          <Lightbox
            photos={photos}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onComment={(idx) => {
              setLightboxIndex(idx);
              setShowCommentModal(true);
            }}
            onReport={(idx) => {
              setLightboxIndex(idx);
              setShowReportModal(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Comment Form Popup */}
      {showCommentModal && lightboxIndex !== null && photos.length > lightboxIndex && (
        <CommentModal
          photo={photos[lightboxIndex]}
          onClose={() => setShowCommentModal(false)}
          onSubmit={handleCommentSubmit}
          submitting={submittingComment}
          success={commentSuccess}
          error={commentError}
        />
      )}

      {/* Report Form Popup */}
      {showReportModal && lightboxIndex !== null && photos.length > lightboxIndex && (
        <ReportModal
          photo={photos[lightboxIndex]}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleSendReport}
          submitting={submittingReport}
          success={reportSuccess}
          error={reportError}
        />
      )}

      {/* Bottom Floating Watermark Badge */}
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
