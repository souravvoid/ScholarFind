import type { ReactNode } from 'react';
import { Container } from './Container';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Consistent page intro used by every route (docs/DESIGN_SYSTEM.md §2). */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="w-full border-b border-hairline bg-paper">
      <Container className="py-10 md:py-14">
        {eyebrow ? (
          <p className="font-data text-[11px] uppercase tracking-[0.14em] text-ink-muted">{eyebrow}</p>
        ) : null}
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="font-ui-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
        </div>
      </Container>
    </header>
  );
}
