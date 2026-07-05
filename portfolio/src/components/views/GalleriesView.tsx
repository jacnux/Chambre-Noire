import React from 'react';
import { motion } from 'framer-motion';
import { Album } from '../../types';
import { pageVariants, containerVariants, itemVariants } from './variants';

interface GalleriesViewProps {
  albums: Album[];
  navigateTo: (page: 'home' | 'galleries' | 'album' | 'about' | 'contact' | 'page', albumId?: string | null) => void;
}

const GalleriesView: React.FC<GalleriesViewProps> = ({ albums, navigateTo }) => {
  return (
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
  );
};

export default GalleriesView;
