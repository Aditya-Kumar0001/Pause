import React, { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { MobileNav } from './components/common/MobileNav';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/ToastContainer';

import { ScrollToTop } from './components/common/ScrollToTop';
import { BeanBurstTransition } from './components/common/BeanBurstTransition';

// Customer Pages
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { ExperiencePage } from './pages/ExperiencePage';
import { CommunityPage } from './pages/CommunityPage';
import { StoryPage } from './pages/StoryPage';
import { KinkoosPage } from './pages/KinkoosPage';
import { OffersPage } from './pages/OffersPage';
import { ContactPage } from './pages/ContactPage';
import { AuthPage } from './pages/AuthPage';
import { AccountPage } from './pages/AccountPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

const ProtectedAccountRoute: React.FC = () => {
  const { authLoading, firebaseUser } = useAuth();
  const location = useLocation();

  if (authLoading) return <div className="auth-state" role="status">Checking your account...</div>;
  if (!firebaseUser) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  return <AccountPage />;
};

export const App: React.FC = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const requestSignIn = () => {
      navigate('/signin', { state: { from: location.pathname } });
    };
    window.addEventListener('pause_require_signin', requestSignIn);
    return () => window.removeEventListener('pause_require_signin', requestSignIn);
  }, [location.pathname, navigate]);

  const isAdminRoute = location.pathname.startsWith('/admin-controls');

  return (
    <div className="app-root">
      <ScrollToTop />
      <BeanBurstTransition />
      <ToastContainer />

      {isAdminRoute ? (
        <Routes>
          <Route path="/admin-controls/login" element={<AdminLoginPage />} />
          <Route path="/admin-controls" element={<AdminDashboardPage />} />
        </Routes>
      ) : (
        <>
          <Navbar onOpenMobileNav={() => setIsMobileNavOpen(true)} />
          <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/experience" element={<ExperiencePage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/story" element={<StoryPage />} />
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/kinkoos" element={<KinkoosPage />} />
              <Route path="/signin" element={<AuthPage />} />
              <Route path="/account" element={<ProtectedAccountRoute />} />
              <Route path="/contact" element={<ContactPage />} />
              {/* Fallback route */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>

          <Footer />
        </>
      )}
    </div>
  );
};
