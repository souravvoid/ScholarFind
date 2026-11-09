import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthRequestError } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { Icon } from '../components/ui/Icon';

type AuthMode = 'login' | 'signup';
type FieldKey = 'email' | 'password' | 'password_confirm';

interface AuthPageProps {
  mode: AuthMode;
}

const INPUT_CLASS =
  'min-h-11 w-full rounded-control border border-hairline bg-paper-raised px-3 text-[15px] text-ink placeholder:text-ink-muted/70 transition-colors duration-[120ms] hover:border-hairline-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire aria-[invalid=true]:border-bad-border';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_META: Record<string, { id: string; label: string }> = {
  email: { id: 'email', label: 'Email' },
  identifier: { id: 'email', label: 'Email' },
  password: { id: 'password', label: 'Password' },
  password_confirm: { id: 'confirm-password', label: 'Confirm password' },
  display_name: { id: 'display-name', label: 'Display name' },
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] leading-relaxed text-bad-text">
      {message}
    </p>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoComplete: 'current-password' | 'new-password';
  placeholder: string;
  error?: string;
  hint?: string;
  minLength?: number;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  autoComplete,
  placeholder,
  error,
  hint,
  minLength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint && !error ? hintId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={`${INPUT_CLASS} pr-12`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex h-11 w-11 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
      {hint && !error ? (
        <p id={hintId} className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function AuthPage({ mode }: AuthPageProps) {
  const { currentUser, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSignup = mode === 'signup';
  const requestedFrom = (location.state as { from?: string } | null)?.from;
  const redirectTo =
    requestedFrom && requestedFrom !== '/login' && requestedFrom !== '/signup'
      ? requestedFrom
      : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && currentUser) {
      navigate(redirectTo, { replace: true });
    }
  }, [currentUser, loading, navigate, redirectTo]);

  useEffect(() => {
    if (submitAttempt > 0) {
      summaryRef.current?.focus();
    }
  }, [submitAttempt]);

  const summaryEntries = Object.entries(fieldErrors).filter(
    ([key, message]) => Boolean(message) && Boolean(FIELD_META[key]),
  );
  const hasErrors = Boolean(error) || summaryEntries.length > 0;

  const validateField = (field: FieldKey) => {
    setFieldErrors((previous) => {
      const next = { ...previous };

      if (field === 'email') {
        if (!email.trim()) {
          next.email = 'Enter your email address.';
        } else if (!EMAIL_PATTERN.test(email.trim())) {
          next.email = 'Enter a valid email address.';
        } else {
          delete next.email;
        }
      }

      if (field === 'password') {
        if (!password) {
          next.password = 'Enter your password.';
        } else if (isSignup && password.length < 12) {
          next.password = 'Use at least 12 characters.';
        } else {
          delete next.password;
        }
      }

      if (field === 'password_confirm' && confirmPassword && password !== confirmPassword) {
        next.password_confirm = 'Passwords do not match.';
      } else if (field === 'password_confirm') {
        delete next.password_confirm;
      }

      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitAttempt(0);

    const nextErrors: Record<string, string> = {};
    if (!email.trim()) {
      nextErrors.email = 'Enter your email address.';
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Enter your password.';
    }
    if (isSignup) {
      if (password && password.length < 12) {
        nextErrors.password = 'Use at least 12 characters.';
      }
      if (password !== confirmPassword) {
        nextErrors.password_confirm = 'Passwords do not match.';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setSubmitAttempt((attempt) => attempt + 1);
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        await signUp({ email: email.trim(), password, displayName: displayName.trim() });
      } else {
        await signIn(email.trim(), password);
      }
      navigate(redirectTo, { replace: true });
    } catch (caught) {
      if (caught instanceof AuthRequestError) {
        const mapped = { ...caught.fieldErrors };
        if (mapped.identifier) {
          mapped.email = mapped.identifier;
          delete mapped.identifier;
        }

        const knownEntries = Object.entries(mapped).filter(([key]) => FIELD_META[key]);
        if (knownEntries.length > 0) {
          setFieldErrors(Object.fromEntries(knownEntries));
          setError(null);
        } else {
          setFieldErrors({});
          setError(caught.message);
        }
        setSubmitAttempt((attempt) => attempt + 1);
      } else {
        setError('Something went wrong. Please try again.');
        setSubmitAttempt((attempt) => attempt + 1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full border-b border-hairline bg-paper">
      <Container className="py-12 md:py-20">
        <div className="mx-auto grid w-full max-w-[960px] gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <section className="max-w-[54ch]">
            <p className="font-data text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              Account
            </p>
            <h1 className="mt-3 font-ui-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">
              {isSignup ? 'Create your ScholarFind account' : 'Welcome back'}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
              {isSignup
                ? 'Use an email address and a strong password. You can build your eligibility profile before or after signing up.'
                : 'Sign in to continue with the account attached to this browser. Guest profiles and saved records stay available on this device.'}
            </p>

            <ul className="mt-8 space-y-3 text-sm leading-relaxed text-ink-muted">
              <li className="flex gap-3">
                <Icon name="verified" size={18} className="mt-0.5 shrink-0 text-sapphire" />
                <span>Passwords are validated and stored securely by the Django API.</span>
              </li>
              <li className="flex gap-3">
                <Icon name="checklist" size={18} className="mt-0.5 shrink-0 text-sapphire" />
                <span>Profile answers and saved scholarships remain private to this browser.</span>
              </li>
              <li className="flex gap-3">
                <Icon name="info" size={18} className="mt-0.5 shrink-0 text-sapphire" />
                <span>Every scholarship decision links back to its official source.</span>
              </li>
            </ul>

            <Link
              to="/"
              className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-chip text-sm font-semibold text-sapphire transition-colors hover:text-sapphire-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
            >
              <Icon name="arrowLeft" size={16} />
              Back to home
            </Link>
          </section>

          <section
            aria-labelledby="auth-form-heading"
            className="rounded-card border border-hairline bg-paper-raised p-6 md:p-8"
          >
            <h2 id="auth-form-heading" className="font-ui-display text-xl font-semibold text-ink">
              {isSignup ? 'Sign up' : 'Sign in'}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              {isSignup ? 'Already have an account?' : 'New to ScholarFind?'}{' '}
              <Link
                to={isSignup ? '/login' : '/signup'}
                state={requestedFrom ? { from: requestedFrom } : undefined}
                className="font-semibold text-sapphire underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
              >
                {isSignup ? 'Sign in' : 'Create an account'}
              </Link>
            </p>

            <form
              className="mt-6 space-y-5"
              onSubmit={handleSubmit}
              noValidate
              aria-busy={submitting}
            >
              {submitAttempt > 0 && hasErrors ? (
                <div
                  ref={summaryRef}
                  tabIndex={-1}
                  role="alert"
                  aria-labelledby="auth-error-title"
                  className="rounded-control border border-bad-border bg-bad-surface px-3 py-2 text-sm leading-relaxed text-bad-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bad-text"
                >
                  <h3 id="auth-error-title" className="font-semibold">
                    There is a problem
                  </h3>
                  {error ? <p className="mt-1">{error}</p> : null}
                  {summaryEntries.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {summaryEntries.map(([key, message]) => {
                        const meta = FIELD_META[key];
                        return (
                          <li key={key}>
                            <a
                              href={`#${meta.id}`}
                              onClick={(event) => {
                                event.preventDefault();
                                document.getElementById(meta.id)?.focus();
                              }}
                              className="underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bad-text"
                            >
                              {meta.label}: {message}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {isSignup ? (
                <div>
                  <label htmlFor="display-name" className="block text-sm font-semibold text-ink">
                    Display name <span className="font-normal text-ink-muted">(optional)</span>
                  </label>
                  <input
                    id="display-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    maxLength={255}
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    aria-invalid={Boolean(fieldErrors.display_name)}
                    aria-describedby={fieldErrors.display_name ? 'display-name-error' : undefined}
                    className={`${INPUT_CLASS} mt-1.5`}
                    placeholder="Ada Lovelace"
                  />
                  <FieldError id="display-name-error" message={fieldErrors.display_name} />
                </div>
              ) : null}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-ink">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => validateField('email')}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  className={`${INPUT_CLASS} mt-1.5`}
                  placeholder="you@example.com"
                />
                <FieldError id="email-error" message={fieldErrors.email} />
              </div>

              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                onBlur={() => validateField('password')}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder={isSignup ? 'At least 12 characters' : 'Your password'}
                error={fieldErrors.password}
                hint={
                  isSignup
                    ? 'Use at least 12 characters and avoid common or entirely numeric passwords.'
                    : undefined
                }
                minLength={isSignup ? 12 : undefined}
              />

              {isSignup ? (
                <PasswordField
                  id="confirm-password"
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  onBlur={() => validateField('password_confirm')}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  error={fieldErrors.password_confirm}
                  minLength={12}
                />
              ) : null}

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting
                  ? isSignup
                    ? 'Creating account…'
                    : 'Signing in…'
                  : isSignup
                    ? 'Create account'
                    : 'Sign in'}
              </Button>
            </form>
          </section>
        </div>
      </Container>
    </div>
  );
}
