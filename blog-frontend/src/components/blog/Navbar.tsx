import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getBlogSlug } from '../../utils/getBlogSlug';
import { getMainAppUrl } from '../../utils/blogApi';
import DarkModeToggle from './DarkModeToggle';

interface NavbarProps {
  themeClass?: string;
}

const Navbar: React.FC<NavbarProps> = ({ themeClass }) => {
  const location = useLocation();
  const blogName = getBlogSlug(location.search);
  const getCleanQueryString = () => {
    const params = new URLSearchParams(location.search);
    params.delete('preview');
    const paramStr = params.toString();
    return paramStr ? `?${paramStr}` : '';
  };
  const s = getCleanQueryString(); // raccourci pour les query strings sans preview
  const isPortfolio = themeClass === 'theme-portfolio';

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `nav-link px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
      isActive 
        ? 'nav-link-active text-amber-600 dark:text-amber-400 font-semibold border-b-2 border-amber-600 dark:border-amber-400 rounded-none bg-amber-500/[0.04] dark:bg-amber-500/[0.06]' 
        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
    }`;
  };

  const getPortfolioUrl = () => {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isPortfolio) {
      // Thème ARTFOLIO -> va vers le portfolio autonome
      if (isLocal) return `http://localhost:8090`;
      return `https://${blogName}.helioscope.fr`;
    } else {
      // Thème HÉLIOSCOPE -> va vers le portfolio intégré dans l'app principale
      if (isLocal) return `http://localhost/portfolio/${blogName}`;
      return `${getMainAppUrl()}/portfolio/${blogName}`;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/85 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.06] shadow-sm transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-3.5">
        <Link to={`/${s}`} className="blog-logo text-lg font-bold tracking-wider text-gray-950 dark:text-white hover:opacity-85 transition duration-200">
          HELIOSCOPE <span style={{ color: 'var(--primary)' }} className="text-amber-600 dark:text-amber-500 font-medium">/ {blogName.toUpperCase()}</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link to={`/${s}`} className={getLinkClass('/')}>Articles</Link>
          <Link to={`/nouveautes${s}`} className={getLinkClass('/nouveautes')}>Nouveautés</Link>
          <Link to={`/gallery${s}`} className={getLinkClass('/gallery')}>Galeries</Link>
          <Link to={`/carnet-de-routes${s}`} className={getLinkClass('/carnet-de-routes')}>Carnet de routes</Link>
          <a href={getPortfolioUrl()} target="_blank" rel="noopener noreferrer" className="nav-link px-3.5 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition duration-200">Portfolio</a>
          <Link to={`/contact${s}`} className={getLinkClass('/contact')}>Contact</Link>
          <div className="ml-2 pl-2 border-l border-black/[0.08] dark:border-white/[0.08] flex items-center theme-toggle-container">
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
