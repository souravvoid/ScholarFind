import { useId, type ReactNode } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Icon } from './Icon';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}

/**
 * Single dialog implementation: focus trap, Escape, focus restore, scroll lock.
 * Bottom sheet on mobile, centered panel from 640px up.
 */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }: DialogProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(open, onClose);
  const titleId = useId();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="fixed inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-panel border border-hairline bg-paper-raised shadow-overlay outline-none sm:rounded-panel ${
          size === 'lg' ? 'sm:max-w-[720px]' : 'sm:max-w-[560px]'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="font-ui-display text-lg font-semibold tracking-[-0.01em] text-ink">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm leading-snug text-ink-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors duration-[120ms] hover:bg-paper-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? (
          <div className="border-t border-hairline bg-paper px-5 py-4 sm:px-6">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
