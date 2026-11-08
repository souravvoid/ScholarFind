import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

/** Every empty surface explains why it is empty and offers exactly one next step. */
export function EmptyState({ icon = 'search', title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center px-5 py-16 text-center ${className}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-paper-sunken text-ink-muted">
        <Icon name={icon} size={24} />
      </span>
      <h3 className="mt-4 font-ui-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-ink-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
