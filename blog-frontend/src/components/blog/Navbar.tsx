import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getBlogSlug } from '../../utils/getBlogSlug';
import { getMainAppUrl } from '../../utils/blogApi';
import DarkModeToggle from './DarkModeToggle';

const Navbar: React.FC = () => {
  const location = useLocation();
  const blogName = getBlogSlug(location.search);
  const s = location.search; // raccourci pour les query strings

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `nav-link px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
      isActive 
        ? 'text-amber-600 dark:text-amber-400 font-semibold border-b-2 border-amber-600 dark:border-amber-400 rounded-none bg-amber-500/[0.04] dark:bg-amber-500/[0.06]' 
        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
    }`;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/85 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.06] shadow-sm transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-3.5">
        <Link to={`/${s}`} className="text-lg font-bold tracking-wider text-gray-950 dark:text-white hover:opacity-85 transition duration-200">
          HELIOSCOPE <span className="text-amber-600 dark:text-amber-500 font-medium">/ {blogName.toUpperCase()}</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link to={`/${s}`} className={getLinkClass('/')}>Articles</Link>
          <Link to={`/about${s}`} className={getLinkClass('/about')}>Bio</Link>
          <Link to={`/nouveautes${s}`} className={getLinkClass('/nouveautes')}>Nouveautés</Link>
          <Link to={`/gallery${s}`} className={getLinkClass('/gallery')}>Galeries</Link>
          <a href={`${getMainAppUrl()}/portfolio/${blogName}`} target="_blank" rel="noopener noreferrer" className="nav-link px-3.5 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition duration-200">Portfolio</a>
          <Link to={`/contact${s}`} className={getLinkClass('/contact')}>Contact</Link>
          <div className="ml-2 pl-2 border-l border-black/[0.08] dark:border-white/[0.08] flex items-center">
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
