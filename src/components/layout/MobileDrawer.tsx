import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { buttonStyles } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenProfileBuilder: () => void;
}

const NAV_ITEMS = [
  { to: '/explore', label: 'Explore scholarships', icon: 'explore' },
  { to: '/tracker', label: 'Tracked & saved', icon: 'saved' },
  { to: '/sources', label: 'Sources & verification', icon: 'verified' },
] as const;

export function MobileDrawer({ open, onClose, onOpenProfileBuilder }: MobileDrawerProps) {
  const { currentUser, profile, signOut, savedScholarships } = useAuth();
  const panelRef = useFocusTrap<HTMLDivElement>(open, onClose);
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      id="mobile-navigation-drawer"
    >
      <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative flex h-full w-[min(360px,88vw)] flex-col overflow-y-auto border-l border-hairline bg-paper shadow-overlay outline-none"
      >
        <div className="sticky top-0 flex h-16 items-center justify-between border-b border-hairline bg-paper-raised px-4">
          <Link
            to="/"
            onClick={onClose}
            className="flex min-h-11 items-center gap-2.5 rounded-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sapphire text-white">
              <Icon name="school" size={18} />
            </span>
            <span className="font-ui-display text-lg font-bold tracking-tight text-ink">ScholarFind</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-11 w-11 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        <div className="border-b border-hairline bg-paper-sunken p-4">
          {currentUser ? (
            <div className="flex min-w-0 items-center gap-3">
              {profile?.photoURL || currentUser.photoURL ? (
                <img
                  src={profile?.photoURL || currentUser.photoURL!}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full border border-hairline object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sapphire text-white">
                  <Icon name="user" size={18} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {profile?.displayName || currentUser.displayName || 'ScholarFind student'}
                </p>
                <p className="truncate text-xs text-ink-muted">{profile?.email || currentUser.email}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-ink">Welcome to ScholarFind</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  Curated, verified funding. Check eligibility before you apply.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
                className={`${buttonStyles({ variant: 'secondary' })} w-full`}
              >
                <Icon name="user" size={16} />
                Sign in or create an account
              </button>
            </div>
          )}
        </div>

        <nav aria-label="Mobile" className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex min-h-12 items-center justify-between rounded-control px-3.5 text-sm transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sapphire ${
                  isActive ? 'bg-[#DCE1FF] font-semibold text-sapphire' : 'text-ink hover:bg-paper-sunken'
                }`
              }
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icon name={item.icon} size={20} className="shrink-0 text-sapphire" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.to === '/tracker' && savedScholarships.length > 0 ? (
                <span className="shrink-0 rounded-full bg-sapphire px-2 py-0.5 text-xs font-semibold text-white">
                  {savedScholarships.length}
                </span>
              ) : (
                <Icon name="chevronRight" size={16} className="shrink-0 text-ink-muted" />
              )}
            </NavLink>
          ))}

          <div className="my-2 h-px bg-hairline" />

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenProfileBuilder();
            }}
            className="flex min-h-12 w-full items-center justify-between rounded-control bg-paper-sunken px-3.5 text-sm font-semibold text-sapphire transition-colors hover:bg-hairline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sapphire"
          >
            <span className="flex min-w-0 items-center gap-3">
              <Icon name="checklist" size={20} className="shrink-0" />
              <span className="truncate">{currentUser ? 'Edit your profile' : 'Build your profile'}</span>
            </span>
            <Icon name="arrowRight" size={16} className="shrink-0" />
          </button>
        </nav>

        <div className="space-y-3 border-t border-hairline bg-paper-raised p-4">
          {currentUser ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                signOut();
                navigate('/');
              }}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-bad-surface px-3 text-sm font-semibold text-bad-text transition-colors hover:bg-[#FFE4E6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
            >
              <Icon name="signOut" size={17} />
              Sign out
            </button>
          ) : null}
          <p className="text-center text-[11px] leading-relaxed text-ink-muted">
            Curated verified catalogue · every record links to its source
          </p>
        </div>
      </div>
    </div>
  );
}
