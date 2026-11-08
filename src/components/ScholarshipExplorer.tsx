import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Scholarship, DegreeLevel } from '../types';
import { SCHOLARSHIPS_DATA } from '../data/scholarshipsData';
import { evaluateEligibility } from '../utils/eligibilityEngine';
import { getDeadlineDisplay } from '../services/databaseService';
import { useAuth } from '../context/AuthContext';
import { Container } from './ui/Container';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Chip } from './ui/Chip';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { SkeletonRows } from './ui/Skeleton';
import { ErrorPanel } from './ui/ErrorPanel';

export const ScholarshipExplorer: React.FC<{
  onSelectScholarship: (s: Scholarship) => void;
  onOpenProfileBuilder: () => void;
}> = ({ onSelectScholarship, onOpenProfileBuilder }) => {
  const { profile, isSaved, saveScholarship, unsaveScholarship } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [scholarships] = useState<Scholarship[]>(SCHOLARSHIPS_DATA);
  const [loadingFromDB] = useState<boolean>(false);
  const [dbErrorMessage] = useState<string | null>(null);

  // Filters — no defaults: first visit shows everything (decision 12).
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') ?? 'deadline');
  const [matchMode] = useState<'profile' | 'all'>('profile');

  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    searchParams.get('country') ? searchParams.get('country')!.split(',') : [],
  );
  const [selectedLevels, setSelectedLevels] = useState<DegreeLevel[]>(
    searchParams.get('degree') ? (searchParams.get('degree')!.split(',') as DegreeLevel[]) : [],
  );
  const [minAwardUSD, setMinAwardUSD] = useState<number>(0);
  const [deadlineWindow, setDeadlineWindow] = useState<string>(searchParams.get('deadline') ?? 'all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  // Sync filter state → URL (shareable, refresh-safe).
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCountries.length) params.set('country', selectedCountries.join(','));
    if (selectedLevels.length) params.set('degree', selectedLevels.join(','));
    if (deadlineWindow && deadlineWindow !== 'all') params.set('deadline', deadlineWindow);
    if (selectedSort && selectedSort !== 'deadline') params.set('sort', selectedSort);
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedCountries, selectedLevels, deadlineWindow, selectedSort, setSearchParams]);

  const scholarshipsWithEvaluation = useMemo(() => {
    return scholarships.map((sch) => ({
      scholarship: sch,
      evaluation: evaluateEligibility(sch, profile),
    }));
  }, [scholarships, profile]);

  const filteredScholarships = useMemo(() => {
    return scholarshipsWithEvaluation
      .filter(({ scholarship }) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            scholarship.title.toLowerCase().includes(q) ||
            scholarship.providerName.toLowerCase().includes(q) ||
            scholarship.destinationCountries.some((c) => c.toLowerCase().includes(q)) ||
            scholarship.fieldsOfStudy.some((f) => f.toLowerCase().includes(q));
          if (!matches) return false;
        }
        if (selectedCountries.length > 0) {
          if (!scholarship.destinationCountries.some((c) => selectedCountries.includes(c))) return false;
        }
        if (selectedLevels.length > 0) {
          if (!scholarship.studyLevels.some((l) => selectedLevels.includes(l))) return false;
        }
        if (scholarship.estimatedUSDValue < minAwardUSD) return false;
        if (deadlineWindow === 'urgent_30d' && scholarship.daysRemaining > 30) return false;
        if (deadlineWindow === '1_3_months' && (scholarship.daysRemaining < 30 || scholarship.daysRemaining > 90)) return false;
        if (deadlineWindow === '3_6_months' && (scholarship.daysRemaining < 90 || scholarship.daysRemaining > 180)) return false;
        return true;
      })
      .sort((a, b) => {
        if (selectedSort === 'deadline') return a.scholarship.daysRemaining - b.scholarship.daysRemaining;
        if (selectedSort === 'funding') return b.scholarship.estimatedUSDValue - a.scholarship.estimatedUSDValue;
        if (selectedSort === 'match') return b.evaluation.matchScore - a.evaluation.matchScore;
        return 0;
      });
  }, [scholarshipsWithEvaluation, searchQuery, selectedCountries, selectedLevels, minAwardUSD, deadlineWindow, selectedSort]);

  const eligibleCount = scholarshipsWithEvaluation.filter((i) => i.evaluation.status === 'likely_eligible').length;

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) => (prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]));
  };
  const toggleLevel = (level: DegreeLevel) => {
    setSelectedLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]));
  };
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCountries([]);
    setSelectedLevels([]);
    setMinAwardUSD(0);
    setDeadlineWindow('all');
  };

  const activeFilters: { id: string; label: string; onRemove: () => void }[] = [];
  if (searchQuery.trim()) activeFilters.push({ id: 'q', label: `“${searchQuery.trim()}”`, onRemove: () => setSearchQuery('') });
  selectedCountries.forEach((c) => activeFilters.push({ id: `c-${c}`, label: c, onRemove: () => toggleCountry(c) }));
  selectedLevels.forEach((l) => activeFilters.push({ id: `l-${l}`, label: l, onRemove: () => toggleLevel(l) }));
  if (minAwardUSD > 0) activeFilters.push({ id: 'award', label: `≥ $${minAwardUSD.toLocaleString()}`, onRemove: () => setMinAwardUSD(0) });
  if (deadlineWindow !== 'all') {
    const labels: Record<string, string> = { urgent_30d: 'Due in 30 days', '1_3_months': '1–3 months', '3_6_months': '3–6 months' };
    activeFilters.push({ id: 'deadline', label: labels[deadlineWindow] ?? deadlineWindow, onRemove: () => setDeadlineWindow('all') });
  }

  const countries = Array.from(new Set(scholarships.flatMap((s) => s.destinationCountries))).sort();
  const levels: DegreeLevel[] = ['bachelors', 'masters', 'phd'];

  const handleSaveToggle = async (scholarship: Scholarship) => {
    if (isSaved(scholarship.id)) {
      await unsaveScholarship(scholarship.id);
    } else {
      await saveScholarship(scholarship.id, {
        title: scholarship.title,
        provider: scholarship.providerName,
        destination: scholarship.destinationCountries.join(', '),
        awardValue: scholarship.totalAwardValue,
        deadline: scholarship.applicationDeadline,
      });
    }
  };

  return (
    <div className="w-full max-w-full">
      <div className="border-b border-hairline bg-paper">
        <Container className="py-10 md:py-14">
          <p className="font-data text-[11px] uppercase tracking-[0.14em] text-ink-muted">Catalogue</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1 className="font-ui-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">
                Explore verified scholarships
              </h1>
              <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-muted">
                {filteredScholarships.length} of {scholarships.length} records match.{' '}
                {profile ? `${eligibleCount} likely eligible for your profile.` : 'Build a profile to see eligibility.'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-ink-muted">
                Sort
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="min-h-11 rounded-control border border-hairline bg-paper-raised px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
                >
                  <option value="deadline">Deadline</option>
                  <option value="funding">Funding</option>
                  <option value="match">Match score</option>
                </select>
              </label>
              <Button variant="secondary" size="md" onClick={() => setMobileFiltersOpen((o) => !o)} className="lg:hidden">
                <Icon name="filters" size={16} />
                Filters
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, provider, country, or field"
              aria-label="Search scholarships"
              className="min-h-11 flex-1 rounded-control border border-hairline bg-paper-raised px-3.5 text-[15px] text-ink placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
            />
            {activeFilters.length > 0 ? (
              <Button variant="ghost" size="md" onClick={clearAllFilters}>
                Clear all
              </Button>
            ) : null}
          </div>

          {activeFilters.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-ink-muted">Active:</span>
              {activeFilters.map((f) => (
                <Chip key={f.id} onRemove={f.onRemove}>
                  {f.label}
                </Chip>
              ))}
            </div>
          ) : null}
        </Container>
      </div>

      <Container className="py-8">
        {dbErrorMessage ? (
          <ErrorPanel title="Catalogue unavailable" message={dbErrorMessage} className="mb-6" />
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside
            className={`space-y-6 lg:col-span-4 xl:col-span-3 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}
          >
            <div className="rounded-card border border-hairline bg-paper-raised p-5">
              <h2 className="font-ui-display text-base font-semibold text-ink">Destination country</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {countries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => toggleCountry(country)}
                    aria-pressed={selectedCountries.includes(country)}
                    className={`min-h-9 rounded-chip border px-3 text-xs font-semibold transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire ${
                      selectedCountries.includes(country)
                        ? 'border-sapphire bg-[#DCE1FF] text-sapphire'
                        : 'border-hairline bg-paper text-ink-muted hover:bg-paper-sunken'
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-card border border-hairline bg-paper-raised p-5">
              <h2 className="font-ui-display text-base font-semibold text-ink">Study level</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {levels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleLevel(level)}
                    aria-pressed={selectedLevels.includes(level)}
                    className={`min-h-9 rounded-chip border px-3 text-xs font-semibold capitalize transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire ${
                      selectedLevels.includes(level)
                        ? 'border-sapphire bg-[#DCE1FF] text-sapphire'
                        : 'border-hairline bg-paper text-ink-muted hover:bg-paper-sunken'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-card border border-hairline bg-paper-raised p-5">
              <h2 className="font-ui-display text-base font-semibold text-ink">Minimum funding (USD)</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {[0, 25000, 50000].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMinAwardUSD(value)}
                    aria-pressed={minAwardUSD === value}
                    className={`min-h-9 rounded-chip border px-3 text-xs font-semibold transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire ${
                      minAwardUSD === value
                        ? 'border-sapphire bg-[#DCE1FF] text-sapphire'
                        : 'border-hairline bg-paper text-ink-muted hover:bg-paper-sunken'
                    }`}
                  >
                    {value === 0 ? 'Any' : `$${value.toLocaleString()}+`}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-card border border-hairline bg-paper-raised p-5">
              <h2 className="font-ui-display text-base font-semibold text-ink">Deadline window</h2>
              <div className="mt-3 flex flex-col gap-2">
                {[
                  { id: 'all', label: 'Any time' },
                  { id: 'urgent_30d', label: 'Due within 30 days' },
                  { id: '1_3_months', label: '1–3 months' },
                  { id: '3_6_months', label: '3–6 months' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDeadlineWindow(option.id)}
                    aria-pressed={deadlineWindow === option.id}
                    className={`min-h-9 rounded-control border px-3 text-left text-xs font-semibold transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire ${
                      deadlineWindow === option.id
                        ? 'border-sapphire bg-[#DCE1FF] text-sapphire'
                        : 'border-hairline bg-paper text-ink-muted hover:bg-paper-sunken'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {!profile ? (
              <div className="rounded-card border border-warn-border bg-warn-surface p-5">
                <p className="text-sm font-semibold text-warn-text">No profile yet</p>
                <p className="mt-1 text-xs leading-relaxed text-ink">
                  Eligibility verdicts need your profile. Build one in about two minutes.
                </p>
                <Button variant="primary" size="md" onClick={onOpenProfileBuilder} className="mt-3">
                  Build profile
                </Button>
              </div>
            ) : null}
          </aside>

          <main className="lg:col-span-8 xl:col-span-9">
            {loadingFromDB ? (
              <SkeletonRows rows={5} />
            ) : filteredScholarships.length === 0 ? (
              <EmptyState
                icon="filters"
                title="No scholarships match these filters"
                description="Try widening the country, level, funding, or deadline filters."
                action={<Button variant="secondary" size="md" onClick={clearAllFilters}>Clear all filters</Button>}
              />
            ) : (
              <ul className="divide-y divide-hairline border-y border-hairline">
                {filteredScholarships.map(({ scholarship, evaluation }) => {
                  const deadline = getDeadlineDisplay(scholarship.applicationDeadline);
                  const saved = isSaved(scholarship.id);
                  return (
                    <li key={scholarship.id} className="py-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/scholarship/${scholarship.id}`}
                            className="font-ui-display text-lg font-semibold leading-snug text-ink hover:text-sapphire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
                          >
                            {scholarship.title}
                          </Link>
                          <p className="mt-1 text-sm text-ink-muted">
                            {scholarship.providerName} · {scholarship.destinationCountries.join(', ')}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                            <span className="font-data">
                              {scholarship.studyLevels.map((l) => l).join(', ')}
                            </span>
                            <span aria-hidden>·</span>
                            <span className="font-data">{scholarship.totalAwardValue}</span>
                            <span aria-hidden>·</span>
                            <span
                              className={`font-data ${
                                deadline.isClosed
                                  ? 'text-bad-text'
                                  : deadline.daysRemaining <= 14
                                    ? 'text-warn-text'
                                    : 'text-ink-muted'
                              }`}
                            >
                              {deadline.isClosed
                                ? 'Cycle closed'
                                : deadline.daysRemaining === 0
                                  ? 'Closes today'
                                  : `${deadline.daysRemaining} days left`}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge
                              tone={
                                evaluation.status === 'likely_eligible'
                                  ? 'ok'
                                  : evaluation.status === 'more_info_needed'
                                    ? 'warn'
                                    : 'bad'
                              }
                            >
                              {evaluation.status === 'likely_eligible'
                                ? 'Likely eligible'
                                : evaluation.status === 'more_info_needed'
                                  ? 'Needs review'
                                  : 'Not eligible'}
                            </Badge>
                            {profile ? (
                              <span className="text-xs text-ink-muted">
                                Match score {evaluation.matchScore}%
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleSaveToggle(scholarship)}
                            aria-pressed={saved}
                            aria-label={saved ? 'Remove from saved' : 'Save scholarship'}
                            className="flex h-11 w-11 items-center justify-center rounded-control border border-hairline bg-paper-raised text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
                          >
                            <Icon name={saved ? 'savedActive' : 'saved'} size={18} className={saved ? 'text-sapphire' : ''} />
                          </button>
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => onSelectScholarship(scholarship)}
                          >
                            View details
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </main>
        </div>
      </Container>
    </div>
  );
};
