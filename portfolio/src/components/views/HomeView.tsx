import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile, Album } from '../../types';
import MarkdownRenderer from '../MarkdownRenderer';
import { pageVariants, containerVariants, itemVariants } from './variants';

interface HomeViewProps {
  profile: UserProfile | null;
  albums: Album[];
  navigateTo: (page: 'home' | 'galleries' | 'album' | 'about' | 'contact' | 'page', albumId?: string | null) => void;
}

const formatName = (name?: string): string => {
  if (!name) return 'Jac';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Jac';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const HomeView: React.FC<HomeViewProps> = ({ profile, albums, navigateTo }) => {
  const getHomeImage = () => {
    if (profile?.bannerImage) return `/uploads/${profile.bannerImage}`;
    if (albums.length > 0 && albums[0].coverImage) return `/uploads/${albums[0].coverImage}`;
    return null;
  };

  return (
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
      {profile?.tagline && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="home-tagline-card">
            <MarkdownRenderer>{profile.tagline}</MarkdownRenderer>
          </div>
        </div>
      )}
      <div className="home-text">
        <MarkdownRenderer>{profile?.portfolioIntro || "Bienvenue sur mon site, avec les photos que j'aime partager !"}</MarkdownRenderer>
      </div>

      {/* SECTION NOUVEAUTÉS - LES GALERIES DU PHOTOGRAPHE */}
      {albums.length > 0 && (
        <div className="home-news-section" style={{ marginTop: '50px' }}>
          <h2 className="section-title" style={{ marginBottom: '30px' }}>Nouveautés</h2>
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
        </div>
      )}
    </motion.div>
  );
};

export default HomeView;
