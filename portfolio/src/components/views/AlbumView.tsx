import React from 'react';
import { motion } from 'framer-motion';
import { Album, Photo } from '../../types';
import { pageVariants, containerVariants, itemVariants } from './variants';

interface AlbumViewProps {
  selectedAlbumId: string | null;
  albums: Album[];
  photos: Photo[];
  loadingPhotos: boolean;
  onPhotoClick: (index: number) => void;
}

const AlbumView: React.FC<AlbumViewProps> = ({
  selectedAlbumId,
  albums,
  photos,
  loadingPhotos,
  onPhotoClick,
}) => {
  const currentAlbum = albums.find(a => a._id === selectedAlbumId);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      key="album"
    >
      <h2 className="section-title">{currentAlbum ? currentAlbum.title : 'Galerie'}</h2>
      {currentAlbum?.description && (
        <p style={{ color: '#666', marginBottom: '25px', fontStyle: 'italic' }}>
          {currentAlbum.description}
        </p>
      )}

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
              onClick={() => onPhotoClick(idx)}
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
  );
};

export default AlbumView;
