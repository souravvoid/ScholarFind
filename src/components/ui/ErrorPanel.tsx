import type { ReactNode } from 'react';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

interface ErrorPanelProps {
  title: string;
  message: string;
  onRetry?: () => void;
  icon?: IconName;
  children?: ReactNode;
  className?: string;
}

/** Plain-language failure with a recovery action; no stack traces. */
export function ErrorPanel({
  title,
  message,
  onRetry,
  icon = 'unverified',
  children,
  className = '',
}: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className={`rounded-card border border-bad-border bg-bad-surface px-5 py-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-bad-text">
          <Icon name={icon} size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-bad-text">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{message}</p>
          {children}
          {onRetry ? (
            <Button variant="secondary" size="md" onClick={onRetry} className="mt-3">
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
