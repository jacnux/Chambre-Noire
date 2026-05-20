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

  // 1. Détermine si on est sur une page de liste (Dashboard ou Galeries)
  // Cela évite d'afficher le fond dans la visionneuse d'album
  const isListPage = ['/', '/dashboard', '/galleries'].includes(location.pathname);

  // 2. LOGIQUE : Image de fond seulement sur Dashboard/Galeries ET en Mode Sombre
  const showBackgroundImage = theme === 'dark' && isListPage;

  return (
    <div className={`relative min-h-screen w-full ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>

      {/* FOND IMAGE (Conditionnel) */}
      {showBackgroundImage && (
        <>
          <div className="fixed inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: "url('/uploads/monfond_1.jpg')" }}></div>
          <div className="fixed inset-0 z-0 bg-black/50"></div>
        </>
      )}

      <div className="relative z-10 min-h-screen pb-20 flex flex-col">

        {/* --- HEADER --- */}
        <div className={`sticky top-0 z-20 border-b p-3 sm:p-4 backdrop-blur-lg flex justify-between items-center gap-2 shadow-lg
          ${theme === 'dark' ? 'bg-gray-900/90 border-gray-700' : 'bg-white border-gray-200'}`}>

              <div className="flex-shrink-0 flex flex-col justify-center">
                  <Link to="/dashboard" className="text-xl sm:text-2xl font-bold text-yellow-500 drop-shadow-lg tracking-wide hover:text-yellow-400 transition">
                      Hélioscope
                  </Link>
                  {user && (
                    <span className={`text-xs ml-1 mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Espace de : <span className="font-medium text-yellow-600">{user?.name}</span>
                    </span>
                  )}
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                  {user ? (
                    <>
                    <div className={`flex gap-1 p-1 rounded-full border
                          ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>

                            <Link to="/dashboard" className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition
                              ${location.pathname === '/dashboard' ? 'bg-blue-600 text-white' : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')}`}>
                              📁 Albums
                            </Link>

                            <Link to="/galleries" className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition
                              ${location.pathname === '/galleries' ? 'bg-purple-600 text-white' : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')}`}>
                              🖼️ Galeries
                            </Link>

                            {/* --- BOUTON COMMENTAIRES --- */}
                               <Link
                                 to="/dashboard/comments"
                                 className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                                   location.pathname === '/dashboard/comments'
                                     ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                                     : theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
                                 }`}
                               >
                                 💬 Commentaires
                               </Link>
                          
                            {/* --- BOUTON MON BLOG (REMIIS EN PLACE) --- */}
                            <Link
                              to="/manage-blog"
                              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition flex items-center gap-1
                                ${location.pathname === '/manage-blog' ? 'bg-orange-600 text-white' : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')}`}
                            >
                              <span>📝</span> Mon Blog
                            </Link>

                            {/* --- BOUTON MES PAGES --- */}
                            <Link
                              to="/dashboard/pages"
                              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition flex items-center gap-1
                                ${location.pathname.startsWith('/dashboard/pages') ? 'bg-yellow-500 text-black' : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')}`}
                            >
                              <span>📄</span> Mes Pages
                            </Link>

                      </div>

                      <Link to="/create-album" className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition shadow-sm">
                          + Créer
                      </Link>

                      <div className={`flex items-center gap-1 rounded-full p-1 border
                        ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>

                          {isAdmin && (
                            <button onClick={() => navigate('/admin/users')} className={`p-2 rounded-full transition ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`} title="Admin Users">🛡️</button>
                          )}
                          {isAdmin && (
                            <button onClick={() => navigate('/admin/reports')} className={`p-2 rounded-full transition text-red-400`} title="Signalements">🚩</button>
                          )}
                          {isAdmin && (
                            <button onClick={() => navigate('/admin/comments')} className={`p-2 rounded-full transition ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`} title="Commentaires">💬</button>
                          )}

                          <button onClick={() => navigate('/tools')} className={`p-2 rounded-full transition ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`} title="Outils">🛠️</button>

                          {/* BOUTON DARK MODE */}
                          <button onClick={toggleTheme} className={`p-2 rounded-full transition text-xl ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Changer le thème">
                              {theme === 'light' ? '🌙' : '☀️'}
                          </button>
                          <Link to="/dashboard/about" className={`p-2 rounded-full transition ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`} title="À propos">ℹ️</Link>
                          <Link to="/dashboard/help" className={`p-2 rounded-full transition ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`} title="Aide">❓</Link>


                          <button onClick={() => navigate('/edit-profile')} className={`p-2 rounded-full transition ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`} title="Profil">👤</button>
                          <button onClick={logout} className="p-2 rounded-full hover:bg-red-500/50 text-red-400 hover:text-white transition" title="Sortir">⏻</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className={`px-4 py-2 text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`}>Connexion</Link>
                      <button onClick={toggleTheme} className={`p-2 rounded-full transition text-xl ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}>
                         {theme === 'light' ? '🌙' : '☀️'}
                      </button>
                    </>
                  )}
              </div>
          </div>

        {/* --- CONTENU PRINCIPAL --- */}
        <main className="flex-1">
            {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
