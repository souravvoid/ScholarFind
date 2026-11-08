import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type BadgeTone = 'neutral' | 'info' | 'ok' | 'warn' | 'bad';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-paper-sunken text-ink-muted border-hairline',
  info: 'bg-[#EEF2FF] text-sapphire border-[#C7D2FE]',
  ok: 'bg-ok-surface text-ok-text border-ok-border',
  warn: 'bg-warn-surface text-warn-text border-warn-border',
  bad: 'bg-bad-surface text-bad-text border-bad-border',
};

interface BadgeProps {
  tone?: BadgeTone;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}

/** Status pill. Only use for states the data actually proves (see DESIGN_BRIEF §4). */
export function Badge({ tone = 'neutral', icon, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip border px-2.5 py-1 text-xs font-semibold leading-none ${TONES[tone]} ${className}`}
    >
      {icon ? <Icon name={icon} size={13} /> : null}
      {children}
    </span>
  );
}
