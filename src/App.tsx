/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './components/LandingPage';
import { ScholarshipExplorer } from './components/ScholarshipExplorer';
import { ApplicationTracker } from './components/ApplicationTracker';
import { SourceTransparency } from './components/SourceTransparency';
import { ScholarshipDetailPage } from './pages/ScholarshipDetailPage';
import { AuthPage } from './pages/AuthPage';
import { ProfileBuilder } from './components/ProfileBuilder';
import { NotFoundPage } from './pages/NotFoundPage';
import { testConnection } from './firebase';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function MainApp() {
  const [showProfileBuilder, setShowProfileBuilder] = useState(false);
  const navigate = useNavigate();

  // Validate connection to Firestore on initial boot (read-only probe).
  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    const handler = () => setShowProfileBuilder(true);
    window.addEventListener('open-profile-builder', handler);
    return () => window.removeEventListener('open-profile-builder', handler);
  }, []);

  const handleNavigate = (tab: string) => {
    navigate(tab === 'landing' ? '/' : `/${tab}`);
  };

  return (
    <AppShell onOpenProfileBuilder={() => setShowProfileBuilder(true)}>
      <ScrollToTop />

      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              onNavigate={handleNavigate}
              onOpenProfileBuilder={() => setShowProfileBuilder(true)}
            />
          }
        />
        <Route path="/explore" element={<ScholarshipExplorer onOpenProfileBuilder={() => setShowProfileBuilder(true)} />} />
        <Route path="/tracker" element={<ApplicationTracker onExplore={() => navigate('/explore')} />} />
        <Route path="/sources" element={<SourceTransparency />} />
        <Route path="/scholarship/:id" element={<ScholarshipDetailPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {showProfileBuilder ? (
        <ProfileBuilder
          onClose={() => setShowProfileBuilder(false)}
          onFinished={() => {
            setShowProfileBuilder(false);
            navigate('/explore');
          }}
        />
      ) : null}
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </AuthProvider>
  );
}
