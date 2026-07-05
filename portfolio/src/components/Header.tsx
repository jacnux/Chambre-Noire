import React from 'react';
import { UserProfile, UserPage } from '../types';

interface HeaderProps {
  profile: UserProfile | null;
  pages: UserPage[];
  currentPage: string;
  currentPageData: UserPage | null;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  navigateTo: (page: 'home' | 'galleries' | 'album' | 'about' | 'contact' | 'page', albumId?: string | null) => void;
  navigateToPage: (slug: string) => void;
}

const formatName = (name?: string): string => {
  if (!name) return 'Jac';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Jac';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const getBlogUrl = (name?: string): string => {
  if (!name) return '#';
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal
    ? `http://localhost:3001`
    : `https://${name.toLowerCase()}-blog.helioscope.fr`;
};

const Header: React.FC<HeaderProps> = ({
  profile,
  pages,
  currentPage,
  currentPageData,
  menuOpen,
  setMenuOpen,
  navigateTo,
  navigateToPage,
}) => {
  return (
    <header className="header">
      <div className="header-title">
        <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} className="logo">
          {formatName(profile?.name)}
        </a>
        <div className="header-subtitle">Photographies</div>
      </div>

      {/* Bouton Hamburger Mobile */}
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      {/* Barre de navigation */}
      <div className="menu-bg">
        <nav id="menu-container">
          <ul className={`menu ${menuOpen ? 'open' : ''}`}>
            <li>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); navigateTo('home'); }}
                className={currentPage === 'home' ? 'active' : ''}
              >
                Accueil
              </a>
            </li>

            {/* SECTION SÉRIES */}
            {pages.filter(p => p.menuGroup === 'series' && !p.parentPageId && p.showInMenu).length > 0 && (
              <li>
                <span className="menu-section-title">Séries</span>
                <ul className="submenu">
                  {pages.filter(p => p.menuGroup === 'series' && !p.parentPageId && p.showInMenu).map((page) => {
                    const children = pages.filter(p => typeof p.parentPageId === 'object' ? (p.parentPageId as any)?._id === page._id : p.parentPageId === page._id);
                    return (
                      <li key={page._id}>
                        <a 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); navigateToPage(page.slug); }}
                          className={currentPage === 'page' && currentPageData?.slug === page.slug ? 'active' : ''}
                        >
                          {page.title}
                        </a>
                        {children.length > 0 && (
                          <ul className="submenu-nested">
                            {children.map(child => (
                              <li key={child._id}>
                                <a
                                  href="#"
                                  onClick={(e) => { e.preventDefault(); navigateToPage(child.slug); }}
                                  className={currentPage === 'page' && currentPageData?.slug === child.slug ? 'active' : ''}
                                >
                                  {child.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            )}

            {/* SECTION EXPOSITIONS */}
            {pages.filter(p => p.menuGroup === 'exhibitions' && !p.parentPageId && p.showInMenu).length > 0 && (
              <li>
                <span className="menu-section-title">Expositions</span>
                <ul className="submenu">
                  {pages.filter(p => p.menuGroup === 'exhibitions' && !p.parentPageId && p.showInMenu).map((page) => {
                    const children = pages.filter(p => typeof p.parentPageId === 'object' ? (p.parentPageId as any)?._id === page._id : p.parentPageId === page._id);
                    return (
                      <li key={page._id}>
                        <a 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); navigateToPage(page.slug); }}
                          className={currentPage === 'page' && currentPageData?.slug === page.slug ? 'active' : ''}
                        >
                          {page.title}
                        </a>
                        {children.length > 0 && (
                          <ul className="submenu-nested">
                            {children.map(child => (
                              <li key={child._id}>
                                <a
                                  href="#"
                                  onClick={(e) => { e.preventDefault(); navigateToPage(child.slug); }}
                                  className={currentPage === 'page' && currentPageData?.slug === child.slug ? 'active' : ''}
                                >
                                  {child.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            )}

            <li>
              <a 
                href={getBlogUrl(profile?.name)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Actualités
              </a>
            </li>
            
            <li>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); navigateTo('about'); }}
                className={currentPage === 'about' ? 'active' : ''}
              >
                À propos
              </a>
            </li>
            <li>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); navigateTo('contact'); }}
                className={currentPage === 'contact' ? 'active' : ''}
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
