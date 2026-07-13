import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Zone connectée large (albums, galeries, carnet-routes, etc.)
  const isAuthenticatedArea = [
    '/dashboard',
    '/dashboard/carnet-routes',
    '/dashboard/about',
    '/dashboard/help',
    '/edit-profile',
    '/tools',
  ].some(
    path =>
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
  );

  const showBackgroundImage = theme === 'dark' && isAuthenticatedArea;

  const isEmbedRoute = location.pathname.startsWith('/embed/');

  if (isEmbedRoute) {
    return (
      <div
        className={`relative min-h-screen w-full overflow-hidden ${
          theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-900'
        }`}
      >
        <main className="w-full relative z-10">{children}</main>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden ${
        theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-900'
      }`}
    >
      {/* Fond global partie connectée */}
      {showBackgroundImage && (
        <>
          <div
            className="fixed inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/uploads/monfond_1.jpg')" }}
          />
          <div className="fixed inset-0 z-0 bg-black/60" />
        </>
      )}

      {!showBackgroundImage && (
        <div
          className={`fixed inset-0 z-0 ${
            theme === 'dark' ? 'bg-gray-950' : 'bg-gray-100'
          }`}
        />
      )}

      {/* Contenu */}
      <div className="relative z-10 min-h-screen pb-20 flex flex-col">
        {/* Header sticky */}
        <div
          className={`sticky top-0 z-20 border-b p-3 sm:p-4 backdrop-blur-md flex justify-between items-center gap-2 shadow-xl transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-gray-950/70 border-white/[0.06] shadow-black/20'
              : 'bg-white/85 border-gray-200/50 shadow-gray-200/10'
          }`}
        >
          <div className="flex-shrink-0 flex flex-col justify-center">
            <Link
              to="/"
              className="flex items-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200"
            >
              <img
                src={`${process.env.PUBLIC_URL}/logo.svg`}
                alt="Chambre Noire"
                className="h-8 w-auto drop-shadow-[0_2px_8px_rgba(232,176,75,0.25)]"
              />
              <span className="text-xl sm:text-2xl font-extrabold text-yellow-500 tracking-wide drop-shadow-[0_2px_8px_rgba(234,179,8,0.15)]">
                Chambre Noire
              </span>
            </Link>
            {user && (
              <span
                className={`text-[10px] sm:text-xs ml-1 mt-0.5 tracking-wider ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Espace de :{' '}
                <span className="font-semibold text-yellow-600">
                  {user?.name}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            {user ? (
              <>
                {/* Tabs principaux */}
                <div
                  className={`flex gap-1 p-1 rounded-full border transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-gray-900/50 border-white/[0.06]'
                      : 'bg-gray-100/80 border-gray-200'
                  }`}
                >
                  <Link
                    to="/dashboard"
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                      location.pathname === '/dashboard'
                        ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]'
                        : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                        : 'text-gray-600 hover:text-black hover:bg-black/[0.04]'
                    }`}
                  >
                    📁 Albums
                  </Link>

                  <Link
                    to="/dashboard/carnet-routes"
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1 ${
                      location.pathname === '/dashboard/carnet-routes'
                        ? 'bg-amber-600 text-white shadow-[0_4px_12px_rgba(217,119,6,0.3)]'
                        : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                        : 'text-gray-600 hover:text-black hover:bg-black/[0.04]'
                    }`}
                  >
                    <span>📓</span> Carnet de route
                  </Link>
                </div>

                {/* Bouton créer */}
                <Link
                  to="/create-album"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 shadow-md shadow-green-950/20 hover:shadow-green-900/30 hover:scale-[1.03] active:scale-[0.97]"
                >
                  + Créer
                </Link>

                {/* Actions à droite */}
                <div
                  className={`flex items-center gap-1 rounded-full p-1 border transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-gray-900/50 border-white/[0.06]'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  {isAdmin && (
                    <button
                      onClick={() => navigate('/admin/users')}
                      className={`p-2 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
                        theme === 'dark'
                          ? 'hover:bg-white/[0.06] text-gray-300 hover:text-white'
                          : 'hover:bg-black/[0.06] text-gray-600 hover:text-black'
                      }`}
                      title="Admin Users"
                    >
                      🛡️
                    </button>
                  )}


                  <button
                    onClick={() => navigate('/tools')}
                    className={`p-2 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
                      theme === 'dark'
                        ? 'hover:bg-white/[0.06] text-gray-300 hover:text-white'
                        : 'hover:bg-black/[0.06] text-gray-600 hover:text-black'
                    }`}
                    title="Outils"
                  >
                    🛠️
                  </button>

                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 text-lg ${
                      theme === 'dark' ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.06]'
                    }`}
                    title="Changer le thème"
                  >
                    {theme === 'light' ? '🌙' : '☀️'}
                  </button>
                  <Link
                    to="/dashboard/about"
                    className={`p-2 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
                      theme === 'dark'
                        ? 'hover:bg-white/[0.06] text-gray-300 hover:text-white'
                        : 'hover:bg-black/[0.06] text-gray-600 hover:text-black'
                    }`}
                    title="À propos"
                  >
                    ℹ️
                  </Link>
                  <Link
                    to="/dashboard/help"
                    className={`p-2 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
                      theme === 'dark'
                        ? 'hover:bg-white/[0.06] text-gray-300 hover:text-white'
                        : 'hover:bg-black/[0.06] text-gray-600 hover:text-black'
                    }`}
                    title="Aide"
                  >
                    ❓
                  </Link>

                  <button
                    onClick={() => navigate('/edit-profile')}
                    className={`p-2 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
                      theme === 'dark'
                        ? 'hover:bg-white/[0.06] text-gray-300 hover:text-white'
                        : 'hover:bg-black/[0.06] text-gray-600 hover:text-black'
                    }`}
                    title="Profil"
                  >
                    👤
                  </button>
                  <button
                    onClick={logout}
                    className="p-2 rounded-full hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all duration-200 hover:scale-105 active:scale-95"
                    title="Sortir"
                  >
                    ⏻
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 text-sm ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Connexion
                </Link>
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-full transition text-xl ${
                    theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                  }`}
                >
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Contenu page */}
        <main className="relative flex-1">{children}</main>

        {/* FOOTER */}
        <footer className="relative z-10 py-6 text-center text-muted text-sm border-t border-line bg-surface-2">
          <img
            src={`${process.env.PUBLIC_URL}/brand-logo.svg`}
            alt="Chambre Noire"
            className="h-14 w-auto mx-auto mb-3 drop-shadow-[0_2px_10px_rgba(232,176,75,0.25)]"
          />
          <p>© 2026 Chambre Noire. Tous droits réservés.</p>
          <Link to="/legal" className="hover:text-fg underline mt-2 inline-block text-muted transition">Mentions Légales</Link>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
