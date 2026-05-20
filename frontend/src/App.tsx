// ============================================================
// LUMINAVIEW — App.tsx
// Point d'entrée du routing frontend
// ============================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getSubdomain } from './utils/domain';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import CommentModeration from './components/CommentModeration';

// ── Pages publiques ──────────────────────────────────────────
import LandingPage    from './pages/LandingPage';
import LegalPage      from './pages/LegalPage';
import VerifyEmail    from './pages/VerifyEmail';
import Login          from './pages/Login';
import Register       from './pages/Register';

// ── Albums & Photos ──────────────────────────────────────────
import AlbumView      from './pages/AlbumView';
import CreateAlbum    from './pages/CreateAlbum';

// ── Portfolio & Pages utilisateur ────────────────────────────
import PortfolioPage    from './pages/PortfolioPage';
import UserPageView     from './pages/UserPageView';
import UserPageEditor   from './pages/UserPageEditor';
import UserPagesManager from './pages/UserPagesManager';
import CommentsPage from './pages/CommentsPage';


// ── Dashboard ────────────────────────────────────────────────
import Dashboard      from './pages/Dashboard';
import DashboardAbout from './pages/DashboardAbout';
import DashboardHelp  from './pages/DashboardHelp';
import EditProfile    from './pages/EditProfile';
import Tools          from './pages/Tools';
import BlogManager    from './pages/BlogManager';

// ── Admin ────────────────────────────────────────────────────
import AdminUsers   from './pages/AdminUsers';
import AdminReports from './pages/AdminReports';


// ============================================================
// MODE SOUS-DOMAINE (ex: username.helioscope.fr)
// ============================================================

const SubdomainApp: React.FC = () => {
  const slug = getSubdomain();
  if (!slug) return <Navigate to="https://helioscope.fr" />;

  return (
    <Routes>
      <Route path="/"                        element={<Navigate to={`/portfolio/${slug}`} replace />} />
      <Route path="/portfolio/:username"     element={<PortfolioPage />} />
      <Route path="/portfolio/:username/:slug" element={<UserPageView />} />
      <Route path="/legal"                   element={<LegalPage />} />
      <Route path="/album/:id"               element={<AlbumView />} />
      <Route path="*"                        element={<Navigate to={`/portfolio/${slug}`} replace />} />
    </Routes>
  );
};


// ============================================================
// MODE PRINCIPAL (helioscope.fr)
// ============================================================

const MainApp: React.FC = () => {
  const location  = useLocation();
  const params    = new URLSearchParams(location.search);
  const isViewer  = params.get('mode') === 'viewer';
  const isAuth    = ['/login', '/register'].includes(location.pathname);
  const isPortfolio = location.pathname.startsWith('/portfolio');
  const isAlbumViewer = isViewer && location.pathname.startsWith('/album');

  // Pages d'authentification — sans Layout
  if (isAuth) return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );

  // Album en mode viewer — sans Layout
  if (isAlbumViewer) return (
    <Routes>
      <Route path="/album/:id" element={<AlbumView />} />
    </Routes>
  );

  // Portfolio public — sans Layout
  if (isPortfolio) return (
    <Routes>
      <Route path="/portfolio/:username"       element={<PortfolioPage />} />
      <Route path="/portfolio/:username/:slug" element={<UserPageView />} />
    </Routes>
  );

  // Application principale — avec Layout
  return (
    <Layout>
      <Routes>

        {/* ── Général ── */}
        <Route path="/"             element={<LandingPage />} />
        <Route path="/legal"        element={<LegalPage />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* ── Albums ── */}
        <Route path="/album/:id"    element={<AlbumView />} />
        <Route path="/create-album" element={<CreateAlbum />} />
        <Route path="/galleries"    element={<Dashboard />} />

        {/* ── Dashboard ── */}
        <Route path="/dashboard"        element={<Dashboard />} />
        <Route path="/dashboard/about"  element={<DashboardAbout />} />
        <Route path="/dashboard/help"   element={<DashboardHelp />} />
        <Route path="/dashboard/comments" element={<CommentsPage />} />  {/* ← ICI */}
        <Route path="/edit-profile"     element={<EditProfile />} />
        <Route path="/tools"            element={<Tools />} />
        <Route path="/manage-blog"      element={<BlogManager />} />

        {/* ── Pages utilisateur ── */}
        <Route path="/pages"                           element={<UserPagesManager />} />
        <Route path="/dashboard/pages"                 element={<UserPagesManager />} />
        <Route path="/dashboard/user-page-editor"      element={<UserPageEditor />} />
        <Route path="/dashboard/user-page-editor/:id"  element={<UserPageEditor />} />

        {/* ── Admin ── */}
        <Route path="/admin/users"    element={<AdminUsers />} />
        <Route path="/admin/reports"  element={<AdminReports />} />
        <Route path="/admin/comments" element={<CommentModeration />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};


// ============================================================
// COMPOSANT RACINE
// ============================================================

const App: React.FC = () => {
  const subdomain = getSubdomain();

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {subdomain ? <SubdomainApp /> : <MainApp />}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
