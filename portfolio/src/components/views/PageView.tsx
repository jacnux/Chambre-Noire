import React from 'react';
import { motion } from 'framer-motion';
import { UserPage, Photo } from '../../types';
import MarkdownRenderer from '../MarkdownRenderer';
import { pageVariants, containerVariants, itemVariants } from './variants';

interface PageViewProps {
  pageData: UserPage;
  onPhotoClick: (photos: Photo[], index: number) => void;
  navigateToPage: (slug: string) => void;
}

const PageView: React.FC<PageViewProps> = ({
  pageData,
  onPhotoClick,
  navigateToPage,
}) => {
  const pageSections = pageData.sections || [];
  const summaryTextSection = pageSections.find(s => s.type === 'text' && s.summary);
  const firstTextSection = pageSections.find(s => s.type === 'text');
  const introContent = pageData.editorialSummary || summaryTextSection?.content || firstTextSection?.content || '';

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      key={pageData.slug}
    >
      <h2 className="section-title">{pageData.title}</h2>
      {introContent && (
        <div className="home-text">
          <MarkdownRenderer>{introContent}</MarkdownRenderer>
        </div>
      )}
      
      {/* SOUS-PAGES / CARTES DES ENFANTS */}
      {pageData.childPages && pageData.childPages.length > 0 && (
        <div className="child-pages-section" style={{ marginTop: '20px', marginBottom: '40px' }}>
          <h3 className="section-subtitle" style={{ 
            fontFamily: 'var(--font-title)', 
            fontSize: '1.2rem', 
            color: 'var(--color-accent)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            marginBottom: '20px',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '8px'
          }}>
            Séries associées
          </h3>
          <motion.div 
            className="grid-gallery"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {pageData.childPages.map((child) => (
              <motion.a 
                key={child._id} 
                href="#" 
                onClick={(e) => { e.preventDefault(); navigateToPage(child.slug); }}
                className="gallery-card"
                variants={itemVariants}
              >
                <div className="gallery-cover-container">
                  {child.coverImage ? (
                    <img 
                      src={`/uploads/${child.coverImage}`} 
                      alt={child.title} 
                      className="gallery-cover" 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', color: '#9ca3af' }}>📷</div>
                  )}
                </div>
                <div className="gallery-info">
                  <h3>{child.title}</h3>
                  {child.editorialSummary && <p>{child.editorialSummary}</p>}
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      )}

      <div className="page-sections">
        {pageSections.map((section) => {
          if (section.type === 'text' && section.content) {
            const isHeaderIntroSection =
              section === summaryTextSection ||
              (!summaryTextSection && section === firstTextSection) ||
              section.content === introContent ||
              (section._id && summaryTextSection && section._id === summaryTextSection._id) ||
              (!summaryTextSection && section._id && firstTextSection && section._id === firstTextSection._id);

            if (isHeaderIntroSection) return null;

            return (
              <div key={section._id} className="home-text">
                <MarkdownRenderer>{section.content}</MarkdownRenderer>
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
                      {album.title && (() => {
                        const t1 = album.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
                        const t2 = pageData.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
                        const isSame = t1 === t2 || t1.includes(t2) || t2.includes(t1);
                        if (isSame) return null;
                        return (
                          <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--color-accent)', textTransform: 'uppercase', fontSize: '1.2rem', marginBottom: '10px' }}>
                            {album.title}
                          </h3>
                        );
                      })()}
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
                              onClick={() => onPhotoClick(albumPhotos, idx)}
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
          
          return null;
        })}
      </div>
    </motion.div>
  );
};

export default PageView;
