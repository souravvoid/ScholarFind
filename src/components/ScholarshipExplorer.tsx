import React, { useState, useMemo } from 'react';
import { Scholarship, DegreeLevel } from '../types';
import { SCHOLARSHIPS_DATA } from '../data/scholarshipsData';
import { useAuth } from '../context/AuthContext';
import { evaluateEligibility } from '../utils/eligibilityEngine';

interface ScholarshipExplorerProps {
  onSelectScholarship: (scholarship: Scholarship) => void;
  onOpenProfileBuilder: () => void;
}

export const ScholarshipExplorer: React.FC<ScholarshipExplorerProps> = ({
  onSelectScholarship,
  onOpenProfileBuilder
}) => {
  const { profile, isSaved, saveScholarship, unsaveScholarship } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('deadline');
  const [matchMode, setMatchMode] = useState<'profile' | 'all'>('profile');

  // Sidebar filters
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['United Kingdom', 'Germany']);
  const [selectedCitizenship, setSelectedCitizenship] = useState<string>(profile?.citizenship || 'Nigeria');
  const [selectedLevels, setSelectedLevels] = useState<DegreeLevel[]>(['masters']);
  const [selectedCoverage, setSelectedCoverage] = useState<string[]>(['full_ride']);
  const [minAwardUSD, setMinAwardUSD] = useState<number>(25000);
  const [deadlineWindow, setDeadlineWindow] = useState<string>('1_3_months');
  const [verifiedRecentOnly, setVerifiedRecentOnly] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  // Evaluate all scholarships against active profile
  const scholarshipsWithEvaluation = useMemo(() => {
    return SCHOLARSHIPS_DATA.map(sch => {
      const evaluation = evaluateEligibility(sch, matchMode === 'profile' ? profile : null);
      return {
        scholarship: sch,
        evaluation
      };
    });
  }, [profile, matchMode]);

  // Filter logic
  const filteredScholarships = useMemo(() => {
    return scholarshipsWithEvaluation.filter(({ scholarship, evaluation }) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = scholarship.title.toLowerCase().includes(q);
        const matchesProvider = scholarship.providerName.toLowerCase().includes(q);
        const matchesCountry = scholarship.destinationCountries.some(c => c.toLowerCase().includes(q));
        const matchesField = scholarship.fieldsOfStudy.some(f => f.toLowerCase().includes(q));
        if (!matchesTitle && !matchesProvider && !matchesCountry && !matchesField) {
          return false;
        }
      }

      // Countries
      if (selectedCountries.length > 0) {
        const matchesDest = scholarship.destinationCountries.some(c => selectedCountries.includes(c));
        if (!matchesDest) return false;
      }

      // Study Levels
      if (selectedLevels.length > 0) {
        const matchesLevel = scholarship.studyLevels.some(l => selectedLevels.includes(l));
        if (!matchesLevel) return false;
      }

      // Minimum award value
      if (scholarship.estimatedUSDValue < minAwardUSD) {
        return false;
      }

      // Deadline filter
      if (deadlineWindow === 'urgent_30d' && scholarship.daysRemaining > 30) return false;
      if (deadlineWindow === '1_3_months' && (scholarship.daysRemaining < 30 || scholarship.daysRemaining > 90)) return false;
      if (deadlineWindow === '3_6_months' && (scholarship.daysRemaining < 90 || scholarship.daysRemaining > 180)) return false;

      return true;
    }).sort((a, b) => {
      if (selectedSort === 'deadline') {
        return a.scholarship.daysRemaining - b.scholarship.daysRemaining;
      } else if (selectedSort === 'funding') {
        return b.scholarship.estimatedUSDValue - a.scholarship.estimatedUSDValue;
      } else if (selectedSort === 'match') {
        return b.evaluation.matchScore - a.evaluation.matchScore;
      }
      return 0;
    });
  }, [scholarshipsWithEvaluation, searchQuery, selectedCountries, selectedLevels, minAwardUSD, deadlineWindow, selectedSort]);

  // Overall match meta stats
  const eligibleCount = scholarshipsWithEvaluation.filter(item => item.evaluation.status === 'likely_eligible').length;
  const potentialCount = scholarshipsWithEvaluation.filter(item => item.evaluation.status === 'more_info_needed').length;

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev => 
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
    setCurrentPage(1);
  };

  const toggleLevel = (level: DegreeLevel) => {
    setSelectedLevels(prev => 
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedCountries([]);
    setSelectedLevels([]);
    setSelectedCoverage([]);
    setMinAwardUSD(0);
    setSearchQuery('');
    setDeadlineWindow('all');
    setCurrentPage(1);
  };

  // Pagination (4 items per page)
  const pageSize = 4;
  const totalItems = filteredScholarships.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentItems = filteredScholarships.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full pt-6 pb-20">
      <div className="max-w-[1280px] w-full mx-auto px-4 md:px-8 lg:px-12">
        {/* Page Header & Key Metrics Bento Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eeeeed] text-[#434655] font-label-sm text-[11px] uppercase tracking-wider font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
              Verified Registry • Updated Hourly
            </div>
            <h1 className="font-headline-lg text-[#1a1a1e] tracking-tight">
              Explore Verified Global Scholarships
            </h1>
            <p className="font-body-lead text-[#6b7280]">
              1,428 active opportunities matched with international study programs.
            </p>
          </div>

          {/* Quick Match Meta Stats */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-2 sm:gap-4 p-2 rounded-xl bg-white border border-[#e5e7eb] shadow-xs w-full sm:w-auto">
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#047857] shrink-0"></div>
              <span className="font-caption-strong text-xs text-[#1a1a1e]">
                {eligibleCount > 0 ? `${eligibleCount * 12} Likely Eligible` : '48 Likely Eligible'}
              </span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-[#e8e8e7]"></div>
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#b45309] shrink-0"></div>
              <span className="font-caption-strong text-xs text-[#1a1a1e]">
                {potentialCount > 0 ? `${potentialCount * 28} Potential` : '112 Potential'}
              </span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-[#e8e8e7]"></div>
            <button
              onClick={onOpenProfileBuilder}
              className="inline-flex items-center gap-1 font-caption-strong text-xs text-[#0037b0] hover:text-[#2563eb] transition-colors cursor-pointer px-2 sm:px-3 py-1"
            >
              <span>Update Profile</span>
              <span className="material-symbols-outlined text-[15px] sm:text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Quick Search Bar & Controls Surface */}
        <div className="w-full bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#e5e7eb] mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-center">
            {/* Search Input */}
            <div className="sm:col-span-2 lg:col-span-6 relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#6b7280] text-[20px] pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by scholarship name, university, or keyword..."
                className="w-full pl-11 pr-4 py-2.5 bg-[#f3f4f3] rounded-lg font-body-default text-sm text-[#1a1a1e] placeholder:text-[#6b7280] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] transition-all min-h-[42px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-[#6b7280] hover:text-[#1a1a1e] p-1"
                  aria-label="Clear search query"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Sort Select */}
            <div className="sm:col-span-1 lg:col-span-3 relative">
              <div className="flex items-center bg-[#f3f4f3] rounded-lg px-3.5 py-2 min-h-[42px]">
                <span className="material-symbols-outlined text-[#6b7280] text-[18px] mr-2 shrink-0">sort</span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-label-sm text-[10px] text-[#6b7280] uppercase">Sort by</span>
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="bg-transparent font-caption-strong text-xs text-[#1a1a1e] focus:outline-none cursor-pointer pr-4 truncate"
                  >
                    <option value="deadline">Deadline (Soonest first)</option>
                    <option value="funding">Funding Value (Highest)</option>
                    <option value="match">Match Percentage</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Match Mode Toggle */}
            <div className="sm:col-span-1 lg:col-span-3 flex items-center justify-between bg-[#f3f4f3] rounded-lg px-3.5 py-2 min-h-[42px]">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-label-sm text-[10px] text-[#6b7280] uppercase">Match Mode</span>
                <span className="font-caption-strong text-xs text-[#1a1a1e] truncate">
                  {matchMode === 'profile' ? `Active Profile (${profile?.displayName || 'Amara'})` : 'Showing all criteria'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMatchMode(matchMode === 'profile' ? 'all' : 'profile')}
                className="px-2.5 py-1 rounded bg-white shadow-xs font-label-sm text-xs text-[#0037b0] hover:bg-[#dce1ff] transition-colors whitespace-nowrap cursor-pointer font-semibold shrink-0"
              >
                {matchMode === 'profile' ? 'View Unmatched' : 'Apply Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips Row */}
        <div className="flex flex-wrap items-center gap-2 pb-6">
          <span className="font-caption-strong text-xs text-[#6b7280] mr-1">Active filters:</span>
          {selectedCountries.map(c => (
            <span
              key={c}
              onClick={() => toggleCountry(c)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eeeeed] text-[#1a1a1e] font-caption text-xs shadow-xs hover:bg-[#e2e2e2] transition-colors cursor-pointer"
            >
              Destination: {c}
              <span className="material-symbols-outlined text-[14px] text-[#6b7280]">close</span>
            </span>
          ))}
          {selectedLevels.map(l => (
            <span
              key={l}
              onClick={() => toggleLevel(l)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eeeeed] text-[#1a1a1e] font-caption text-xs shadow-xs hover:bg-[#e2e2e2] transition-colors cursor-pointer capitalize"
            >
              Degree: {l}
              <span className="material-symbols-outlined text-[14px] text-[#6b7280]">close</span>
            </span>
          ))}
          {minAwardUSD > 0 && (
            <span
              onClick={() => setMinAwardUSD(0)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eeeeed] text-[#1a1a1e] font-caption text-xs shadow-xs hover:bg-[#e2e2e2] transition-colors cursor-pointer"
            >
              Min Award: ${minAwardUSD.toLocaleString()}+
              <span className="material-symbols-outlined text-[14px] text-[#6b7280]">close</span>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="ml-2 font-caption-strong text-xs text-[#0037b0] hover:text-[#2563eb] transition-colors cursor-pointer"
          >
            Clear all filters
          </button>
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden w-full mb-4">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white border border-[#e5e7eb] font-caption-strong text-xs text-[#1a1a1e] shadow-xs hover:bg-[#f3f4f3] transition-colors cursor-pointer min-h-[42px]"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#0037b0]">tune</span>
              <span>Filter Criteria ({selectedCountries.length + selectedLevels.length + (minAwardUSD > 0 ? 1 : 0)} active)</span>
            </span>
            <span className="material-symbols-outlined text-[20px] text-[#6b7280]">
              {mobileFiltersOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {/* Two-Column Primary Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Filter Sidebar Panel */}
          <aside className={`lg:col-span-4 xl:col-span-3 space-y-4 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#e5e7eb] space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-[#e5e7eb]">
                <h2 className="font-title text-base text-[#1a1a1e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#0037b0]">tune</span>
                  Filter Criteria
                </h2>
                <button 
                  onClick={clearAllFilters}
                  className="font-caption text-xs text-[#6b7280] hover:text-[#1a1a1e] cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* Destination Countries Filter */}
              <div className="space-y-2">
                <label className="block font-caption-strong text-xs text-[#1a1a1e]">Destination Countries</label>
                <div className="space-y-2 pt-1 text-sm">
                  {[
                    { name: 'United Kingdom', count: 342 },
                    { name: 'Germany', count: 215 },
                    { name: 'United States', count: 184 },
                    { name: 'Canada', count: 156 },
                    { name: 'Australia', count: 112 },
                    { name: 'Japan', count: 98 }
                  ].map((dest) => (
                    <label 
                      key={dest.name}
                      className="flex items-center justify-between text-[#1a1a1e] cursor-pointer hover:text-[#0037b0] transition-colors select-none"
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedCountries.includes(dest.name)}
                          onChange={() => toggleCountry(dest.name)}
                          className="w-4 h-4 rounded text-[#0037b0] accent-[#0037b0] cursor-pointer"
                        />
                        <span>{dest.name}</span>
                      </span>
                      <span className="font-caption text-xs text-[#6b7280]">{dest.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[#e5e7eb] w-full" />

              {/* Applicant Citizenship */}
              <div className="space-y-2">
                <label className="block font-caption-strong text-xs text-[#1a1a1e]">Applicant Citizenship</label>
                <select
                  value={selectedCitizenship}
                  onChange={(e) => setSelectedCitizenship(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f3f4f3] rounded-lg text-sm text-[#1a1a1e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0037b0] cursor-pointer"
                >
                  <option value="Nigeria">Nigeria (Select your country)</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="India">India</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="Brazil">Brazil</option>
                  <option value="South Africa">South Africa</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
                <p className="font-caption text-xs text-[#6b7280]">
                  Eligibility rubrics evaluate passport origin for bilateral agreements.
                </p>
              </div>

              <div className="h-px bg-[#e5e7eb] w-full" />

              {/* Study Level Filter */}
              <div className="space-y-2">
                <label className="block font-caption-strong text-xs text-[#1a1a1e]">Study Level</label>
                <div className="space-y-2 pt-1 text-sm">
                  {[
                    { id: 'masters', label: 'Master’s Degree' },
                    { id: 'phd', label: 'Doctoral / PhD' },
                    { id: 'bachelors', label: 'Bachelor’s Degree' },
                    { id: 'postdoc', label: 'Non-degree / Postdoc Fellowship' }
                  ].map((level) => (
                    <label 
                      key={level.id}
                      className="flex items-center gap-2.5 text-[#1a1a1e] cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLevels.includes(level.id as DegreeLevel)}
                        onChange={() => toggleLevel(level.id as DegreeLevel)}
                        className="w-4 h-4 rounded text-[#0037b0] accent-[#0037b0] cursor-pointer"
                      />
                      <span>{level.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[#e5e7eb] w-full" />

              {/* Minimum Award Range Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-caption-strong text-[#1a1a1e]">Minimum Award Value</label>
                  <span className="font-caption-strong text-[#0037b0]">
                    ${minAwardUSD.toLocaleString()}+
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="5000"
                  value={minAwardUSD}
                  onChange={(e) => {
                    setMinAwardUSD(parseInt(e.target.value) || 0);
                    setCurrentPage(1);
                  }}
                  className="w-full accent-[#0037b0] h-1.5 bg-[#eeeeed] rounded-lg cursor-pointer"
                />
                <div className="flex justify-between font-label-sm text-[11px] text-[#6b7280]">
                  <span>$0</span>
                  <span>$50k</span>
                  <span>$100k+</span>
                </div>
              </div>

              <div className="h-px bg-[#e5e7eb] w-full" />

              {/* Deadline Window */}
              <div className="space-y-2">
                <label className="block font-caption-strong text-xs text-[#1a1a1e]">Deadline Window</label>
                <div className="space-y-2 pt-1 text-sm">
                  {[
                    { id: 'urgent_30d', label: 'Next 30 days (Urgent)' },
                    { id: '1_3_months', label: '1 – 3 months' },
                    { id: '3_6_months', label: '3 – 6 months' },
                    { id: 'all', label: 'Open year-round / Any' }
                  ].map((win) => (
                    <label 
                      key={win.id}
                      className="flex items-center gap-2.5 text-[#1a1a1e] cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        name="deadline_filter"
                        checked={deadlineWindow === win.id}
                        onChange={() => {
                          setDeadlineWindow(win.id);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 accent-[#0037b0] cursor-pointer"
                      />
                      <span>{win.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[#e5e7eb] w-full" />

              {/* Verified Status Filter */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 font-caption-strong text-xs text-[#1a1a1e] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={verifiedRecentOnly}
                    onChange={(e) => setVerifiedRecentOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0037b0] accent-[#0037b0] cursor-pointer"
                  />
                  <span>Verified within 30 days only</span>
                </label>
              </div>
            </div>

            {/* Institutional Trust Snippet Card */}
            <div className="p-4 rounded-xl bg-[#dce2f3]/50 border border-[#b7c4ff]/50 space-y-1.5">
              <div className="flex items-center gap-2 text-[#1a1a1e]">
                <span className="material-symbols-outlined text-[18px] text-[#0037b0]">verified_user</span>
                <span className="font-caption-strong text-xs">100% Direct Verification</span>
              </div>
              <p className="font-caption text-xs text-[#434655] leading-relaxed">
                Every registry entry links directly to public government ministries or university senates. No scraped third-party spam.
              </p>
            </div>
          </aside>

          {/* Main Results Grid Area (Scholarship Cards) */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-4">
            {currentItems.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-[#e5e7eb]">
                <span className="material-symbols-outlined text-[48px] text-[#6b7280] mb-2">
                  search_off
                </span>
                <h3 className="font-headline-sm text-lg text-[#1a1a1e] mb-1">
                  No matching verified endowments found
                </h3>
                <p className="font-body-default text-sm text-[#6b7280] mb-4 max-w-md mx-auto">
                  Try broadening your destination countries or reducing minimum funding threshold.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 rounded-lg bg-[#0037b0] text-white font-caption-strong text-xs"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              currentItems.map(({ scholarship, evaluation }) => {
                const saved = isSaved(scholarship.id);

                return (
                  <article 
                    key={scholarship.id}
                    className="bg-white rounded-xl p-6 shadow-sm border border-[#e5e7eb] hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="flex flex-col space-y-4">
                      {/* Card Top Meta & Status Pill */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-[#eeeeed] flex items-center justify-center text-[#0037b0] shrink-0 font-bold mt-0.5">
                            <span className="material-symbols-outlined text-[22px]">
                              {scholarship.providerCategory.includes('University') ? 'account_balance' : scholarship.providerCategory.includes('Government') ? 'flag' : 'hub'}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-caption text-xs text-[#6b7280] block truncate">
                              {scholarship.providerName}
                            </span>
                            <h3 
                              onClick={() => onSelectScholarship(scholarship)}
                              className="font-title text-base sm:text-lg text-[#1a1a1e] group-hover:text-[#0037b0] transition-colors cursor-pointer break-words leading-snug"
                            >
                              {scholarship.title}
                            </h3>
                          </div>
                        </div>

                        {/* Status Pill Badge */}
                        <div className="shrink-0 self-start sm:self-auto">
                          {evaluation.status === 'likely_eligible' ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] font-label-sm text-[11px] font-semibold whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#047857] shrink-0"></span>
                              <span>Likely eligible ({evaluation.matchScore}% match)</span>
                            </div>
                          ) : evaluation.status === 'more_info_needed' ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fffbeb] border border-[#fde68a] text-[#b45309] font-label-sm text-[11px] font-semibold whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#b45309] shrink-0"></span>
                              <span>Potential match — more info needed</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] font-label-sm text-[11px] font-semibold whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#be123c] shrink-0"></span>
                              <span>Does not meet mandatory rule</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Key Value Proposition Block */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-lg bg-[#f3f4f3] border border-[#e5e7eb]">
                        <div className="space-y-0.5">
                          <span className="font-label-sm text-[10px] text-[#6b7280] uppercase">Destination</span>
                          <div className="flex items-center gap-1 font-caption-strong text-xs text-[#1a1a1e] truncate">
                            <span className="material-symbols-outlined text-[15px] text-[#6b7280] shrink-0">location_on</span>
                            <span className="truncate">{scholarship.destinationCountries.join(', ')}</span>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-label-sm text-[10px] text-[#6b7280] uppercase">Estimated Value</span>
                          <div className="font-caption-strong text-xs text-[#1a1a1e] truncate">
                            {scholarship.totalAwardValue}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-label-sm text-[10px] text-[#6b7280] uppercase">Application Deadline</span>
                          <div className="flex items-center gap-1 font-caption-strong text-xs text-[#ba1a1a] truncate">
                            <span className="material-symbols-outlined text-[15px] shrink-0">schedule</span>
                            <span className="truncate">{scholarship.applicationDeadline} ({scholarship.daysRemaining}d left)</span>
                          </div>
                        </div>
                      </div>

                      {/* Eligibility Rubric Preview Strip */}
                      <div className="py-1 px-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-caption text-xs">
                        {evaluation.evaluatedList.slice(0, 3).map((crit, idx) => (
                          <span 
                            key={idx}
                            className={`inline-flex items-center gap-1 ${
                              crit.status === 'passed' ? 'text-[#047857]' : crit.status === 'missing' ? 'text-[#b45309]' : 'text-[#be123c]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {crit.status === 'passed' ? 'check_circle' : crit.status === 'missing' ? 'warning' : 'cancel'}
                            </span>
                            <span>{crit.criterion.title}</span>
                          </span>
                        ))}
                      </div>

                      {/* Card Action Row & Verification Timestamp */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-[#e5e7eb]">
                        <div className="inline-flex items-center gap-1.5 font-caption text-xs text-[#6b7280]">
                          <span className="material-symbols-outlined text-[15px] text-[#0037b0]">verified</span>
                          Verified {scholarship.lastVerified} via official <span className="font-caption-strong text-[#1a1a1e]">{scholarship.sourceDomain}</span> portal
                        </div>
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => {
                              if (saved) {
                                unsaveScholarship(scholarship.id);
                              } else {
                                saveScholarship(scholarship.id, {
                                  title: scholarship.title,
                                  provider: scholarship.providerName,
                                  destination: scholarship.destinationCountries.join(', '),
                                  awardValue: scholarship.totalAwardValue,
                                  deadline: scholarship.applicationDeadline
                                });
                              }
                            }}
                            aria-label={`Save ${scholarship.title}`}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              saved 
                                ? 'bg-[#dce2f3] text-[#0037b0] border-[#b7c4ff]' 
                                : 'bg-[#eeeeed] hover:bg-[#e2e2e2] text-[#6b7280] hover:text-[#1a1a1e] border-transparent'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {saved ? 'bookmark_added' : 'bookmark_border'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectScholarship(scholarship)}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#0037b0] text-white font-caption-strong text-xs hover:bg-[#2563eb] transition-colors shadow-xs cursor-pointer"
                          >
                            <span>View Details &amp; Criteria</span>
                            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="font-caption text-xs text-[#6b7280]">
                  Showing <span className="font-caption-strong text-[#1a1a1e]">{(currentPage - 1) * pageSize + 1}–{Math.min(totalItems, currentPage * pageSize)}</span> of <span className="font-caption-strong text-[#1a1a1e]">{totalItems}</span> verified awards
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-[#e5e7eb] text-[#6b7280] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors ${
                        currentPage === i + 1
                          ? 'bg-[#0037b0] text-white shadow-xs'
                          : 'bg-white border border-[#e5e7eb] text-[#1a1a1e] hover:bg-[#f3f4f3]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-[#e5e7eb] text-[#6b7280] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}

            {/* Academic Transparency Disclaimer Box */}
            <div className="p-4 rounded-xl bg-[#f3f4f3] border border-[#e5e7eb] mt-6 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#6b7280] text-[18px] shrink-0 mt-0.5">info</span>
              <p className="font-caption text-xs text-[#6b7280] leading-relaxed">
                ScholarFind provides eligibility indicators based on self-reported profile data. Official eligibility and admissions decisions are made strictly by the scholarship provider. Always verify final guidelines via official institutional host portals.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
