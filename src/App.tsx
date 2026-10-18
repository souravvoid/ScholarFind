/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { ScholarshipExplorer } from './components/ScholarshipExplorer';
import { ApplicationTracker } from './components/ApplicationTracker';
import { SourceTransparency } from './components/SourceTransparency';
import { ProfileBuilder } from './components/ProfileBuilder';
import { ScholarshipDetailsModal } from './components/ScholarshipDetailsModal';
import { Scholarship } from './types';
import { testConnection } from './firebase';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [showProfileBuilder, setShowProfileBuilder] = useState<boolean>(false);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);

  // Validate connection to Firestore on initial boot as required by skill
  useEffect(() => {
    testConnection();
  }, []);

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa] text-[#1a1c1c] antialiased">
      {/* Universal Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenProfileBuilder={() => setShowProfileBuilder(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-16">
        {currentTab === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenProfileBuilder={() => setShowProfileBuilder(true)}
            onSelectScholarship={(s) => setSelectedScholarship(s)}
          />
        )}

        {currentTab === 'explore' && (
          <ScholarshipExplorer
            onSelectScholarship={(s) => setSelectedScholarship(s)}
            onOpenProfileBuilder={() => setShowProfileBuilder(true)}
          />
        )}

        {currentTab === 'tracker' && (
          <ApplicationTracker
            onSelectScholarship={(s) => setSelectedScholarship(s)}
            onExplore={() => handleNavigate('explore')}
          />
        )}

        {currentTab === 'sources' && (
          <SourceTransparency />
        )}
      </main>

      {/* Universal Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Interactive Multi-step Profile Builder Modal */}
      {showProfileBuilder && (
        <ProfileBuilder
          onClose={() => setShowProfileBuilder(false)}
          onFinished={() => {
            setShowProfileBuilder(false);
            handleNavigate('explore');
          }}
        />
      )}

      {/* Scholarship Details & Eligibility Rubric Breakdown Modal */}
      {selectedScholarship && (
        <ScholarshipDetailsModal
          scholarship={selectedScholarship}
          onClose={() => setSelectedScholarship(null)}
          onOpenProfileBuilder={() => {
            setSelectedScholarship(null);
            setShowProfileBuilder(true);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
