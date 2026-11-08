import type { ReactNode } from 'react';

/** 1200px content column with the responsive gutters from the design system. */
export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-5 md:px-8 xl:px-12 ${className}`}>{children}</div>;
}
