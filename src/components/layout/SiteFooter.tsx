import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { Icon } from '../ui/Icon';

const PRODUCT_LINKS = [
  { to: '/explore', label: 'Explore scholarships' },
  { to: '/tracker', label: 'Tracked & saved' },
  { to: '/sources', label: 'Sources & verification' },
] as const;

const REPOSITORY_URL = 'https://github.com/souravvoid/ScholarFind';

/** Only working destinations are rendered here — no inert controls. */
export function SiteFooter() {
  return (
    <footer className="w-full bg-arc-blue-textured text-white">
      <Container className="pt-14 pb-8">
        <div className="grid grid-cols-1 gap-10 border-b border-white/15 pb-10 md:grid-cols-2">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <p className="font-data text-[11px] uppercase tracking-[0.14em] text-white/80">Product</p>
              <ul className="mt-4 space-y-2.5">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="inline-flex min-h-8 items-center text-sm text-white/85 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-data text-[11px] uppercase tracking-[0.14em] text-white/80">Project</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a
                    href={REPOSITORY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-8 items-center gap-1.5 text-sm text-white/85 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Source code
                    <Icon name="external" size={14} />
                  </a>
                </li>
                <li>
                  <Link
                    to="/sources"
                    className="inline-flex min-h-8 items-center text-sm text-white/85 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    How verification works
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-5 md:items-end">
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
                <Icon name="school" size={18} />
              </span>
              <span className="font-ui-display text-xl font-bold text-white">ScholarFind</span>
            </Link>
            <p className="max-w-xs text-sm text-white/80 md:text-right">
              Curated, verified scholarships with deterministic eligibility rules. Every record links to its
              source.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 pt-6 text-xs text-white/80 sm:flex-row">
          <p>© {new Date().getFullYear()} ScholarFind</p>
          <p>Independent index — final decisions always belong to the scholarship provider.</p>
        </div>
      </Container>
    </footer>
  );
}
