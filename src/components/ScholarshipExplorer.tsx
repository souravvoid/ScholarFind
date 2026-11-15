import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Scholarship, DegreeLevel, CoverageType } from '../types';
import { evaluateEligibility } from '../utils/eligibilityEngine';
import { getDeadlineDisplay } from '../services/databaseService';
import { getScholarshipsFromDatabase } from '../services/catalogueService';
import {
  GEOGRAPHIC_REGIONS,
  isScholarshipInRegion,
  COVERAGE_TYPE_OPTIONS,
  FundingBasisFilter,
  getScholarshipFundingNature,
  DEADLINE_PROXIMITY_OPTIONS,
} from '../utils/filterConstants';
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
  onOpenProfileBuilder: () => void;
}> = ({ onOpenProfileBuilder }) => {
  const { profile, isSaved, saveScholarship, unsaveScholarship } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loadingFromDB, setLoadingFromDB] = useState<boolean>(false);
  const [dbErrorMessage, setDbErrorMessage] = useState<string | null>(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  // Filters state — defaults show full catalogue (decision 12)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') ?? 'deadline');

  // Geographic Location
  const [selectedRegions, setSelectedRegions] = useState<string[]>(
    searchParams.get('region') ? searchParams.get('region')!.split(',').filter(Boolean) : [],
  );
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    searchParams.get('country') ? searchParams.get('country')!.split(',').filter(Boolean) : [],
  );

  // Funding Type
  const [fundingBasis, setFundingBasis] = useState<FundingBasisFilter>(
    (searchParams.get('funding') as FundingBasisFilter) || 'all',
  );
  const [selectedCoverage, setSelectedCoverage] = useState<CoverageType[]>(
    searchParams.get('coverage')
      ? (searchParams.get('coverage')!.split(',').filter(Boolean) as CoverageType[])
      : [],
  );
  const [minAwardUSD, setMinAwardUSD] = useState<number>(
    searchParams.get('min_award') ? Number(searchParams.get('min_award')) : 0,
  );

  // Degree Level
  const [selectedLevels, setSelectedLevels] = useState<DegreeLevel[]>(
    searchParams.get('degree')
      ? (searchParams.get('degree')!.split(',').filter(Boolean) as DegreeLevel[])
      : [],
  );

  // Deadline Proximity
  const [deadlineWindow, setDeadlineWindow] = useState<string>(searchParams.get('deadline') ?? 'all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  // Load from the canonical Django catalogue API.
  useEffect(() => {
    let isMounted = true;
    async function fetchFromDB() {
      setLoadingFromDB(true);
      try {
        const res = await getScholarshipsFromDatabase();
        if (isMounted) {
          setScholarships(res.data);
          setDbErrorMessage(res.error ?? null);
          setIsOfflineFallback(!res.fromDatabase && res.data.length > 0);
        }
      } catch (err) {
        if (isMounted) {
          setDbErrorMessage(err instanceof Error ? err.message : 'Could not load catalogue.');
        }
      } finally {
        if (isMounted) {
          setLoadingFromDB(false);
        }
      }
    }
    void fetchFromDB();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync filter state → URL (shareable, refresh-safe, deep-linkable)
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedRegions.length) params.set('region', selectedRegions.join(','));
    if (selectedCountries.length) params.set('country', selectedCountries.join(','));
    if (fundingBasis && fundingBasis !== 'all') params.set('funding', fundingBasis);
    if (selectedCoverage.length) params.set('coverage', selectedCoverage.join(','));
    if (selectedLevels.length) params.set('degree', selectedLevels.join(','));
    if (minAwardUSD > 0) params.set('min_award', String(minAwardUSD));
    if (deadlineWindow && deadlineWindow !== 'all') params.set('deadline', deadlineWindow);
    if (selectedSort && selectedSort !== 'deadline') params.set('sort', selectedSort);
    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    selectedRegions,
    selectedCountries,
    fundingBasis,
    selectedCoverage,
    selectedLevels,
    minAwardUSD,
    deadlineWindow,
    selectedSort,
    setSearchParams,
  ]);

  // Keyboard accessibility for mobile filter drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileFiltersOpen) {
        setMobileFiltersOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileFiltersOpen]);

  const scholarshipsWithEvaluation = useMemo(() => {
    return scholarships.map((sch) => ({
      scholarship: sch,
      evaluation: evaluateEligibility(sch, profile),
    }));
  }, [scholarships, profile]);

  const filteredScholarships = useMemo(() => {
    return scholarshipsWithEvaluation
      .filter(({ scholarship }) => {
        // Text Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            scholarship.title.toLowerCase().includes(q) ||
            scholarship.providerName.toLowerCase().includes(q) ||
            scholarship.destinationCountries.some((c) => c.toLowerCase().includes(q)) ||
            scholarship.fieldsOfStudy.some((f) => f.toLowerCase().includes(q));
          if (!matches) return false;
        }

        // Geographic Location: Macro-regions
        if (selectedRegions.length > 0) {
          const matchesRegion = selectedRegions.some((rId) => isScholarshipInRegion(scholarship, rId));
          if (!matchesRegion) return false;
        }

        // Geographic Location: Destination Countries
        if (selectedCountries.length > 0) {
          if (!scholarship.destinationCountries.some((c) => selectedCountries.includes(c))) return false;
        }

        // Funding Type: Nature (Merit vs Need)
        if (fundingBasis !== 'all') {
          const nature = getScholarshipFundingNature(scholarship);
          if (!nature.includes(fundingBasis)) return false;
        }

        // Funding Type: Coverage Scope
        if (selectedCoverage.length > 0) {
          const hasCoverage = selectedCoverage.some((cov) => scholarship.coverageTypes?.includes(cov));
          if (!hasCoverage) return false;
        }

        // Degree Level
        if (selectedLevels.length > 0) {
          if (!scholarship.studyLevels.some((l) => selectedLevels.includes(l))) return false;
        }

        // Minimum Funding
        if (scholarship.estimatedUSDValue < minAwardUSD) return false;

        // Deadline Proximity
        if (deadlineWindow !== 'all') {
          const proximityOpt = DEADLINE_PROXIMITY_OPTIONS.find((opt) => opt.id === deadlineWindow);
          if (proximityOpt && !proximityOpt.match(scholarship.daysRemaining ?? Number.NaN)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (selectedSort === 'deadline') {
          return (a.scholarship.daysRemaining ?? Number.POSITIVE_INFINITY) -
            (b.scholarship.daysRemaining ?? Number.POSITIVE_INFINITY);
        }
        if (selectedSort === 'funding') return b.scholarship.estimatedUSDValue - a.scholarship.estimatedUSDValue;
        if (selectedSort === 'match') return b.evaluation.matchScore - a.evaluation.matchScore;
        return 0;
      });
  }, [
    scholarshipsWithEvaluation,
    searchQuery,
    selectedRegions,
    selectedCountries,
    fundingBasis,
    selectedCoverage,
    selectedLevels,
    minAwardUSD,
    deadlineWindow,
    selectedSort,
  ]);

  const eligibleCount = scholarshipsWithEvaluation.filter((i) => i.evaluation.status === 'likely_eligible').length;

  const toggleRegion = useCallback((regionId: string) => {
    setSelectedRegions((prev) =>
      prev.includes(regionId) ? prev.filter((r) => r !== regionId) : [...prev, regionId],
    );
  }, []);

  const toggleCountry = useCallback((country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country],
    );
  }, []);

  const toggleCoverage = useCallback((cov: CoverageType) => {
    setSelectedCoverage((prev) =>
      prev.includes(cov) ? prev.filter((c) => c !== cov) : [...prev, cov],
    );
  }, []);

  const toggleLevel = useCallback((level: DegreeLevel) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedRegions([]);
    setSelectedCountries([]);
    setFundingBasis('all');
    setSelectedCoverage([]);
    setSelectedLevels([]);
    setMinAwardUSD(0);
    setDeadlineWindow('all');
  }, []);

  // Compute active chips for toolbar
  const activeFilters: { id: string; label: string; onRemove: () => void }[] = [];
  if (searchQuery.trim()) {
    activeFilters.push({ id: 'q', label: `“${searchQuery.trim()}”`, onRemove: () => setSearchQuery('') });
  }
  selectedRegions.forEach((regId) => {
    const reg = GEOGRAPHIC_REGIONS.find((r) => r.id === regId);
    activeFilters.push({
      id: `reg-${regId}`,
      label: `Region: ${reg?.label ?? regId}`,
      onRemove: () => toggleRegion(regId),
    });
  });
  selectedCountries.forEach((c) => {
    activeFilters.push({ id: `c-${c}`, label: c, onRemove: () => toggleCountry(c) });
  });
  if (fundingBasis !== 'all') {
    activeFilters.push({
      id: 'funding-basis',
      label: fundingBasis === 'need' ? 'Basis: Need-based' : 'Basis: Merit-based',
      onRemove: () => setFundingBasis('all'),
    });
  }
  selectedCoverage.forEach((cov) => {
    const opt = COVERAGE_TYPE_OPTIONS.find((o) => o.id === cov);
    activeFilters.push({
      id: `cov-${cov}`,
      label: `Coverage: ${opt?.label ?? cov}`,
      onRemove: () => toggleCoverage(cov),
    });
  });
  selectedLevels.forEach((l) => {
    activeFilters.push({ id: `l-${l}`, label: `Level: ${l}`, onRemove: () => toggleLevel(l) });
  });
  if (minAwardUSD > 0) {
    activeFilters.push({
      id: 'award',
      label: `≥ $${minAwardUSD.toLocaleString()}`,
      onRemove: () => setMinAwardUSD(0),
    });
  }
  if (deadlineWindow !== 'all') {
    const opt = DEADLINE_PROXIMITY_OPTIONS.find((o) => o.id === deadlineWindow);
    activeFilters.push({
      id: 'deadline',
      label: `Deadline: ${opt?.shortLabel ?? deadlineWindow}`,
      onRemove: () => setDeadlineWindow('all'),
    });
  }

  // Precomputed catalog lists & live counts
  const countries = useMemo(
    () => Array.from(new Set(scholarships.flatMap((s) => s.destinationCountries))).sort(),
    [scholarships],
  );
  const levels: DegreeLevel[] = ['bachelors', 'masters', 'phd'];

  const deadlineCounts = useMemo(() => {
    const map: Record<string, number> = {};
    DEADLINE_PROXIMITY_OPTIONS.forEach((opt) => {
      map[opt.id] = scholarships.filter((s) => opt.match(s.daysRemaining ?? Number.NaN)).length;
    });
    return map;
  }, [scholarships]);

  const regionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    GEOGRAPHIC_REGIONS.forEach((reg) => {
      map[reg.id] = scholarships.filter((s) => isScholarshipInRegion(s, reg.id)).length;
    });
    return map;
  }, [scholarships]);

  const countryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    countries.forEach((country) => {
      map[country] = scholarships.filter((s) => s.destinationCountries.includes(country)).length;
    });
    return map;
  }, [scholarships, countries]);

  const fundingCounts = useMemo(() => {
    return {
      all: scholarships.length,
      merit: scholarships.filter((s) => getScholarshipFundingNature(s).includes('merit')).length,
      need: scholarships.filter((s) => getScholarshipFundingNature(s).includes('need')).length,
    };
  }, [scholarships]);

  const coverageCounts = useMemo(() => {
    const map: Record<CoverageType, number> = {
      full_ride: 0,
      full_tuition: 0,
      stipend: 0,
      travel: 0,
      health: 0,
    };
    COVERAGE_TYPE_OPTIONS.forEach((opt) => {
      map[opt.id] = scholarships.filter((s) => s.coverageTypes?.includes(opt.id)).length;
    });
    return map;
  }, [scholarships]);

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

  // Reusable Filter Controls Panel
  const renderFilterControls = (isMobileView = false) => (
    <div className="space-y-6">
      {/* 1. Deadline Proximity */}
      <section className="rounded-card border border-hairline bg-paper-raised p-5" aria-labelledby="filter-heading-deadline">
        <div className="flex items-center gap-2">
          <Icon name="deadline" size={16} className="text-sapphire" />
          <h2 id="filter-heading-deadline" className="font-ui-display text-base font-semibold text-ink">
            Deadline proximity
          </h2>
        </div>
        <p className="mt-1 text-xs text-ink-muted">Filter opportunities by cycle urgency</p>
        <div className="mt-3 flex flex-col gap-2" role="group" aria-label="Deadline proximity options">
          {DEADLINE_PROXIMITY_OPTIONS.map((option) => {
            const isSelected = deadlineWindow === option.id;
            const count = deadlineCounts[option.id] ?? 0;
            const isUrgent = option.id === 'urgent_14d';
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setDeadlineWindow(option.id)}
                aria-pressed={isSelected}
                className={`flex min-h-10 items-center justify-between rounded-control border px-3 text-left text-xs font-semibold transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire ${
                  isSelected
                    ? 'border-sapphire bg-[#DCE1FF] text-sapphire shadow-xs'
                    : 'border-hairline bg-paper text-ink-muted hover:bg-paper-sunken hover:text-ink'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isUrgent ? (
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 rounded-full bg-missing-text"
                    />
                  ) : null}
                  <span>{option.label}</span>
                </span>
                <span className="font-data text-[11px] tabular-nums text-ink-muted/80">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Geographic Location: Macro-regions & Destination Countries */}
      <section className="rounded-card border border-hairline bg-paper-raised p-5" aria-labelledby="filter-heading-geo">
        <div className="flex items-center gap-2">
          <Icon name="location" size={16} className="text-sapphire" />
          <h2 id="filter-heading-geo" className="font-ui-display text-base font-semibold text-ink">
            Geographic location
          </h2>
        </div>
        <p className="mt-1 text-xs text-ink-muted">Study destination macro-regions & countries</p>

        {/* Macro Regions */}
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Macro-regions
          </p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Macro regions">
            {GEOGRAPHIC_REGIONS.map((region) => {
              const isSelected = selectedRegions.includes(region.id);
              const count = regionCounts[region.id] ?? 0;
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => toggleRegion(region.id)}
                  aria-pressed={isSelected}
                  className={`flex min-h-9 items-center gap-1.5 rounded-chip border px-3 text-xs font-semibold transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire ${
                    isSelected
                      ? 'border-sapphire bg-[#DCE1FF] text-sapphire shadow-xs'
                      : 'border-hairline bg-paper text-ink-muted hover:bg-paper-sunken hover:text-ink'
                  }`}
                >
                  <span>{region.label}</span>
                  <span className="font-data text-[11px] tabular-nums text-ink-muted/80">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Specific Countries */}
        <div className="mt-4 border-t border-hairline pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Destination countries
          </p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Destination countries">
            {countries.map((country) => {
              const isSelected = selectedCountries.includes(country);
              const count = countryCounts[country] ?? 0;
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => toggleCountry(country)}
                  aria-pressed={isSelected}
                  className={`flex min-h-9 items-center gap-1.5 rounded-chip border px-3 text-xs font-semibold transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire ${
                    isSelected
                      ? 'border-sapphire bg-[#DCE1FF] text-sapphire shadow-xs'
                      : 'border-hairline bg-paper text-ink-muted hover:bg-paper-sunken hover:text-ink'
                  }`}
                >
                  <span>{country}</span>
                  <span className="font-data text-[11px] tabular-nums text-ink-muted/80">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Funding Type & Coverage */}
      <section className="rounded-card border border-hairline bg-paper-raised p-5" aria-labelledby="filter-heading-funding">
        <div className="flex items-center gap-2">
          <Icon name="funding" size={16} className="text-sapphire" />
          <h2 id="filter-heading-funding" className="font-ui-display text-base font-semibold text-ink">
            Funding type & coverage
          </h2>
        </div>
        <p className="mt-1 text-xs text-ink-muted">Filter by award basis and financial package</p>

        {/* Funding Basis: All, Merit-based, Need-based */}
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Funding model
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3" role="group" aria-label="Funding model">
            {[
              { id: 'all', label: 'All types', count: fundingCounts.all },
              { id: 'merit', label: 'Merit-based', count: fundingCounts.merit },
              { id: 'need', label: 'Need-based', count: fundingCounts.need },
            ].map((item) => {
              const isSelected = fundingBasis === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFundingBasis(item.id as FundingBasisFilter)}
                  aria-pressed={isSelected}
                  className={`flex min-h-9 items-center justify-between rounded-control border px-3 text-xs font-semibold transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire ${
                    isSelected
                      ? 'border-sapphire bg-[#DCE1FF] text-sapphire shadow-xs'
                      : 'border-hairline bg-paper text-ink-muted hover:bg-paper-sunken hover:text-ink'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="font-data text-[11px] tabular-nums text-ink-muted/80">
                    ({item.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coverage Scope */}
        <div className="mt-4 border-t border-hairline pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Coverage inclusions
          </p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Coverage inclusions">
            {COVERAGE_TYPE_OPTIONS.map((cov) => {
              const isSelected = selectedCoverage.includes(cov.id);
              const count = coverageCounts[cov.id] ?? 0;
              return (
                <button
                  key={cov.id}
                  type="button"
                  onClick={() => toggleCoverage(cov.id)}
                  aria-pressed={isSelected}
                  className={`flex min-h-9 items-center gap-1.5 rounded-chip border px-3 text-xs font-semibold transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire ${
                    isSelected
                      ? 'border-sapphire bg-[#DCE1FF] text-sapphire shadow-xs'
                      : 'border-hairline bg-paper text-ink-muted hover:bg-paper-sunken hover:text-ink'
                  }`}
                >
                  <span>{cov.label}</span>
                  <span className="font-data text-[11px] tabular-nums text-ink-muted/80">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Minimum Funding Threshold */}
        <div className="mt-4 border-t border-hairline pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Minimum award value (USD)
          </p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Minimum award value">
            {[0, 25000, 50000, 75000].map((value) => {
              const isSelected = minAwardUSD === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMinAwardUSD(value)}
                  aria-pressed={isSelected}
                  className={`min-h-9 rounded-chip border px-3 text-xs font-semibold transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire ${
                    isSelected
                      ? 'border-sapphire bg-[#DCE1FF] text-sapphire shadow-xs'
                      : 'border-hairline bg-paper text-ink-muted hover:bg-paper-sunken hover:text-ink'
                  }`}
                >
                  {value === 0 ? 'Any amount' : `$${value.toLocaleString()}+`}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Study Level */}
      <section className="rounded-card border border-hairline bg-paper-raised p-5" aria-labelledby="filter-heading-degree">
        <div className="flex items-center gap-2">
          <Icon name="degree" size={16} className="text-sapphire" />
          <h2 id="filter-heading-degree" className="font-ui-display text-base font-semibold text-ink">
            Study level
          </h2>
        </div>
        <p className="mt-1 text-xs text-ink-muted">Eligible degree qualifications</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Study level options">
          {levels.map((level) => {
            const isSelected = selectedLevels.includes(level);
            return (
              <button
                key={level}
                type="button"
                onClick={() => toggleLevel(level)}
                aria-pressed={isSelected}
                className={`min-h-9 rounded-chip border px-3 text-xs font-semibold capitalize transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire ${
                  isSelected
                    ? 'border-sapphire bg-[#DCE1FF] text-sapphire shadow-xs'
                    : 'border-hairline bg-paper text-ink-muted hover:bg-paper-sunken hover:text-ink'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </section>

      {/* Profile Builder prompt if user has no profile */}
      {!profile ? (
        <div className="rounded-card border border-warn-border bg-warn-surface p-5">
          <p className="text-sm font-semibold text-warn-text">No profile yet</p>
          <p className="mt-1 text-xs leading-relaxed text-ink">
            Eligibility verdicts need your profile credentials. Build one in about two minutes.
          </p>
          <Button variant="primary" size="md" onClick={onOpenProfileBuilder} className="mt-3">
            Build profile
          </Button>
        </div>
      ) : null}

      {/* Mobile Drawer Actions */}
      {isMobileView ? (
        <div className="sticky bottom-0 -mx-6 -mb-6 flex items-center justify-between gap-3 border-t border-hairline bg-paper p-4">
          <Button variant="ghost" size="md" onClick={clearAllFilters}>
            Reset all
          </Button>
          <Button variant="primary" size="md" onClick={() => setMobileFiltersOpen(false)}>
            Apply filters ({filteredScholarships.length})
          </Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="w-full max-w-full">
      {/* Top Page Header */}
      <div className="border-b border-hairline bg-paper">
        <Container className="py-10 md:py-14">
          <p className="font-data text-[11px] uppercase tracking-[0.14em] text-ink-muted">Catalogue</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1 className="font-ui-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">
                Explore verified scholarships
              </h1>
              <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-muted" aria-live="polite">
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
                  aria-label="Sort scholarships"
                  className="min-h-11 rounded-control border border-hairline bg-paper-raised px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
                >
                  <option value="deadline">Deadline (soonest)</option>
                  <option value="funding">Funding (highest value)</option>
                  <option value="match">Match score</option>
                </select>
              </label>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setMobileFiltersOpen((o) => !o)}
                aria-expanded={mobileFiltersOpen}
                aria-label="Toggle filter drawer"
                className="lg:hidden"
              >
                <Icon name="filters" size={16} />
                <span>Filters</span>
                {activeFilters.length > 0 ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sapphire text-[10px] font-bold text-white">
                    {activeFilters.length}
                  </span>
                ) : null}
              </Button>
            </div>
          </div>

          {/* Search Bar & Clear Action */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, provider, destination country, or field of study"
              aria-label="Search scholarships"
              className="min-h-11 flex-1 rounded-control border border-hairline bg-paper-raised px-3.5 text-[15px] text-ink placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
            />
            {activeFilters.length > 0 ? (
              <Button variant="ghost" size="md" onClick={clearAllFilters} aria-label="Clear all active filters">
                Clear all ({activeFilters.length})
              </Button>
            ) : null}
          </div>

          {/* Active Filter Chips Toolbar */}
          {activeFilters.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2" role="region" aria-label="Active filters">
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

      {/* Main Content Area */}
      <Container className="py-8">
        {dbErrorMessage ? (
          <ErrorPanel
            title={isOfflineFallback ? 'Offline catalogue' : 'Catalogue unavailable'}
            message={dbErrorMessage}
            className="mb-6"
          />
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Desktop Left Sidebar Filters */}
          <aside
            className="hidden lg:col-span-4 lg:block xl:col-span-3"
            aria-label="Scholarship catalogue filters"
          >
            {renderFilterControls(false)}
          </aside>

          {/* Mobile Filter Drawer Modal */}
          {mobileFiltersOpen ? (
            <div
              className="fixed inset-0 z-50 flex justify-end lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-filters-title"
            >
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
                onClick={() => setMobileFiltersOpen(false)}
                aria-hidden="true"
              />

              {/* Drawer Container */}
              <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-paper p-6 shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <div className="flex items-center gap-2">
                    <Icon name="filters" size={20} className="text-sapphire" />
                    <h2 id="mobile-filters-title" className="font-ui-display text-lg font-semibold text-ink">
                      Filter scholarships
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    aria-label="Close filters drawer"
                    className="flex h-10 w-10 items-center justify-center rounded-control border border-hairline bg-paper-raised text-ink-muted hover:bg-paper-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-sapphire"
                  >
                    <Icon name="close" size={20} />
                  </button>
                </div>

                <div className="mt-6 flex-1">
                  {renderFilterControls(true)}
                </div>
              </div>
            </div>
          ) : null}

          {/* Scholarship Results List */}
          <main className="lg:col-span-8 xl:col-span-9" aria-label="Scholarship listings">
            {loadingFromDB && scholarships.length === 0 ? (
              <SkeletonRows rows={5} />
            ) : filteredScholarships.length === 0 ? (
              <EmptyState
                icon="filters"
                title={scholarships.length === 0 ? 'No opportunities in the catalogue' : 'No scholarships match these filters'}
                description={
                  scholarships.length === 0
                    ? 'The catalogue returned no records. Try again later or check your connection.'
                    : 'Try clearing or broadening your funding type, geographic location, or deadline filters.'
                }
                action={
                  <Button variant="secondary" size="md" onClick={clearAllFilters}>
                    Clear all filters
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-hairline border-y border-hairline" role="list">
                {filteredScholarships.map(({ scholarship, evaluation }) => {
                  const deadline = getDeadlineDisplay(scholarship.applicationDeadline);
                  const saved = isSaved(scholarship.id);
                  const fundingNature = getScholarshipFundingNature(scholarship);
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
                            <span aria-hidden="true">·</span>
                            <span className="font-data">{scholarship.totalAwardValue}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize text-ink-muted font-medium">
                              {fundingNature.includes('need')
                                ? 'Merit & Need-based'
                                : fundingNature.includes('merit')
                                  ? 'Merit-based'
                                  : 'Funding basis not specified'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-data font-medium ${
                                deadline.daysRemaining === null
                                  ? 'text-ink-muted'
                                  : deadline.isClosed
                                  ? 'text-missing-text'
                                  : deadline.daysRemaining <= 14
                                    ? 'text-missing-text font-semibold'
                                    : deadline.daysRemaining <= 30
                                      ? 'text-pending-text'
                                      : 'text-ink-muted'
                              }`}
                            >
                              {deadline.daysRemaining === null
                                ? 'Deadline not published'
                                : deadline.isClosed
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
                                  : evaluation.status === 'more_info_needed' ||
                                      evaluation.status === 'needs_review'
                                    ? 'warn'
                                    : 'bad'
                              }
                            >
                              {evaluation.status === 'likely_eligible'
                                ? 'Likely eligible'
                                : evaluation.status === 'more_info_needed'
                                  ? 'Info needed'
                                  : evaluation.status === 'needs_review'
                                    ? 'Manual review'
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
                            <Icon
                              name={saved ? 'savedActive' : 'saved'}
                              size={18}
                              className={saved ? 'text-sapphire' : ''}
                            />
                          </button>
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => navigate(`/scholarship/${scholarship.id}`)}
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
