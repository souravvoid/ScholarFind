import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenProfileBuilder: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenProfileBuilder }) => {
  const { currentUser, profile, signInWithGoogle, signOut, savedScholarships } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNav = (tab: string) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#fbfbfa]/95 backdrop-blur-xl border-b border-[#e5e7eb]">
      <div className="h-16 max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Logo & Desktop Nav */}
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 min-w-0">
          <button 
            onClick={() => handleMobileNav('landing')}
            className="flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none group cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0037b0] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <span className="material-symbols-outlined text-[20px]">school</span>
            </div>
            <span className="font-headline-sm text-lg sm:text-[19px] tracking-tight text-[#1a1a1e] font-semibold truncate">
              ScholarFind
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-5 lg:gap-6">
            <button
              onClick={() => onNavigate('explore')}
              className={`font-body-default text-[15px] transition-colors cursor-pointer ${
                currentTab === 'explore' 
                  ? 'text-[#0037b0] font-semibold' 
                  : 'text-[#434655] hover:text-[#1a1c1c]'
              }`}
            >
              Explore Scholarships
            </button>
            <button
              onClick={() => onNavigate('tracker')}
              className={`font-body-default text-[15px] transition-colors relative cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'tracker' 
                  ? 'text-[#0037b0] font-semibold' 
                  : 'text-[#434655] hover:text-[#1a1c1c]'
              }`}
            >
              <span>Tracker &amp; Saved</span>
              {savedScholarships.length > 0 && (
                <span className="px-1.5 py-0.2 bg-[#dce2f3] text-[#0037b0] font-label-sm text-[11px] rounded-full">
                  {savedScholarships.length}
                </span>
              )}
            </button>
            <button
              onClick={() => onNavigate('sources')}
              className={`font-body-default text-[15px] transition-colors cursor-pointer ${
                currentTab === 'sources' 
                  ? 'text-[#0037b0] font-semibold' 
                  : 'text-[#434655] hover:text-[#1a1c1c]'
              }`}
            >
              Source Transparency
            </button>
          </nav>
        </div>

        {/* Right Actions & User Menu */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 sm:pl-2 rounded-full border border-[#e5e7eb] bg-white hover:bg-[#f3f4f3] transition-all cursor-pointer"
                aria-expanded={userMenuOpen}
                aria-label="User profile menu"
              >
                <div className="flex flex-col text-right hidden sm:block pr-1">
                  <span className="font-caption-strong text-[13px] text-[#1a1a1e] leading-tight max-w-[120px] truncate">
                    {profile?.displayName || currentUser.displayName || 'Scholar'}
                  </span>
                  <span className="font-label-sm text-[10px] text-[#047857]">
                    Profile Active
                  </span>
                </div>
                {profile?.photoURL || currentUser.photoURL ? (
                  <img
                    src={profile?.photoURL || currentUser.photoURL!}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full object-cover border border-[#e5e7eb] shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#1d4ed8] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                  </div>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl bg-white border border-[#e5e7eb] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-[#e5e7eb] mb-1">
                    <p className="font-caption-strong text-[#1a1a1e] truncate">
                      {profile?.displayName || currentUser.displayName || 'Student Fellow'}
                    </p>
                    <p className="font-caption text-[#6b7280] text-xs truncate">
                      {profile?.email || currentUser.email}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenProfileBuilder();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-sm text-[#1a1a1e] hover:bg-[#f3f4f3] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#0037b0]">badge</span>
                    Edit Universal Profile
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate('tracker');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-sm text-[#1a1a1e] hover:bg-[#f3f4f3] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#0037b0]">bookmark</span>
                    Saved Scholarships ({savedScholarships.length})
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate('sources');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-sm text-[#1a1a1e] hover:bg-[#f3f4f3] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#0037b0]">verified_user</span>
                    Ingestion &amp; Source Audit
                  </button>

                  <div className="h-px bg-[#e5e7eb] my-1" />

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-sm text-[#be123c] hover:bg-[#fff1f2] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={signInWithGoogle}
                className="hidden sm:inline-flex font-body-strong text-sm text-[#434655] hover:text-[#1a1c1c] transition-colors cursor-pointer px-2 py-1"
              >
                Sign In
              </button>
              <button
                onClick={onOpenProfileBuilder}
                className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-[#0037b0] text-white font-body-strong text-xs sm:text-[14px] hover:bg-[#2563eb] active:scale-[0.98] transition-all cursor-pointer shadow-xs whitespace-nowrap min-h-[38px]"
              >
                <span>Get Started</span>
                <span className="material-symbols-outlined text-[15px] sm:text-[16px]">arrow_forward</span>
              </button>
            </div>
          )}

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#434655] hover:text-[#1a1a1e] hover:bg-[#f3f4f3] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#e5e7eb] bg-[#fbfbfa] px-4 py-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => handleMobileNav('explore')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              currentTab === 'explore'
                ? 'bg-[#dce2f3]/50 text-[#0037b0] font-semibold'
                : 'text-[#434655] hover:bg-[#f3f4f3] hover:text-[#1a1a1e]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px]">explore</span>
              Explore Scholarships
            </span>
            <span className="material-symbols-outlined text-[16px] text-[#6b7280]">chevron_right</span>
          </button>

          <button
            onClick={() => handleMobileNav('tracker')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              currentTab === 'tracker'
                ? 'bg-[#dce2f3]/50 text-[#0037b0] font-semibold'
                : 'text-[#434655] hover:bg-[#f3f4f3] hover:text-[#1a1a1e]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px]">bookmark</span>
              Tracker &amp; Saved
            </span>
            {savedScholarships.length > 0 ? (
              <span className="px-2 py-0.5 bg-[#dce2f3] text-[#0037b0] font-label-sm text-xs rounded-full font-semibold">
                {savedScholarships.length}
              </span>
            ) : (
              <span className="material-symbols-outlined text-[16px] text-[#6b7280]">chevron_right</span>
            )}
          </button>

          <button
            onClick={() => handleMobileNav('sources')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              currentTab === 'sources'
                ? 'bg-[#dce2f3]/50 text-[#0037b0] font-semibold'
                : 'text-[#434655] hover:bg-[#f3f4f3] hover:text-[#1a1a1e]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
              Source Transparency
            </span>
            <span className="material-symbols-outlined text-[16px] text-[#6b7280]">chevron_right</span>
          </button>

          <div className="h-px bg-[#e5e7eb] my-2" />

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenProfileBuilder();
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm text-[#0037b0] bg-[#f3f4f3] hover:bg-[#e8e8e7] transition-colors cursor-pointer font-semibold"
          >
            <span className="material-symbols-outlined text-[20px]">badge</span>
            {currentUser ? 'Edit Universal Profile' : 'Build Free Profile'}
          </button>

          {!currentUser && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                signInWithGoogle();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm text-[#434655] hover:bg-[#f3f4f3] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              Sign in with Google
            </button>
          )}
        </div>
      )}
    </header>
  );
};
