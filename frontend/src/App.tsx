//
// LUMINAVIEW — App.tsx
// Point d'entrée du routing frontend
// version v2.4.1
//

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getSubdomain } from './utils/domain';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CommentsProvider } from './context/CommentsContext';
import Layout from './components/Layout';

// ── Pages publiques ─────────────────────────────────────────
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import AlbumView from './pages/AlbumView';
import EmbedAlbumView from './pages/EmbedAlbumView';
import PortfolioPage from './pages/PortfolioPage';
import UserPageView from './pages/UserPageView';
import LegalPage from './pages/LegalPage';

// ── Pages privées ───────────────────────────────────────────
import Dashboard from './pages/Dashboard';
import CommentsPage from './pages/CommentsPage';
import CreateAlbum from './pages/CreateAlbum';
import EditProfile from './pages/EditProfile';
import BlogManager from './pages/BlogManager';
import UserPagesManager from './pages/UserPagesManager';
import UserPageEditor from './pages/UserPageEditor';
import Tools from './pages/Tools';
import DashboardAbout from './pages/DashboardAbout';
import DashboardHelp from './pages/DashboardHelp';

// ── Admin ───────────────────────────────────────────────────
import AdminUsers from './pages/AdminUsers';
import AdminReports from './pages/AdminReports';

// ============================================================
// ROUTE PROTÉGÉE
// ============================================================

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

// ============================================================
// ROUTES APP PRINCIPALE
// Avec Layout global Hélioscope
// ============================================================

const MainRoutes: React.FC = () => {
  return (
    <Layout>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/album/:id" element={<AlbumView />} />
        <Route path="/embed/album/:id" element={<EmbedAlbumView />} />
        <Route path="/portfolio/:username" element={<PortfolioPage />} />
        <Route path="/portfolio/:username/:slug" element={<UserPageView />} />

        {/* Privé */}
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/galleries" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/dashboard/comments" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/comments" element={<RequireAuth><CommentsPage /></RequireAuth>} />
        <Route path="/create-album" element={<RequireAuth><CreateAlbum /></RequireAuth>} />
        <Route path="/edit-profile" element={<RequireAuth><EditProfile /></RequireAuth>} />
        <Route path="/manage-blog" element={<RequireAuth><BlogManager /></RequireAuth>} />
        <Route path="/dashboard/pages" element={<RequireAuth><UserPagesManager /></RequireAuth>} />
        <Route path="/dashboard/pages/new" element={<RequireAuth><UserPageEditor /></RequireAuth>} />
        <Route path="/dashboard/pages/edit/:id" element={<RequireAuth><UserPageEditor /></RequireAuth>} />
        <Route path="/dashboard/user-page-editor" element={<RequireAuth><UserPageEditor /></RequireAuth>} />
        <Route path="/tools" element={<RequireAuth><Tools /></RequireAuth>} />
        <Route path="/dashboard/about" element={<RequireAuth><DashboardAbout /></RequireAuth>} />
        <Route path="/dashboard/help" element={<RequireAuth><DashboardHelp /></RequireAuth>} />

        {/* Admin */}
        <Route path="/admin/users" element={<RequireAuth><AdminUsers /></RequireAuth>} />
        <Route path="/admin/reports" element={<RequireAuth><AdminReports /></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

// ============================================================
// ROUTES SOUS-DOMAINE
// Sans Layout global : chaque page publique gère sa propre présentation
// ============================================================

const SubdomainRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<PortfolioPage />} />
      <Route path="/album/:id" element={<AlbumView />} />
      <Route path="/embed/album/:id" element={<EmbedAlbumView />} />
      <Route path="/:slug" element={<UserPageView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// ============================================================
// RACINE
// ============================================================

const App: React.FC = () => {
  const subdomain = getSubdomain();

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CommentsProvider>
            {subdomain ? <SubdomainRoutes /> : <MainRoutes />}
          </CommentsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
