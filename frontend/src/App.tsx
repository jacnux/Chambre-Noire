//
// CHAMBRE NOIRE — App.tsx
// Point d'entrée du routing frontend
// version v2.4.1
//

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getSubdomain } from './utils/domain';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';

// ── Pages publiques ─────────────────────────────────────────
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import AlbumView from './pages/AlbumView';
import EmbedAlbumView from './pages/EmbedAlbumView';
import CarnetDeRoutesPage from './pages/CarnetDeRoutesPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import LegalPage from './pages/LegalPage';

// ── Pages privées ───────────────────────────────────────────
import Dashboard from './pages/Dashboard';
import CreateAlbum from './pages/CreateAlbum';
import EditProfile from './pages/EditProfile';
import CarnetRoutesManager from './pages/CarnetRoutesManager';
import Tools from './pages/Tools';
import DashboardAbout from './pages/DashboardAbout';
import DashboardHelp from './pages/DashboardHelp';

// ── Admin ───────────────────────────────────────────────────
import AdminUsers from './pages/AdminUsers';

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
        {/* Public Chambre Noire */}
        <Route path="/" element={<CarnetDeRoutesPage />} />
        <Route path="/project/:slug" element={<ProjectDetailPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/album/:id" element={<AlbumView />} />
        <Route path="/embed/album/:id" element={<EmbedAlbumView />} />
        <Route path="/embed/carnet-de-routes" element={<CarnetDeRoutesPage />} />
        <Route path="/embed/project/:slug" element={<ProjectDetailPage />} />

        {/* Privé */}
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/create-album" element={<RequireAuth><CreateAlbum /></RequireAuth>} />
        <Route path="/edit-profile" element={<RequireAuth><EditProfile /></RequireAuth>} />
        <Route path="/dashboard/carnet-routes" element={<RequireAuth><CarnetRoutesManager /></RequireAuth>} />
        <Route path="/tools" element={<RequireAuth><Tools /></RequireAuth>} />
        <Route path="/dashboard/about" element={<RequireAuth><DashboardAbout /></RequireAuth>} />
        <Route path="/dashboard/help" element={<RequireAuth><DashboardHelp /></RequireAuth>} />

        {/* Admin */}
        <Route path="/admin/users" element={<RequireAuth><AdminUsers /></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};



// ============================================================
// RACINE
// ============================================================

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <MainRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
