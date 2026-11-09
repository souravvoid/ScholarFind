import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { buttonStyles } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { MobileDrawer } from './MobileDrawer';

interface TopNavProps {
  onOpenProfileBuilder: () => void;
}

const NAV_ITEMS = [
  { to: '/explore', label: 'Explore' },
  { to: '/tracker', label: 'Tracked' },
  { to: '/sources', label: 'Sources' },
] as const;

export function TopNav({ onOpenProfileBuilder }: TopNavProps) {
  const { currentUser, profile, signOut, savedScholarships } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // The landing hero is still dark during the migration; every other route uses paper.
  const overHero = location.pathname === '/';

  useEffect(() => {
    setUserMenuOpen(false);
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

  const navLinkClass = (isActive: boolean) =>
    [
      'flex min-h-11 items-center rounded-chip px-2 text-[15px] transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2',
      overHero ? 'focus-visible:outline-white' : 'focus-visible:outline-sapphire',
      isActive
        ? overHero
          ? 'font-semibold text-white'
          : 'font-semibold text-sapphire'
        : overHero
          ? 'text-white/80 hover:text-white'
          : 'text-ink-muted hover:text-ink',
    ].join(' ');

  const ctaClass = overHero
    ? 'inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-white px-5 text-[15px] font-semibold text-royal transition-colors duration-[120ms] hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
    : buttonStyles({ variant: 'primary' });

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 w-full max-w-full border-b backdrop-blur-md transition-colors ${
          overHero ? 'border-white/10 bg-arc-indigo/95' : 'border-hairline bg-paper/95'
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-2 px-4 sm:gap-6 sm:px-6 md:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6 lg:gap-8">
            <Link
              to="/"
              aria-label="ScholarFind home"
              className="group flex min-h-11 shrink-0 items-center gap-2.5 rounded-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white transition-transform duration-[120ms] group-hover:scale-105 ${
                  overHero ? 'bg-white/15' : 'bg-sapphire'
                }`}
              >
                <Icon name="school" size={18} />
              </span>
              <span
                className={`truncate font-ui-display text-[19px] font-bold tracking-tight ${
                  overHero ? 'text-white' : 'text-ink'
                }`}
              >
                ScholarFind
              </span>
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-4 md:flex lg:gap-6">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClass(isActive)}>
                  <span className="flex items-center gap-1.5">
                    {item.label}
                    {item.to === '/tracker' && savedScholarships.length > 0 ? (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
                          overHero ? 'bg-white/20 text-white' : 'bg-[#DCE1FF] text-sapphire'
                        }`}
                      >
                        {savedScholarships.length}
                      </span>
                    ) : null}
                  </span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {currentUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                  className={`flex min-h-11 items-center gap-2 rounded-full border p-1 transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 sm:pl-2 ${
                    overHero
                      ? 'border-white/25 hover:bg-white/10 focus-visible:outline-white'
                      : 'border-hairline bg-paper-raised hover:bg-paper-sunken focus-visible:outline-sapphire'
                  }`}
                >
                  <span className="hidden pr-1 text-right sm:block">
                    <span
                      className={`block max-w-[120px] truncate text-[13px] font-semibold leading-tight ${
                        overHero ? 'text-white' : 'text-ink'
                      }`}
                    >
                      {profile?.displayName || currentUser.displayName || 'Scholar'}
                    </span>
                    <span className="block text-[10px] text-ok-text">Signed in</span>
                  </span>
                  {profile?.photoURL || currentUser.photoURL ? (
                    <img
                      src={profile?.photoURL || currentUser.photoURL!}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-full border border-hairline object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sapphire text-white">
                      <Icon name="user" size={16} />
                    </span>
                  )}
                </button>

                {userMenuOpen ? (
                  <div
                    role="menu"
                    aria-label="Account"
                    className="absolute right-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-card border border-hairline bg-paper-raised p-2 text-ink shadow-overlay"
                  >
                    <div className="mb-1 border-b border-hairline px-3 py-2">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {profile?.displayName || currentUser.displayName || 'ScholarFind student'}
                      </p>
                      <p className="truncate text-xs text-ink-muted">{profile?.email || currentUser.email}</p>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenProfileBuilder();
                      }}
                      className="flex min-h-11 w-full items-center gap-2.5 rounded-chip px-3 text-left text-sm text-ink transition-colors hover:bg-paper-sunken focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sapphire"
                    >
                      <Icon name="user" size={17} className="text-sapphire" />
                      Edit profile
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/tracker');
                      }}
                      className="flex min-h-11 w-full items-center gap-2.5 rounded-chip px-3 text-left text-sm text-ink transition-colors hover:bg-paper-sunken focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sapphire"
                    >
                      <Icon name="saved" size={17} className="text-sapphire" />
                      Saved ({savedScholarships.length})
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/sources');
                      }}
                      className="flex min-h-11 w-full items-center gap-2.5 rounded-chip px-3 text-left text-sm text-ink transition-colors hover:bg-paper-sunken focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sapphire"
                    >
                      <Icon name="verified" size={17} className="text-sapphire" />
                      Sources &amp; verification
                    </button>
                    <div className="my-1 h-px bg-hairline" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut();
                        navigate('/');
                      }}
                      className="flex min-h-11 w-full items-center gap-2.5 rounded-chip px-3 text-left text-sm text-bad-text transition-colors hover:bg-bad-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sapphire"
                    >
                      <Icon name="signOut" size={17} />
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  state={{ from: `${location.pathname}${location.search}` }}
                  className={`hidden min-h-11 items-center rounded-chip px-2 text-[15px] font-semibold transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 sm:inline-flex ${
                    overHero
                      ? 'text-white/85 hover:text-white focus-visible:outline-white'
                      : 'text-ink-muted hover:text-ink focus-visible:outline-sapphire'
                  }`}
                >
                  Sign in
                </Link>
                <button type="button" onClick={onOpenProfileBuilder} className={ctaClass}>
                  <span className="hidden sm:inline">Find my matches</span>
                  <span className="sm:hidden">Match me</span>
                  <Icon name="arrowRight" size={15} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-navigation-drawer"
              className={`flex h-11 w-11 items-center justify-center rounded-control transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 md:hidden ${
                overHero
                  ? 'text-white/85 hover:bg-white/10 hover:text-white focus-visible:outline-white'
                  : 'text-ink-muted hover:bg-paper-sunken hover:text-ink focus-visible:outline-sapphire'
              }`}
            >
              <Icon name="menu" size={24} />
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenProfileBuilder={onOpenProfileBuilder}
      />
    </>
  );
}
