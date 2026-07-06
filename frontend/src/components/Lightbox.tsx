// Version 1.3 (Toggle Description)

import React, { useState, useEffect } from 'react';

interface LightboxProps {
  photos: any[];
  initialIndex: number;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ photos, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showDesc, setShowDesc] = useState(false); // État pour afficher/masquer la description

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setShowDesc(false); // On cache la description quand on change d'image
  }, [currentIndex]);

  const currentPhoto = photos[currentIndex];

  if (!currentPhoto) return null;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
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

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col" onWheel={handleWheel}>

      {/* 1. ZONE HAUTE : Titre + Contrôles */}
      <div className="absolute top-0 left-0 w-full p-4 md:p-6 z-20 flex justify-between items-center pointer-events-none">
        <div className="text-white bg-white/[0.04] backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-auto max-w-[70%] font-medium shadow-md shadow-black/20">
          <h3 className="text-sm md:text-base tracking-wide truncate">
            {currentPhoto.title}
          </h3>
        </div>

        <div className="flex gap-3 items-center pointer-events-auto">
          <span className="text-white bg-white/[0.04] border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-md shadow-black/20">
            {currentIndex + 1} / {photos.length}
          </span>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shadow-md shadow-black/20 text-xl font-bold"
            title="Fermer"
          >
            ×
          </button>
        </div>
      </div>

      {/* 2. ZONE CENTRALE : L'image */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={`/uploads/${currentPhoto.filename}`}
          alt="Full"
          className="max-w-full max-h-full object-contain transition-transform duration-75 select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? 'grab' : 'default'
          }}
          draggable={false}
        />
      </div>

      {/* 3. BOUTON TOGGLE DESCRIPTION (En bas à droite) */}
      {currentPhoto.description && (
        <button
          onClick={() => setShowDesc(!showDesc)}
          className={`absolute bottom-6 right-6 z-30 text-white w-11 h-11 rounded-full shadow-xl flex items-center justify-center border border-white/10 hover:scale-105 active:scale-95 transition-all duration-300 ${
            showDesc ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-white/5 hover:bg-white/10 backdrop-blur-md'
          }`}
          title={showDesc ? "Masquer le commentaire" : "Voir le commentaire"}
        >
          {showDesc ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      )}

      {/* 4. ZONE BASSE : Description sous forme de bulle/carte flottante */}
      {showDesc && currentPhoto.description && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-gray-950/85 backdrop-blur-md border border-white/10 max-w-xl w-[calc(100%-2rem)] rounded-2xl shadow-2xl p-4 max-h-36 overflow-y-auto transition-all duration-300">
          <p className="text-white text-sm leading-relaxed text-center font-medium">
            {currentPhoto.description}
          </p>
        </div>
      )}

      {/* 5. Navigation Flèches */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-6 z-10 pointer-events-none">
        <button
          onClick={() => setCurrentIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1))}
          disabled={photos.length <= 1}
          className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-20 pointer-events-auto shadow-lg backdrop-blur-md"
          title="Précédent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => setCurrentIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1))}
          disabled={photos.length <= 1}
          className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-20 pointer-events-auto shadow-lg backdrop-blur-md"
          title="Suivant"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

    </div>
  );
};

export default Lightbox;
