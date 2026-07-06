import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';

import Navbar      from './components/blog/Navbar';
import Footer      from './components/blog/Footer';
import PostList    from './pages/blog/PostList';
import PostDetail  from './pages/blog/PostDetail';
import AboutPage   from './pages/blog/AboutPage';
import GalleryPage from './pages/blog/GalleryPage';
import ContactPage from './pages/blog/ContactPage';
import NouveautesPage from './pages/blog/NouveautesPage';

const AppContent: React.FC = () => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
    <Navbar />
    <main style={{ flex: 1, width: '100%' }}>
      <Routes>
        <Route path="/"          element={<PostList />}    />
        <Route path="/post/:slug" element={<PostDetail />}  />
        <Route path="/about"     element={<AboutPage />}   />
        <Route path="/nouveautes" element={<NouveautesPage />} />
        <Route path="/gallery"   element={<GalleryPage />} />
        <Route path="/contact"   element={<ContactPage />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

const App: React.FC = () => (
  <Router>
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  </Router>
);

export default App;
