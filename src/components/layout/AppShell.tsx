import type { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { SiteFooter } from './SiteFooter';

interface AppShellProps {
  children: ReactNode;
  onOpenProfileBuilder: () => void;
}

/** One shell for every route: skip link, top nav, content, footer. */
export function AppShell({ children, onOpenProfileBuilder }: AppShellProps) {
  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-paper text-ink antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-control focus:border focus:border-sapphire focus:bg-paper-raised focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Skip to content
      </a>
      <TopNav onOpenProfileBuilder={onOpenProfileBuilder} />
      <main id="main" className="w-full min-w-0 max-w-full flex-1 overflow-x-hidden pt-16">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
