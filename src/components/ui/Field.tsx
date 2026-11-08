import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

const CONTROL =
  'w-full rounded-control border border-hairline bg-paper-raised px-3.5 text-[15px] text-ink placeholder:text-ink-muted/70 transition-colors duration-[120ms] hover:border-hairline-strong focus:border-sapphire focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sapphire aria-[invalid=true]:border-bad-border';

interface FieldChrome {
  label: string;
  hint?: string;
  error?: string;
}

function useFieldIds(providedId: string | undefined, hint?: string, error?: string) {
  const generated = useId();
  const id = providedId ?? generated;
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ');
  return { id, describedBy: describedBy || undefined };
}

function FieldMessages({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  return (
    <>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] leading-snug text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] font-medium leading-snug text-bad-text">
          {error}
        </p>
      ) : null}
    </>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldChrome;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className = '', id: providedId, ...rest },
  ref,
) {
  const { id, describedBy } = useFieldIds(providedId, hint, error);
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-[13px] font-semibold text-ink">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-1.5 min-h-11 ${CONTROL} ${className}`}
        {...rest}
      />
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldChrome;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className = '', id: providedId, ...rest },
  ref,
) {
  const { id, describedBy } = useFieldIds(providedId, hint, error);
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-[13px] font-semibold text-ink">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-1.5 min-h-24 py-2.5 ${CONTROL} ${className}`}
        {...rest}
      />
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
});

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldChrome;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className = '', id: providedId, children, ...rest },
  ref,
) {
  const { id, describedBy } = useFieldIds(providedId, hint, error);
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-[13px] font-semibold text-ink">
        {label}
      </label>
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-1.5 min-h-11 ${CONTROL} pr-8 ${className}`}
        {...rest}
      >
        {children}
      </select>
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
});
