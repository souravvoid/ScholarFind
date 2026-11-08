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
import { ProfileBuilder } from './components/ProfileBuilder';
import { ScholarshipDetailsModal } from './components/ScholarshipDetailsModal';
import { NotFoundPage } from './pages/NotFoundPage';
import { Scholarship } from './types';
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
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const navigate = useNavigate();

  // Validate connection to Firestore on initial boot (read-only probe).
  useEffect(() => {
    testConnection();
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
              onSelectScholarship={(scholarship) => setSelectedScholarship(scholarship)}
            />
          }
        />
        <Route
          path="/explore"
          element={
            <ScholarshipExplorer
              onSelectScholarship={(scholarship) => setSelectedScholarship(scholarship)}
              onOpenProfileBuilder={() => setShowProfileBuilder(true)}
            />
          }
        />
        <Route
          path="/tracker"
          element={
            <ApplicationTracker
              onSelectScholarship={(scholarship) => setSelectedScholarship(scholarship)}
              onExplore={() => navigate('/explore')}
            />
          }
        />
        <Route path="/sources" element={<SourceTransparency />} />
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

      {selectedScholarship ? (
        <ScholarshipDetailsModal
          scholarship={selectedScholarship}
          onClose={() => setSelectedScholarship(null)}
          onOpenProfileBuilder={() => {
            setSelectedScholarship(null);
            setShowProfileBuilder(true);
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
