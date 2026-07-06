import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import Lightbox from '../components/Lightbox';

const EmbedAlbumView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) {
      setError("ID de galerie manquant.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Récupérer l'album
        const albumRes = await api.get(`/albums/${id}`);
        setAlbum(albumRes.data);

        // Récupérer les photos de l'album
        const photosRes = await api.get(`/albums/photos/${id}`);
        setPhotos(photosRes.data);
        setError(null);
      } catch (err: any) {
        console.error("Erreur chargement embed album:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError("Cette galerie est privée et ne peut pas être affichée publiquement.");
        } else {
          setError("Cette galerie n'existe pas ou a été supprimée.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white font-sans">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm tracking-wide">Chargement de la galerie...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white font-sans p-6 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-lg font-bold text-gray-200 mb-2">Accès restreint</h2>
        <p className="text-gray-400 text-sm max-w-md mb-6">{error}</p>
        
        {/* Logo de redirection */}
        <a 
          href={window.location.origin} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white transition"
        >
          <span>Propulsé par LuminaView</span>
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col relative select-none pb-16">
      {/* Header minimaliste */}
      <header className="p-5 border-b border-white/5 bg-black/30 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-tight">
              {album.title}
            </h1>
            {album.description && (
              <p className="text-xs md:text-sm text-gray-400 mt-1 font-light leading-relaxed max-w-2xl line-clamp-2">
                {album.description}
              </p>
            )}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
            <span>{photos.length} photo{photos.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </header>

      {/* Grille de photos */}
      <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-500 text-sm">Cette galerie ne contient aucune photo pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo._id}
                onClick={() => setLightboxIndex(index)}
                className="group relative cursor-pointer overflow-hidden rounded-xl bg-black/40 border border-white/5 aspect-square shadow-lg hover:shadow-2xl hover:border-yellow-500/30 transition-all duration-300"
              >
                <img
                  src={`/uploads/${photo.filename}`}
                  alt={photo.title || 'Photo'}
                  loading="lazy"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 select-none"
                />
                
                {/* Overlay au survol */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <h3 className="text-xs font-bold text-white truncate drop-shadow">
                    {photo.title || 'Sans titre'}
                  </h3>
                  {photo.description && (
                    <p className="text-[10px] text-gray-300 truncate font-light mt-0.5">
                      {photo.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Visionneuse Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Petit Badge flottant Luminaview */}
      <a 
        href={window.location.origin} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black/95 text-white border border-white/10 shadow-xl transition-all duration-300 group cursor-pointer text-xs"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
        </span>
        <span className="font-medium tracking-wide">
          Propulsé par <span className="text-yellow-400 font-bold group-hover:text-yellow-300 transition-colors">LuminaView</span>
        </span>
      </a>
    </div>
  );
};

export default EmbedAlbumView;
