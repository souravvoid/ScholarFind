import React, { useState } from 'react';
import { HeroGlobe3D } from './HeroGlobe3D';
import { Scholarship, DegreeLevel } from '../types';
import { SCHOLARSHIPS_DATA } from '../data/scholarshipsData';
import { getDeadlineDisplay } from '../services/databaseService';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onOpenProfileBuilder: () => void;
  onSelectScholarship: (scholarship: Scholarship) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenProfileBuilder,
  onSelectScholarship
}) => {
  const [selectedDegree, setSelectedDegree] = useState('masters');
  const [fieldOfStudy, setFieldOfStudy] = useState('Global Health & Tech');
  const [destination, setDestination] = useState('uk');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('explore');
  };

  const featuredScholarships = [
    SCHOLARSHIPS_DATA.find(s => s.id === 'gates-cambridge')!,
    SCHOLARSHIPS_DATA.find(s => s.id === 'daad-helmut-schmidt')!,
    SCHOLARSHIPS_DATA.find(s => s.id === 'knight-hennessy')!,
  ].filter(Boolean);

  return (
    <div className="flex flex-col w-full max-w-full overflow-x-hidden min-w-0">
      {/* Subtle ambient decorative glow strictly contained */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[480px] bg-gradient-to-b from-[#0037b0]/10 via-[#0037b0]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-72 -right-40 w-96 h-96 bg-[#dce2f3]/40 rounded-full blur-3xl pointer-events-none -z-10"></div>

        {/* Hero Section */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 pt-8 pb-16 lg:pt-16 lg:pb-24 w-full min-w-0">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto w-full min-w-0">
            {/* Subtitle Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#eeeeed] shadow-xs mb-6 border border-[#e5e7eb] max-w-full min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#0037b0] animate-pulse shrink-0"></span>
              <span className="font-label-sm text-[10px] sm:text-[11px] text-[#0037b0] uppercase tracking-wider font-semibold truncate">
                Global Scholarship Discovery &amp; Matching Platform
              </span>
            </div>

            {/* Editorial Headline */}
            <h1 className="font-display text-display text-[#1a1a1e] max-w-3xl mb-6 break-words">
              Your future deserves to be funded.
            </h1>

            {/* Supporting Copy */}
            <p className="font-body-lead text-body-lead text-[#6b7280] max-w-2xl mb-8">
              One profile. Opportunities worldwide. A clearer path to apply. Discover curated, verified funding from trusted universities, foundations, and governments worldwide without the guesswork.
            </p>

            {/* Main CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 w-full sm:w-auto min-w-0">
              <button
                onClick={onOpenProfileBuilder}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#1d4ed8] text-white font-body-strong text-sm shadow-md hover:bg-[#2563eb] active:scale-[0.97] transition-all cursor-pointer shrink-0"
              >
                <span>Find My Scholarships</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
              <button
                onClick={() => onNavigate('explore')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#1a1a1e] font-body-strong text-sm shadow-xs border border-[#e5e7eb] hover:bg-[#f3f4f3] active:scale-[0.97] transition-all cursor-pointer shrink-0"
              >
                <span>Explore Opportunities</span>
              </button>
            </div>

            {/* Micro-copy */}
            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 sm:gap-x-6 text-[#6b7280] font-caption text-xs mb-10 w-full min-w-0">
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="material-symbols-outlined text-[#0037b0] text-[16px]">check_circle</span>
                No application fees
              </span>
              <span className="text-[#6b7280]/40 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="material-symbols-outlined text-[#0037b0] text-[16px]">verified</span>
                Unbiased criteria matching
              </span>
              <span className="text-[#6b7280]/40 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="material-symbols-outlined text-[#0037b0] text-[16px]">visibility</span>
                Always transparent
              </span>
            </div>

            {/* 3D Global Hub Constellation Graphic */}
            <div className="w-full max-w-2xl mx-auto -mt-6 mb-4 overflow-hidden min-w-0">
              <HeroGlobe3D />
            </div>

            {/* Unified Search Filter Bar */}
            <div className="w-full bg-white rounded-2xl shadow-xl border border-[#e5e7eb] p-2.5 sm:p-3 max-w-4xl mx-auto backdrop-blur-md min-w-0">
              <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-3 w-full min-w-0">
                {/* Degree Level */}
                <div className="lg:col-span-3 text-left p-3 rounded-xl bg-[#f3f4f3] hover:bg-[#eeeeed] transition-colors w-full min-w-0">
                  <label className="block font-label-sm text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 font-semibold">
                    Degree Level
                  </label>
                  <div className="relative flex items-center w-full min-w-0">
                    <span className="material-symbols-outlined text-[#6b7280] text-[20px] mr-2 shrink-0">school</span>
                    <select
                      value={selectedDegree}
                      onChange={(e) => setSelectedDegree(e.target.value)}
                      className="w-full bg-transparent font-body-strong text-sm text-[#1a1a1e] focus:outline-none cursor-pointer appearance-none pr-4 min-w-0"
                    >
                      <option value="postgraduate">Postgraduate / PhD</option>
                      <option value="masters">Master's Degree</option>
                      <option value="undergraduate">Undergraduate</option>
                      <option value="postdoc">Postdoctoral Fellowship</option>
                    </select>
                    <span className="material-symbols-outlined text-[#6b7280] text-[16px] absolute right-0 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Field of Study */}
                <div className="lg:col-span-4 text-left p-3 rounded-xl bg-[#f3f4f3] hover:bg-[#eeeeed] transition-colors w-full min-w-0">
                  <label className="block font-label-sm text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 font-semibold">
                    Field of Study
                  </label>
                  <div className="flex items-center w-full min-w-0">
                    <span className="material-symbols-outlined text-[#6b7280] text-[20px] mr-2 shrink-0">biotech</span>
                    <input
                      type="text"
                      value={fieldOfStudy}
                      onChange={(e) => setFieldOfStudy(e.target.value)}
                      placeholder="e.g. Computer Science, Public Health"
                      className="w-full bg-transparent font-body-strong text-sm text-[#1a1a1e] focus:outline-none placeholder:text-[#6b7280]/60 min-w-0"
                    />
                  </div>
                </div>

                {/* Destination Country */}
                <div className="lg:col-span-3 text-left p-3 rounded-xl bg-[#f3f4f3] hover:bg-[#eeeeed] transition-colors w-full min-w-0">
                  <label className="block font-label-sm text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 font-semibold">
                    Destination
                  </label>
                  <div className="relative flex items-center w-full min-w-0">
                    <span className="material-symbols-outlined text-[#6b7280] text-[20px] mr-2 shrink-0">public</span>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full bg-transparent font-body-strong text-sm text-[#1a1a1e] focus:outline-none cursor-pointer appearance-none pr-4 min-w-0"
                    >
                      <option value="all">Any Destination</option>
                      <option value="uk">United Kingdom</option>
                      <option value="de">Germany</option>
                      <option value="us">United States</option>
                      <option value="ca">Canada</option>
                      <option value="ch">Switzerland</option>
                    </select>
                    <span className="material-symbols-outlined text-[#6b7280] text-[16px] absolute right-0 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Search Action Button */}
                <div className="lg:col-span-2 flex items-stretch w-full min-w-0">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#1d4ed8] text-white hover:bg-[#2563eb] transition-all flex items-center justify-center gap-2 font-body-strong text-sm py-3 px-4 shadow-sm active:scale-95 cursor-pointer min-w-0"
                  >
                    <span className="material-symbols-outlined text-[20px] shrink-0">search</span>
                    <span>Search</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Live Trust Metric Banner */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 px-4 sm:px-6 py-3 rounded-full bg-white/80 border border-[#e5e7eb] shadow-xs backdrop-blur-md max-w-full min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-body-strong text-sm text-[#1a1a1e]">12,400+</span>
                <span className="font-caption text-xs text-[#6b7280]">Verified Opportunities</span>
              </div>
              <span className="hidden sm:inline text-[#e5e7eb]">•</span>
              <div className="flex items-center gap-2">
                <span className="font-body-strong text-sm text-[#1a1a1e]">$180M+</span>
                <span className="font-caption text-xs text-[#6b7280]">Advertised Funding</span>
              </div>
              <span className="hidden sm:inline text-[#e5e7eb]">•</span>
              <div className="flex items-center gap-2">
                <span className="font-body-strong text-sm text-[#1a1a1e]">85+</span>
                <span className="font-caption text-xs text-[#6b7280]">Destination Countries</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Featured Opportunity Showcase with Editorial Imagery */}
      <section className="w-full bg-[#f3f4f3] py-16 sm:py-20 border-y border-[#e5e7eb] min-w-0">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 w-full min-w-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4 w-full min-w-0">
            <div className="min-w-0 flex-1">
              <span className="font-label-sm text-[11px] text-[#0037b0] uppercase tracking-wider block mb-2 font-semibold">
                Exemplary Registry
              </span>
              <h2 className="font-headline-lg text-[#1a1a1e] break-words">
                Active Verified Endowments
              </h2>
            </div>
            <button
              onClick={() => onNavigate('explore')}
              className="inline-flex items-center gap-1.5 font-body-strong text-sm text-[#0037b0] hover:text-[#2563eb] transition-colors cursor-pointer shrink-0"
            >
              <span>Browse all 12,400+ listings</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          {/* Grid of 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full min-w-0">
            {featuredScholarships.map((sch) => {
              let badgeText = 'Likely eligible (based on sample profile)';
              let badgeBg = 'bg-[#ecfdf5] border-[#a7f3d0] text-[#047857]';
              let criteriaText = '4 of 4 Met';
              let criteriaIcon = 'check_circle';

              if (sch.id === 'daad-helmut-schmidt') {
                badgeText = 'Potential match — 1 info needed';
                badgeBg = 'bg-[#fffbeb] border-[#fde68a] text-[#b45309]';
                criteriaText = 'Confirm Bachelor field';
                criteriaIcon = 'help';
              } else if (sch.id === 'knight-hennessy') {
                const deadlineInfo = getDeadlineDisplay(sch.applicationDeadline);
                badgeText = deadlineInfo.isClosed ? 'Cycle closed' : 'Review required — upcoming deadline';
                badgeBg = `${deadlineInfo.badgeClass} border-[#e2e2e2]`;
                criteriaText = deadlineInfo.isClosed ? 'Cycle closed' : `${deadlineInfo.daysRemaining} days left`;
                criteriaIcon = 'schedule';
              }

              return (
                <div
                  key={sch.id}
                  onClick={() => onSelectScholarship(sch)}
                  className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer w-full min-w-0"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-[#eeeeed] min-w-0">
                    <img
                      src={sch.heroImage}
                      alt={sch.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
                    <div className={`absolute top-3 sm:top-4 left-3 sm:left-4 max-w-[calc(100%-1.5rem)] sm:max-w-[calc(100%-2rem)] inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border font-label-sm text-[10px] sm:text-[11px] shadow-sm backdrop-blur-sm truncate ${badgeBg}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                      <span className="truncate">{badgeText}</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 flex-1 flex flex-col min-w-0">
                    <div className="flex items-center justify-between text-[#6b7280] font-caption text-xs mb-2 w-full min-w-0 gap-2">
                      <span className="font-medium text-[#1a1a1e] truncate">{sch.providerName}</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span>{sch.destinationCountries.join(', ')}</span>
                      </span>
                    </div>

                    <h3 className="font-title text-base sm:text-lg text-[#1a1a1e] mb-3 group-hover:text-[#0037b0] transition-colors break-words">
                      {sch.title}
                    </h3>

                    {/* Funding Callout */}
                    <div className="p-3.5 rounded-xl bg-[#f3f4f3] border border-[#e5e7eb] mb-5 w-full min-w-0">
                      <span className="block font-caption text-[11px] text-[#6b7280] mb-0.5 truncate">Total Award Value</span>
                      <span className="font-headline-sm text-[19px] text-[#1a1a1e] block font-semibold truncate">
                        {sch.totalAwardValue}
                      </span>
                      <span className="block font-caption text-xs text-[#6b7280] mt-1 break-words">
                        {sch.awardDetails}
                      </span>
                    </div>

                    {/* Criteria snapshot */}
                    <div className="space-y-2 mb-6 w-full min-w-0">
                      <div className="flex items-center justify-between font-caption text-xs w-full min-w-0 gap-2">
                        <span className="text-[#6b7280] shrink-0">Degree Level</span>
                        <span className="font-medium text-[#1a1a1e] capitalize truncate">{sch.studyLevels.join(' / ')}</span>
                      </div>
                      <div className="flex items-center justify-between font-caption text-xs w-full min-w-0 gap-2">
                        <span className="text-[#6b7280] shrink-0">Criteria Match</span>
                        <span className={`font-semibold flex items-center gap-1 shrink-0 ${
                          criteriaIcon === 'check_circle' ? 'text-[#047857]' : criteriaIcon === 'help' ? 'text-[#b45309]' : 'text-[#1a1a1e]'
                        }`}>
                          <span className="material-symbols-outlined text-[15px] shrink-0">{criteriaIcon}</span>
                          <span className="truncate">{criteriaText}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-caption text-xs w-full min-w-0 gap-2">
                        <span className="text-[#6b7280] shrink-0">Last Verified</span>
                        <span className="text-[#6b7280] truncate">{sch.lastVerified}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#e5e7eb] w-full min-w-0">
                      <span className="font-caption text-xs text-[#6b7280] truncate pr-2">{sch.providerCategory}</span>
                      <button className="inline-flex items-center gap-1 font-body-strong text-xs text-[#0037b0] group-hover:text-[#2563eb] shrink-0">
                        <span>View Rubric</span>
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Three Concise Steps ('How ScholarFind Works') */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-16 sm:py-24 w-full min-w-0">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 w-full min-w-0">
          <span className="font-label-sm text-[11px] text-[#0037b0] uppercase tracking-wider block mb-2 font-semibold">
            Process &amp; Methodology
          </span>
          <h2 className="font-headline-lg text-[#1a1a1e] mb-4 break-words">How ScholarFind Works</h2>
          <p className="font-body-lead text-[#6b7280]">
            We replaced speculative matching algorithms with radical transparency and deterministic eligibility criteria.
          </p>
        </div>

        {/* 3-Column Bento Step Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative w-full min-w-0">
          {/* Step 01 */}
          <div className="p-8 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute -top-6 -right-6 font-display text-[96px] text-[#eeeeed] font-bold select-none pointer-events-none group-hover:text-[#0037b0]/10 transition-colors">
              01
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#dce2f3] flex items-center justify-center text-[#0037b0] mb-6">
                <span className="material-symbols-outlined text-[26px]">badge</span>
              </div>
              <span className="font-label-sm text-[11px] text-[#0037b0] uppercase tracking-wider block mb-2 font-semibold">
                Step 01
              </span>
              <h3 className="font-headline-sm text-lg text-[#1a1a1e] mb-3">Build your universal profile</h3>
              <p className="font-body-default text-sm text-[#6b7280] leading-relaxed">
                Enter your academic background, citizenship, degree ambitions, and study goals once in our private, end-to-end encrypted student system.
              </p>
            </div>
            <div className="mt-8 pt-6 bg-[#f3f4f3] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#047857]">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                </div>
                <span className="font-caption text-xs text-[#1a1a1e]">100% Student data privacy guaranteed</span>
              </div>
            </div>
          </div>

          {/* Step 02 */}
          <div className="p-8 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute -top-6 -right-6 font-display text-[96px] text-[#eeeeed] font-bold select-none pointer-events-none group-hover:text-[#0037b0]/10 transition-colors">
              02
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#dce2f3] flex items-center justify-center text-[#0037b0] mb-6">
                <span className="material-symbols-outlined text-[26px]">rule</span>
              </div>
              <span className="font-label-sm text-[11px] text-[#0037b0] uppercase tracking-wider block mb-2 font-semibold">
                Step 02
              </span>
              <h3 className="font-headline-sm text-lg text-[#1a1a1e] mb-3">Discover transparent matches</h3>
              <p className="font-body-default text-sm text-[#6b7280] leading-relaxed">
                See the exact criteria breakdown. We show you what you meet, what is missing, and what needs clarification. No ambiguous or fabricated percentage scores.
              </p>
            </div>
            <div className="mt-8 pt-6 bg-[#f3f4f3] rounded-xl p-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-caption">
                  <span className="text-[#6b7280]">GPA Requirement: 3.7+</span>
                  <span className="text-[#047857] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">check</span> Met
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-caption">
                  <span className="text-[#6b7280]">Citizenship Restriction</span>
                  <span className="text-[#047857] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">check</span> Eligible
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 03 */}
          <div className="p-8 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute -top-6 -right-6 font-display text-[96px] text-[#eeeeed] font-bold select-none pointer-events-none group-hover:text-[#0037b0]/10 transition-colors">
              03
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#dce2f3] flex items-center justify-center text-[#0037b0] mb-6">
                <span className="material-symbols-outlined text-[26px]">open_in_new</span>
              </div>
              <span className="font-label-sm text-[11px] text-[#0037b0] uppercase tracking-wider block mb-2 font-semibold">
                Step 03
              </span>
              <h3 className="font-headline-sm text-lg text-[#1a1a1e] mb-3">Apply directly with the provider</h3>
              <p className="font-body-default text-sm text-[#6b7280] leading-relaxed">
                Direct, verified links to official universities and government application portals, complete with step-by-step guidance on essay prompts and documentation.
              </p>
            </div>
            <div className="mt-8 pt-6 bg-[#f3f4f3] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0037b0]/10 flex items-center justify-center text-[#0037b0]">
                  <span className="material-symbols-outlined text-[16px]">link</span>
                </div>
                <span className="font-caption text-xs text-[#1a1a1e]">Direct destination links only</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Source Transparency & Trust Principles Section */}
      <section className="w-full bg-white py-16 sm:py-20 border-t border-[#e5e7eb] min-w-0">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 w-full min-w-0">
          <div className="max-w-3xl mb-10 sm:mb-12 w-full min-w-0">
            <span className="font-label-sm text-[11px] text-[#0037b0] uppercase tracking-wider block mb-2 font-semibold">
              Institutional Integrity
            </span>
            <h2 className="font-headline-lg text-[#1a1a1e] mb-4 break-words">
              Built on audited, authoritative sources.
            </h2>
            <p className="font-body-lead text-[#6b7280]">
              Scholarship discovery is plagued by expired links, commercial lead generators, and false promises. ScholarFind operates under strict academic audit principles.
            </p>
          </div>

          {/* Principles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-12 w-full min-w-0">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#f3f4f3] border border-[#e5e7eb] flex gap-4 sm:gap-5 items-start w-full min-w-0">
              <div className="p-3 rounded-xl bg-white text-[#0037b0] shadow-xs flex-shrink-0">
                <span className="material-symbols-outlined text-[26px] sm:text-[28px]">verified_user</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-headline-sm text-lg text-[#1a1a1e] mb-2 break-words">Direct Official Sources</h3>
                <p className="font-body-default text-sm text-[#6b7280] leading-relaxed">
                  We crawl and manually audit official government ministries, accredited university trust offices, and vetted philanthropic endowments. Every listing links back to its verified origin domain.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#f3f4f3] border border-[#e5e7eb] flex gap-4 sm:gap-5 items-start w-full min-w-0">
              <div className="p-3 rounded-xl bg-white text-[#0037b0] shadow-xs flex-shrink-0">
                <span className="material-symbols-outlined text-[26px] sm:text-[28px]">savings</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-headline-sm text-lg text-[#1a1a1e] mb-2 break-words">Zero Pay-to-Apply Guarantee</h3>
                <p className="font-body-default text-sm text-[#6b7280] leading-relaxed">
                  ScholarFind never charges students to discover or apply for opportunities. We prohibit sponsored rankings and refuse commercial lead-aggregation arrangements.
                </p>
              </div>
            </div>
          </div>

          {/* Upfront Disclaimer Card */}
          <div className="rounded-2xl p-5 sm:p-8 bg-[#eeeeed] border border-[#e5e7eb] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6 w-full min-w-0">
            <div className="flex items-start gap-3 sm:gap-4 max-w-3xl min-w-0 flex-1">
              <span className="material-symbols-outlined text-[#0037b0] text-[24px] sm:text-[28px] mt-0.5 shrink-0">info</span>
              <div className="min-w-0 flex-1">
                <h4 className="font-body-strong text-sm text-[#1a1a1e] mb-1">
                  Notice &amp; Disclaimer Upfront
                </h4>
                <p className="font-body-default text-xs text-[#6b7280] leading-relaxed">
                  ScholarFind provides automated discovery and criteria mapping solely for informational guidance. We are an independent educational indexing service; we do not grant admissions, adjudicate funding decisions, or guarantee award approvals. Official applications must be completed directly with granting institutions.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('sources')}
              className="flex-shrink-0 px-5 py-2.5 rounded-full bg-white font-body-strong text-xs text-[#1a1a1e] hover:bg-[#e8e8e7] transition-colors shadow-xs border border-[#e5e7eb] cursor-pointer"
            >
              Audit Protocol
            </button>
          </div>
        </div>
      </section>

      {/* Pre-footer Call-to-action Banner */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-16 sm:py-20 lg:py-24 w-full min-w-0">
        <div className="relative rounded-3xl bg-[#1a1a1e] text-white p-6 sm:p-14 lg:p-20 overflow-hidden shadow-2xl w-full min-w-0">
          <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-[#1d4ed8]/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-0 right-1/3 w-64 h-64 bg-[#585f6c]/30 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl min-w-0">
            <span className="font-label-sm text-[11px] text-[#cad3ff] uppercase tracking-wider block mb-3 font-semibold">
              Begin Your Search
            </span>
            <h2 className="font-headline-lg text-white mb-6 break-words">
              Ready to find your educational path?
            </h2>
            <p className="font-body-lead text-white/80 mb-8 sm:mb-10 leading-relaxed text-sm sm:text-base">
              Create your free student profile in under five minutes. Unlock instant, verified scholarship alignments across 85+ countries.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto min-w-0">
              <button
                onClick={onOpenProfileBuilder}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-full bg-white text-[#1a1a1e] font-body-strong text-sm shadow-lg hover:bg-[#eeeeed] transition-all active:scale-[0.98] cursor-pointer shrink-0"
              >
                <span>Create Free Student Profile</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
              <span className="font-caption text-xs text-white/60 px-2 text-center sm:text-left">
                No credit card or payment required.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
