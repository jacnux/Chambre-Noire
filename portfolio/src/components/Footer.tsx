import React from 'react';
import { UserProfile } from '../types';

interface FooterProps {
  profile: UserProfile | null;
}

const formatName = (name?: string): string => {
  if (!name) return 'Jac';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Jac';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const Footer: React.FC<FooterProps> = ({ profile }) => {
  return (
    <footer className="footer">
      <div>© 2026 - {formatName(profile?.name)}.</div>
      <div>
        Propulsé par <a href={window.location.origin} target="_blank" rel="noopener noreferrer">LuminaView</a>
      </div>
    </footer>
  );
};

export default Footer;
