import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Photo } from '../types';

interface LightboxProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
  onComment: (index: number) => void;
  onReport: (index: number) => void;
}

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

const Lightbox: React.FC<LightboxProps> = ({
  photos,
  initialIndex,
  onClose,
  onComment,
  onReport,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [lightboxBgColor, setLightboxBgColor] = useState<'black' | 'gray' | 'white'>('black');
  const [showDescription, setShowDescription] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Fermer la visionneuse avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => console.error("Erreur exit fullscreen:", err));
        }
      } else if (e.key === 'ArrowRight' && photos.length > 1) {
        setCurrentIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'ArrowLeft' && photos.length > 1) {
        setCurrentIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, photos.length]);

  // Réinitialiser le zoom/position/description au changement de photo
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setShowDescription(false);
  }, [currentIndex]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error("Erreur d'entrée en plein écran:", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error("Erreur de sortie du plein écran:", err));
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const currentPhoto = photos[currentIndex];
  if (!currentPhoto) return null;

  return (
    <motion.div 
      className={`lightbox-overlay bg-${lightboxBgColor}`}
      variants={lightboxVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onWheel={handleWheel}
    >
      {/* Header */}
      <div className="lightbox-header">
        <span className="lightbox-title">
          {currentPhoto.title || 'Sans titre'}
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
          onClose();
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.error("Erreur exit fullscreen:", err));
          }
        }}>
          ×
        </button>
      </div>

      {/* Corps avec l'image zoomée */}
      <div 
        className="lightbox-body"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {photos.length > 1 && (
          <button 
            className="lightbox-nav-btn prev"
            onClick={() => setCurrentIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1))}
          >
            ‹
          </button>
        )}

        <motion.img 
          key={currentIndex}
          src={`/uploads/${currentPhoto.filename}`} 
          alt="Zoomed" 
          className="lightbox-img" 
          variants={imageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease'
          }}
          draggable={false}
        />

        {photos.length > 1 && (
          <button 
            className="lightbox-nav-btn next"
            onClick={() => setCurrentIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1))}
          >
            ›
          </button>
        )}
      </div>

      {/* Footer descriptif */}
      <div className="lightbox-footer">
        <span>{currentIndex + 1} / {photos.length}</span>
        {showDescription && currentPhoto.description && (
          <p className="lightbox-desc">{currentPhoto.description}</p>
        )}
      </div>

      {/* BOUTONS D'ACTION FLOTTANTS EN BAS À DROITE */}
      <div className="lightbox-actions">
        {currentPhoto.description && (
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
          onClick={() => onComment(currentIndex)}
          title="Ajouter un commentaire"
        >
          💬
        </button>
        <button 
          className="lightbox-action-btn report-btn" 
          onClick={() => onReport(currentIndex)}
          title="Signaler l'image"
        >
          🚩
        </button>
      </div>
    </motion.div>
  );
};

export default Lightbox;
