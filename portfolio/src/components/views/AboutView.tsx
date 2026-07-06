import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '../../types';
import MarkdownRenderer from '../MarkdownRenderer';
import { pageVariants } from './variants';

interface AboutViewProps {
  profile: UserProfile | null;
}

const formatName = (name?: string): string => {
  if (!name) return 'Jac';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Jac';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const AboutView: React.FC<AboutViewProps> = ({ profile }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      key="about"
    >
      <h2 className="section-title">À propos</h2>
      <div className="about-section">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', flexShrink: 0 }}>
          <div className="about-avatar-container">
            {profile?.avatar ? (
              <img src={`/uploads/${profile.avatar}`} alt="Avatar" className="about-avatar" />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', color: '#9ca3af', fontSize: '2rem' }}>👤</div>
            )}
          </div>
          {profile?.tagline && (
            <div className="about-tagline-card">
              <MarkdownRenderer>{profile.tagline}</MarkdownRenderer>
            </div>
          )}
        </div>
        <div className="about-content">
          <p style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--color-accent)', marginBottom: '15px' }}>
            {formatName(profile?.name)} — Photographies
          </p>
          <div className="about-bio">
            <MarkdownRenderer>{profile?.bio || "Bonjour à tous les amoureux de photographie et aux curieux qui passent par ici ! Bienvenue sur mon site, avec les photos que j'aime partager !"}</MarkdownRenderer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AboutView;
