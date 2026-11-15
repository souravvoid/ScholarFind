import type { ReactNode } from 'react';

/** Raised surface for landing tiles and panel-level content (not for result lists). */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-card border border-hairline bg-paper-raised p-6 transition-shadow duration-[180ms] ease-arc hover:shadow-raise ${className}`}
    >
      {children}
    </div>
  );
}
