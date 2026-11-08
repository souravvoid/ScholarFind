import { forwardRef, type ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 font-ui font-semibold whitespace-nowrap rounded-control transition-colors duration-[120ms] ease-arc focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled-surface disabled:text-disabled-text disabled:active:scale-100';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'border border-transparent bg-sapphire text-white hover:bg-sapphire-hover active:scale-[0.99]',
  secondary:
    'border border-hairline bg-paper-raised text-ink hover:border-hairline-strong hover:bg-paper-sunken active:scale-[0.99]',
  ghost:
    'border border-transparent bg-transparent text-ink-muted hover:bg-paper-sunken hover:text-ink active:scale-[0.99]',
  danger:
    'border border-bad-border bg-paper-raised text-bad-text hover:bg-bad-surface active:scale-[0.99]',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 text-[15px]',
  lg: 'min-h-12 px-6 text-base',
};

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return [BASE, VARIANTS[variant], SIZES[size], className].join(' ');
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonStyles({ variant, size, className })} {...rest} />
  );
});
