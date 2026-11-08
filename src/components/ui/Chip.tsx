import { Icon } from './Icon';

interface ChipProps {
  children: string;
  onRemove: () => void;
}

/** Applied-filter chip with an accessible remove button. */
export function Chip({ children, onRemove }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-chip border border-hairline bg-paper-sunken py-1 pl-2.5 pr-1 text-xs font-semibold text-ink">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${children}`}
        className="flex h-6 w-6 items-center justify-center rounded-chip text-ink-muted transition-colors duration-[120ms] hover:bg-paper-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sapphire"
      >
        <Icon name="close" size={13} />
      </button>
    </span>
  );
}
