import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenProfileBuilder: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenProfileBuilder }) => {
  const { currentUser, profile, signInWithGoogle, signOut, savedScholarships } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close drawer on navigation
  const handleMobileNav = (tab: string) => {
    onNavigate(tab);
    setMobileDrawerOpen(false);
  };

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen]);

  // Lock body scroll when mobile drawer is open to prevent background scrolling
  useEffect(() => {
    if (mobileDrawerOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [mobileDrawerOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#fbfbfa]/95 backdrop-blur-xl border-b border-[#e5e7eb] w-full max-w-full">
        <div className="h-16 max-w-[1280px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 flex items-center justify-between gap-2 sm:gap-6 min-w-0">
          {/* Brand Logo & Desktop Nav */}
          <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 min-w-0">
            <button 
              onClick={() => handleMobileNav('landing')}
              className="flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none group cursor-pointer shrink-0 min-h-[44px]"
              aria-label="ScholarFind Home"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0037b0] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <span className="material-symbols-outlined text-[20px]">school</span>
              </div>
              <span className="font-headline-sm text-lg sm:text-[19px] tracking-tight text-[#1a1a1e] font-semibold truncate">
                ScholarFind
              </span>
            </button>

            {/* Desktop Navigation (>= 768px) */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-6">
              <button
                onClick={() => onNavigate('explore')}
                className={`font-body-default text-[15px] transition-colors cursor-pointer min-h-[44px] flex items-center ${
                  currentTab === 'explore' 
                    ? 'text-[#0037b0] font-semibold' 
                    : 'text-[#434655] hover:text-[#1a1c1c]'
                }`}
              >
                Explore Scholarships
              </button>
              <button
                onClick={() => onNavigate('tracker')}
                className={`font-body-default text-[15px] transition-colors relative cursor-pointer flex items-center gap-1.5 min-h-[44px] ${
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
                className={`font-body-default text-[15px] transition-colors cursor-pointer min-h-[44px] flex items-center ${
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
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:pl-2 rounded-full border border-[#e5e7eb] bg-white hover:bg-[#f3f4f3] transition-all cursor-pointer min-h-[44px]"
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-sm text-[#1a1a1e] hover:bg-[#f3f4f3] transition-colors cursor-pointer min-h-[40px]"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#0037b0]">badge</span>
                      Edit Universal Profile
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('tracker');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-sm text-[#1a1a1e] hover:bg-[#f3f4f3] transition-colors cursor-pointer min-h-[40px]"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#0037b0]">bookmark</span>
                      Saved Scholarships ({savedScholarships.length})
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('sources');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-sm text-[#1a1a1e] hover:bg-[#f3f4f3] transition-colors cursor-pointer min-h-[40px]"
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-sm text-[#be123c] hover:bg-[#fff1f2] transition-colors cursor-pointer min-h-[40px]"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={signInWithGoogle}
                  className="hidden sm:inline-flex font-body-strong text-sm text-[#434655] hover:text-[#1a1c1c] transition-colors cursor-pointer px-2 py-1 min-h-[44px] items-center"
                >
                  Sign In
                </button>
                <button
                  onClick={onOpenProfileBuilder}
                  className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-[#0037b0] text-white font-body-strong text-xs sm:text-[14px] hover:bg-[#2563eb] active:scale-[0.98] transition-all cursor-pointer shadow-xs whitespace-nowrap min-h-[44px]"
                >
                  <span>Get Started</span>
                  <span className="material-symbols-outlined text-[15px] sm:text-[16px]">arrow_forward</span>
                </button>
              </div>
            )}

            {/* Mobile Navigation Drawer Toggle Button (< 768px) */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-[#434655] hover:text-[#1a1a1e] hover:bg-[#f3f4f3] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0037b0]"
              aria-label="Open navigation menu"
              aria-expanded={mobileDrawerOpen}
              aria-controls="mobile-navigation-drawer"
            >
              <span className="material-symbols-outlined text-[26px]">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Accessible Responsive Mobile Navigation Drawer (< 768px) */}
      {mobileDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          id="mobile-navigation-drawer"
        >
          {/* Backdrop Scrim */}
          <div
            className="fixed inset-0 bg-[#1a1a1e]/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Slide-Over Panel */}
          <div 
            className="relative w-[300px] sm:w-[340px] max-w-[85vw] h-full bg-[#fbfbfa] shadow-2xl border-l border-[#e5e7eb] flex flex-col justify-between z-10 animate-in slide-in-from-right duration-250 min-w-0 overflow-y-auto"
          >
            {/* Drawer Top Header */}
            <div>
              <div className="h-16 px-4 sm:px-5 flex items-center justify-between border-b border-[#e5e7eb] bg-white sticky top-0 z-10 w-full min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#0037b0] flex items-center justify-center text-white shadow-xs shrink-0">
                    <span className="material-symbols-outlined text-[19px]">school</span>
                  </div>
                  <span className="font-headline-sm text-lg text-[#1a1a1e] font-semibold truncate">
                    ScholarFind
                  </span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-11 h-11 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-[#1a1a1e] hover:bg-[#f3f4f3] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0037b0] shrink-0"
                  aria-label="Close navigation menu"
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              {/* User Profile Card inside Drawer */}
              <div className="p-4 border-b border-[#e5e7eb] bg-[#f8f9fa] w-full min-w-0">
                {currentUser ? (
                  <div className="flex items-center gap-3 min-w-0">
                    {profile?.photoURL || currentUser.photoURL ? (
                      <img
                        src={profile?.photoURL || currentUser.photoURL!}
                        alt="User Profile"
                        className="w-10 h-10 rounded-full object-cover border border-[#e5e7eb] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#1d4ed8] text-white flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">person</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-caption-strong text-sm text-[#1a1a1e] truncate">
                        {profile?.displayName || currentUser.displayName || 'Scholar Fellow'}
                      </p>
                      <p className="font-caption text-xs text-[#6b7280] truncate">
                        {profile?.email || currentUser.email}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#047857] mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
                        <span>Student Profile Active</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="font-caption-strong text-xs text-[#1a1a1e]">
                      Welcome to ScholarFind
                    </p>
                    <p className="font-caption text-xs text-[#6b7280] leading-relaxed">
                      Discover verified international scholarships and check deterministic eligibility.
                    </p>
                    <button
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        signInWithGoogle();
                      }}
                      className="w-full flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-lg bg-white border border-[#e5e7eb] text-xs font-semibold text-[#1a1a1e] hover:bg-[#f3f4f3] transition-colors cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#0037b0]">login</span>
                      <span>Sign In with Google</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Primary Drawer Navigation Links */}
              <nav className="p-3 space-y-1.5 w-full min-w-0" aria-label="Mobile Navigation Links">
                <button
                  onClick={() => handleMobileNav('explore')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm transition-colors cursor-pointer min-h-[48px] ${
                    currentTab === 'explore'
                      ? 'bg-[#dce2f3] text-[#0037b0] font-semibold'
                      : 'text-[#1a1a1e] hover:bg-[#f3f4f3]'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-[22px] text-[#0037b0] shrink-0">explore</span>
                    <span className="truncate">Explore Scholarships</span>
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[#6b7280] shrink-0">chevron_right</span>
                </button>

                <button
                  onClick={() => handleMobileNav('tracker')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm transition-colors cursor-pointer min-h-[48px] ${
                    currentTab === 'tracker'
                      ? 'bg-[#dce2f3] text-[#0037b0] font-semibold'
                      : 'text-[#1a1a1e] hover:bg-[#f3f4f3]'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-[22px] text-[#0037b0] shrink-0">bookmark</span>
                    <span className="truncate">Tracker &amp; Saved</span>
                  </span>
                  {savedScholarships.length > 0 ? (
                    <span className="px-2 py-0.5 bg-[#0037b0] text-white font-label-sm text-xs rounded-full font-semibold shrink-0">
                      {savedScholarships.length}
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px] text-[#6b7280] shrink-0">chevron_right</span>
                  )}
                </button>

                <button
                  onClick={() => handleMobileNav('sources')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm transition-colors cursor-pointer min-h-[48px] ${
                    currentTab === 'sources'
                      ? 'bg-[#dce2f3] text-[#0037b0] font-semibold'
                      : 'text-[#1a1a1e] hover:bg-[#f3f4f3]'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-[22px] text-[#0037b0] shrink-0">verified_user</span>
                    <span className="truncate">Source Transparency</span>
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[#6b7280] shrink-0">chevron_right</span>
                </button>

                <div className="h-px bg-[#e5e7eb] my-2" />

                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onOpenProfileBuilder();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm text-[#0037b0] bg-[#f3f4f3] hover:bg-[#e8e8e7] transition-colors cursor-pointer font-semibold min-h-[48px]"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-[22px] shrink-0">badge</span>
                    <span className="truncate">{currentUser ? 'Edit Universal Profile' : 'Build Free Profile'}</span>
                  </span>
                  <span className="material-symbols-outlined text-[18px] shrink-0">arrow_forward</span>
                </button>
              </nav>
            </div>

            {/* Drawer Bottom Actions & Sign Out */}
            <div className="p-4 border-t border-[#e5e7eb] bg-white space-y-3 w-full min-w-0">
              {currentUser && (
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl text-sm font-semibold text-[#be123c] bg-[#fff1f2] hover:bg-[#ffe4e6] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Sign Out</span>
                </button>
              )}

              <div className="text-[11px] text-[#6b7280] text-center leading-relaxed">
                <p className="font-semibold text-[#1a1a1e]">ScholarFind Academic Registry</p>
                <p>Audited official endowments only</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
