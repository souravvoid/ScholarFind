import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { evaluateEligibility } from '../utils/eligibilityEngine';
import { useAuth } from '../context/AuthContext';
import { OfficialRedirectModal } from '../components/OfficialRedirectModal';
import { getDeadlineDisplay } from '../services/databaseService';
import { getScholarshipBySlug } from '../services/catalogueService';
import type { Scholarship } from '../types';
import { Container } from '../components/ui/Container';
import { Button, buttonStyles } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorPanel } from '../components/ui/ErrorPanel';

export function ScholarshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile, isSaved, saveScholarship, unsaveScholarship } = useAuth();
  const [showRedirect, setShowRedirect] = useState(false);
  const [showSourceRedirect, setShowSourceRedirect] = useState(false);
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [offlineFallback, setOfflineFallback] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setScholarship(null);
    setLoadError(null);
    setNotFound(false);
    setOfflineFallback(false);
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return () => {
        active = false;
      };
    }

    void getScholarshipBySlug(id).then((result) => {
      if (!active) return;
      setScholarship(result.data);
      setLoadError(result.error ?? null);
      setNotFound(result.notFound);
      setOfflineFallback(!result.fromDatabase && result.data !== null);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Container className="py-16" aria-live="polite">
        <p className="text-sm text-ink-muted">Loading scholarship details…</p>
      </Container>
    );
  }

  if (!scholarship) {
    if (loadError && !notFound) {
      return (
        <Container className="py-16">
          <ErrorPanel title="Scholarship unavailable" message={loadError} />
          <Link to="/explore" className={`${buttonStyles({ variant: 'primary' })} mt-5`}>
            Back to catalogue
          </Link>
        </Container>
      );
    }
    return (
      <Container className="py-16">
        <EmptyState
          icon="explore"
          title="This record isn't in the current catalogue"
          description="It may have been removed or the link is outdated. Browse the verified catalogue instead."
          action={
            <Link to="/explore" className={buttonStyles({ variant: 'primary' })}>
              Back to catalogue
            </Link>
          }
        />
      </Container>
    );
  }

  const evaluation = evaluateEligibility(scholarship, profile);
  const saved = isSaved(scholarship.id);
  const deadline = getDeadlineDisplay(scholarship.applicationDeadline);

  const statusTone =
    evaluation.status === 'likely_eligible'
      ? 'ok'
      : evaluation.status === 'more_info_needed' || evaluation.status === 'needs_review'
        ? 'warn'
        : 'bad';
  const statusLabel =
    evaluation.status === 'ineligible'
      ? 'Does not meet a mandatory criterion'
      : evaluation.statusLabel;

  const handleSave = async () => {
    if (saved) await unsaveScholarship(scholarship.id);
    else
      await saveScholarship(scholarship.id, {
        title: scholarship.title,
        provider: scholarship.providerName,
        destination: scholarship.destinationCountries.join(', '),
        awardValue: scholarship.totalAwardValue,
        deadline: scholarship.applicationDeadline,
      });
  };

  return (
    <div className="w-full max-w-full">
      {offlineFallback && loadError ? (
        <Container className="pt-4">
          <ErrorPanel title="Offline cached record" message={loadError} />
        </Container>
      ) : null}
      <div className="border-b border-hairline bg-paper">
        <Container className="py-8 md:py-10">
          <Link
            to="/explore"
            className="inline-flex min-h-8 items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
          >
            <Icon name="arrowLeft" size={16} />
            Back to catalogue
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {scholarship.destinationFlag ? (
              <span className="text-xl" aria-hidden>{scholarship.destinationFlag}</span>
            ) : null}
            <span className="text-xs font-medium text-ink-muted">
              {scholarship.destinationCountries.join(', ')} · {scholarship.providerCategory}
            </span>
            <Badge tone={statusTone}>{statusLabel}</Badge>
            <span className="text-xs text-ink-muted">
              {scholarship.lastVerified ? `Last verified ${scholarship.lastVerified.slice(0, 10)} · ` : ''}
              {scholarship.sourceDomain}
            </span>
          </div>

          <h1 className="mt-3 font-ui-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">
            {scholarship.title}
          </h1>
          <p className="mt-1 text-base font-medium text-sapphire">{scholarship.providerName}</p>
        </Container>
      </div>

      <Container className="py-8 md:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* Key value grid */}
            <div className="grid grid-cols-1 gap-3 rounded-card border border-hairline bg-paper-sunken p-4 sm:grid-cols-3">
              <div className="space-y-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Total award</span>
                <span className="block font-ui-display text-xl font-bold text-ink">{scholarship.totalAwardValue}</span>
                {scholarship.awardDetails ? (
                  <span className="block text-xs text-ink-muted">{scholarship.awardDetails}</span>
                ) : null}
              </div>
              <div className="space-y-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Deadline</span>
                <div className={`flex items-center gap-1.5 text-sm font-semibold ${deadline.isClosed || deadline.daysRemaining === null ? 'text-ink-muted' : 'text-bad-text'}`}>
                  <Icon name="clock" size={16} />
                  <span>{scholarship.applicationDeadline?.slice(0, 10) ?? 'Not published'}</span>
                </div>
                <span className="block text-xs text-ink-muted">{deadline.statusLabel}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Study levels</span>
                <span className="block text-sm font-semibold capitalize text-ink">{scholarship.studyLevels.join(', ')}</span>
                <span className="block text-xs text-ink-muted">Academic year {scholarship.academicYear}</span>
              </div>
            </div>

            <section className="space-y-2">
              <h2 className="font-ui-display text-base font-semibold text-ink">About this endowment</h2>
              <p className="text-[15px] leading-relaxed text-ink-muted">{scholarship.overview}</p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-ui-display text-base font-semibold text-ink">Eligibility rubric</h2>
                  <p className="text-xs text-ink-muted">
                    Evaluated against {profile ? profile.displayName || 'your profile' : 'a guest profile'}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-profile-builder'))}
                  className="text-xs font-semibold text-sapphire hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
                >
                  Edit profile
                </button>
              </div>

              <div className="space-y-3">
                {evaluation.evaluatedList.map((item, idx) => {
                  const isReview = item.status === 'needs_review';
                  const isMissing = item.status === 'missing';
                  const tone = item.status === 'passed' ? 'ok' : isMissing || isReview ? 'warn' : 'bad';
                  const icon = item.status === 'passed' ? 'eligible' : isMissing || isReview ? 'manual' : 'missing';
                  const label =
                    item.status === 'passed'
                      ? 'Met'
                      : isReview
                        ? 'Manual review'
                        : isMissing
                          ? 'Info needed'
                          : 'Not met';
                  return (
                    <div key={idx} className="rounded-card border border-hairline bg-paper-raised p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Icon
                            name={icon}
                            size={18}
                            className={
                              item.status === 'passed'
                                ? 'text-ok-text'
                                : isMissing || isReview
                                  ? 'text-warn-text'
                                  : 'text-bad-text'
                            }
                          />
                          <span className="text-sm font-semibold text-ink">{item.criterion.title}</span>
                        </div>
                        <Badge tone={tone}>{label}</Badge>
                      </div>
                      <p className="mt-1.5 pl-6 text-xs leading-relaxed text-ink-muted">{item.explanation}</p>
                      <p className="mt-1 pl-6 text-[11px] text-ink-muted">
                        Source: {item.criterion.sourceCitation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-ui-display text-base font-semibold text-ink">Required documents</h2>
              {scholarship.requiredDocuments.length ? (
                <ul className="space-y-2">
                  {scholarship.requiredDocuments.map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-ink-muted">
                      <Icon name="document" size={16} className="mt-0.5 shrink-0 text-sapphire" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-ink-muted">No document list is published.</p>}
            </section>

            {scholarship.applicationInstructions?.length ? (
            <section className="space-y-3">
              <h2 className="font-ui-display text-base font-semibold text-ink">Application instructions</h2>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-muted">
                {scholarship.applicationInstructions.map((instruction, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="font-medium text-ink">{instruction}</span>
                  </li>
                ))}
              </ol>
            </section>
            ) : null}

            {scholarship.provenance ? (
            <div className="rounded-card border border-hairline bg-paper-sunken p-4">
              <div className="flex items-start gap-3">
                <Icon name="verified" size={20} className="shrink-0 text-sapphire" />
                <div>
                  <p className="text-xs font-semibold text-ink">Authoritative indexing</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    ScholarFind associates this record with the listed source.{' '}
                    {scholarship.provenance.collectedAt
                      ? `Record last ingested ${scholarship.provenance.collectedAt.slice(0, 10)}. `
                      : ''}
                    Source:{' '}
                    <button
                      type="button"
                      onClick={() => setShowSourceRedirect(true)}
                      className="font-semibold text-sapphire hover:underline"
                    >
                      {scholarship.provenance.sourceName}
                    </button>
                    .
                  </p>
                </div>
              </div>
            </div>
            ) : null}
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-card border border-hairline bg-paper-raised p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Eligibility</p>
                <div className="mt-2">
                  <Badge tone={statusTone}>{statusLabel}</Badge>
                </div>
                {profile ? (
                  <p className="mt-2 text-xs text-ink-muted">Match score {evaluation.matchScore}%</p>
                ) : (
                  <p className="mt-2 text-xs text-ink-muted">
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent('open-profile-builder'))}
                      className="font-semibold text-sapphire hover:underline"
                    >
                      Build a profile
                    </button>{' '}
                    to see a verdict.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button variant={saved ? 'secondary' : 'primary'} size="md" onClick={() => void handleSave()} className="w-full">
                  <Icon name={saved ? 'savedActive' : 'saved'} size={16} />
                  {saved ? 'Saved to tracker' : 'Save scholarship'}
                </Button>
                <Button variant="primary" size="md" onClick={() => setShowRedirect(true)} className="w-full">
                  Continue to official application
                  <Icon name="arrowRight" size={16} />
                </Button>
              </div>

              <p className="text-xs leading-relaxed text-ink-muted">
                Final eligibility, admissions, and award decisions are made by the scholarship provider.
              </p>
            </div>
          </aside>
        </div>
      </Container>

      {/* Sticky mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-paper-raised/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[1200px] gap-2">
          <Button variant={saved ? 'secondary' : 'primary'} size="md" onClick={() => void handleSave()} className="flex-1">
            <Icon name={saved ? 'savedActive' : 'saved'} size={16} />
            {saved ? 'Saved' : 'Save'}
          </Button>
          <Button variant="primary" size="md" onClick={() => setShowRedirect(true)} className="flex-1">
            Apply
            <Icon name="arrowRight" size={16} />
          </Button>
        </div>
      </div>

      <OfficialRedirectModal scholarship={scholarship} isOpen={showRedirect} onClose={() => setShowRedirect(false)} />
      {scholarship.provenance ? (
        <OfficialRedirectModal
          scholarship={scholarship}
          destinationUrl={scholarship.provenance.sourceRecordUrl}
          destinationLabel="official source record"
          isOpen={showSourceRedirect}
          onClose={() => setShowSourceRedirect(false)}
        />
      ) : null}
    </div>
  );
}
