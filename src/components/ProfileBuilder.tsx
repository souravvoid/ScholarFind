import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DegreeLevel, GradingScale } from '../types';
import { normalizeGpa, getEquivalentDegreeLabel } from '../utils/eligibilityEngine';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ProfileBuilderProps {
  onClose: () => void;
  onFinished: () => void;
}

export const ProfileBuilder: React.FC<ProfileBuilderProps> = ({ onClose, onFinished }) => {
  const { profile, updateProfile } = useAuth();
  const [step, setStep] = useState<number>(1); // Start on step 1
  const panelRef = useFocusTrap<HTMLDivElement>(true, onClose);

  // Form states initialized from profile
  const [citizenship, setCitizenship] = useState(profile?.citizenship || 'Nigeria');
  const [residenceCountry, setResidenceCountry] = useState(profile?.residenceCountry || 'Nigeria');
  const [educationLevel, setEducationLevel] = useState<DegreeLevel>(profile?.educationLevel || 'bachelors');
  const [institution, setInstitution] = useState(profile?.institution || 'University of Ibadan (Nigeria)');
  const [gradingScale, setGradingScale] = useState<GradingScale>(profile?.gradingScale || 'gpa_4_0');
  const [gpa, setGpa] = useState<number>(profile?.gpa || 3.82);
  const [maxGpa, setMaxGpa] = useState<number>(profile?.maxGpa || 4.0);
  const [graduationYear, setGraduationYear] = useState(profile?.graduationYear || '2026 (Expected)');
  
  const [primaryField, setPrimaryField] = useState(profile?.primaryField || 'Computer Science & Artificial Intelligence (STEM)');
  const [facultyTags, setFacultyTags] = useState<string[]>(profile?.facultyTags || ['Computer Science', 'Machine Learning', 'STEM']);
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  const [researchKeywords, setResearchKeywords] = useState<string[]>(
    profile?.researchKeywords || ['Machine Learning', 'Natural Language Processing', 'Data Ethics & Algorithmic Fairness']
  );
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [showAddKeyword, setShowAddKeyword] = useState(false);

  const [targetDegrees, setTargetDegrees] = useState<DegreeLevel[]>(profile?.targetDegrees || ['masters', 'phd']);
  const [targetRegions, setTargetRegions] = useState<string[]>(
    profile?.targetRegions || ['Western & Northern Europe', 'North America']
  );
  const [targetCountries, setTargetCountries] = useState<string[]>(
    profile?.targetCountries || ['United Kingdom', 'Germany', 'Canada', 'United States', 'Netherlands']
  );
  const [deliveryModality, setDeliveryModality] = useState<'on_campus' | 'hybrid' | 'online'>(
    profile?.deliveryModality || 'on_campus'
  );
  const [intendedStartTerm, setIntendedStartTerm] = useState(profile?.intendedStartTerm || 'Fall 2026');

  const [workExperienceYears, setWorkExperienceYears] = useState<number>(profile?.workExperienceYears ?? 2);
  const [hasEnglishMediumInstruction, setHasEnglishMediumInstruction] = useState<boolean>(
    profile?.hasEnglishMediumInstruction ?? true
  );
  const [englishTestType, setEnglishTestType] = useState<'ielts' | 'toefl' | 'duolingo' | 'none'>(
    profile?.englishTestType || 'none'
  );
  const [englishScore, setEnglishScore] = useState(profile?.englishScore || '');

  const normalizedGpaScore = normalizeGpa(gpa, gradingScale, maxGpa);
  const equivalencyLabel = getEquivalentDegreeLabel(normalizedGpaScore);

  const handleSaveCurrentState = async () => {
    await updateProfile({
      citizenship,
      residenceCountry,
      educationLevel,
      institution,
      gradingScale,
      gpa,
      maxGpa,
      graduationYear,
      primaryField,
      facultyTags,
      researchKeywords,
      targetDegrees,
      targetRegions,
      targetCountries,
      deliveryModality,
      intendedStartTerm,
      workExperienceYears,
      hasEnglishMediumInstruction,
      englishTestType,
      englishScore
    });
  };

  const handleNext = async () => {
    await handleSaveCurrentState();
    if (step < 4) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onFinished();
    }
  };

  const handlePrev = async () => {
    await handleSaveCurrentState();
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onClose();
    }
  };

  const toggleTargetDegree = (deg: DegreeLevel) => {
    setTargetDegrees(prev => 
      prev.includes(deg) ? prev.filter(d => d !== deg) : [...prev, deg]
    );
  };

  const toggleTargetRegion = (reg: string) => {
    setTargetRegions(prev => 
      prev.includes(reg) ? prev.filter(r => r !== reg) : [...prev, reg]
    );
  };

  const removeCountry = (c: string) => {
    setTargetCountries(prev => prev.filter(item => item !== c));
  };

  const addCountry = (c: string) => {
    if (!targetCountries.includes(c)) {
      setTargetCountries(prev => [...prev, c]);
    }
  };

  const removeFacultyTag = (tag: string) => {
    setFacultyTags(prev => prev.filter(t => t !== tag));
  };

  const addFacultyTag = () => {
    if (newTagInput.trim() && !facultyTags.includes(newTagInput.trim())) {
      setFacultyTags(prev => [...prev, newTagInput.trim()]);
      setNewTagInput('');
      setShowAddTag(false);
    }
  };

  const removeKeyword = (kw: string) => {
    setResearchKeywords(prev => prev.filter(k => k !== kw));
  };

  const addKeyword = () => {
    if (newKeywordInput.trim() && !researchKeywords.includes(newKeywordInput.trim())) {
      setResearchKeywords(prev => [...prev, newKeywordInput.trim()]);
      setNewKeywordInput('');
      setShowAddKeyword(false);
    }
  };

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Student Profile Builder"
      className="fixed inset-0 z-40 bg-[#fbfbfa] overflow-y-auto outline-none"
    >
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fbfbfa]/95 backdrop-blur-md border-b border-[#e5e7eb] w-full max-w-full">
        <div className="h-14 max-w-[840px] w-full mx-auto px-4 md:px-0 flex items-center justify-between min-w-0">
          <button
            onClick={handlePrev}
            className="inline-flex items-center gap-1 font-caption text-xs text-ink-muted hover:text-[#1a1a1e] transition-colors cursor-pointer shrink-0"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>
          <span className="font-title text-base text-[#1a1a1e] font-semibold truncate px-2">ScholarFind</span>
          <button
            onClick={onClose}
            className="font-caption-strong text-xs text-ink-muted hover:text-[#1a1a1e] transition-colors cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-full pt-16 pb-24 px-4 min-h-screen flex flex-col items-center min-w-0">
        <div className="w-full max-w-[840px] mx-auto pt-6 min-w-0">
          {/* Breadcrumb meta badge & stage counter */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 w-full min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#dce2f3]/50 text-[#233f8f] font-label-sm text-[11px] tracking-wider uppercase font-semibold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8] animate-pulse"></span>
                Step {step} of 4
              </span>
              <span className="font-caption text-xs text-ink-muted hidden sm:inline">•</span>
              <span className="font-caption text-xs text-ink-muted truncate">
                {step === 1 && 'Identity & Citizenship'}
                {step === 2 && 'Academic Foundation & Global Intent'}
                {step === 3 && 'Language Proficiency & Work Experience'}
                {step === 4 && 'Credential Review & Match Unlock'}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] font-caption-strong text-xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#047857]"></span>
              <span>{step * 25}% Complete — Matches Verified Catalogue</span>
            </div>
          </div>

          {/* 4-Step Visual Progress Bar */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-6 sm:mb-8 w-full min-w-0">
            <div className="flex flex-col gap-1 sm:gap-1.5 min-w-0">
              <div className={`h-1.5 w-full rounded-full ${step >= 1 ? 'bg-[#047857]' : 'bg-[#e2e2e2]'}`} />
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className="font-caption-strong text-[#1a1a1e] truncate">
                  <span className="sm:hidden">1. ID</span>
                  <span className="hidden sm:inline">1. Identity</span>
                </span>
                <span className="font-label-sm text-[#047857] uppercase text-[10px] hidden sm:inline">{step > 1 ? 'Done' : 'Active'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:gap-1.5 min-w-0">
              <div className={`h-1.5 w-full rounded-full ${step >= 2 ? (step > 2 ? 'bg-[#047857]' : 'bg-[#1d4ed8]') : 'bg-[#e2e2e2]'}`} />
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className={`font-caption-strong truncate ${step === 2 ? 'text-[#1d4ed8]' : 'text-[#1a1a1e]'}`}>
                  <span className="sm:hidden">2. Acad</span>
                  <span className="hidden sm:inline">2. Academics</span>
                </span>
                <span className="font-label-sm uppercase text-ink-muted text-[10px] hidden sm:inline">{step > 2 ? 'Done' : step === 2 ? 'Active' : 'Next'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:gap-1.5 min-w-0">
              <div className={`h-1.5 w-full rounded-full ${step >= 3 ? (step > 3 ? 'bg-[#047857]' : 'bg-[#1d4ed8]') : 'bg-[#e2e2e2]'}`} />
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className={`font-caption-strong truncate ${step === 3 ? 'text-[#1d4ed8]' : 'text-ink-muted'}`}>
                  <span className="sm:hidden">3. Tests</span>
                  <span className="hidden sm:inline">3. Language &amp; Tests</span>
                </span>
                <span className="font-label-sm uppercase text-ink-muted text-[10px] hidden sm:inline">{step > 3 ? 'Done' : step === 3 ? 'Active' : 'Next'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:gap-1.5 min-w-0">
              <div className={`h-1.5 w-full rounded-full ${step >= 4 ? 'bg-[#1d4ed8]' : 'bg-[#e2e2e2]'}`} />
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className={`font-caption-strong truncate ${step === 4 ? 'text-[#1d4ed8]' : 'text-ink-muted'}`}>
                  <span className="sm:hidden">4. Review</span>
                  <span className="hidden sm:inline">4. Review</span>
                </span>
                <span className="font-label-sm uppercase text-ink-muted text-[10px] hidden sm:inline">{step === 4 ? 'Active' : 'Locked'}</span>
              </div>
            </div>
          </div>

          {/* STEP 1: IDENTITY & CITIZENSHIP */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-left mb-6">
                <h1 className="font-headline-lg text-[#1a1a1e] tracking-tight mb-2">
                  Identity &amp; Citizenship
                </h1>
                <p className="font-body-lead text-ink-muted">
                  Scholarships have strict nationality and bilateral pact requirements. We never sell or share your data.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-[#e5e7eb] space-y-6">
                <div>
                  <label htmlFor="profile-citizenship" className="block font-caption-strong text-sm text-[#1a1a1e] mb-1.5">
                    Primary Citizenship / Passport Origin <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <select
                    id="profile-citizenship"
                    value={citizenship}
                    onChange={(e) => setCitizenship(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg bg-[#f3f4f3] border border-[#e5e7eb] text-sm text-[#1a1a1e] focus:bg-white focus:outline-none focus-visible:ring-2 focus:ring-[#1d4ed8]"
                  >
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                    <option value="India">India</option>
                    <option value="Pakistan">Pakistan</option>
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Egypt">Egypt</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Germany">Germany</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                  </select>
                  <p className="font-caption text-xs text-ink-muted mt-1.5">
                    Evaluated against bilateral government treaties (e.g. Commonwealth, DAAD, Fulbright quotas).
                  </p>
                </div>

                <div>
                  <label htmlFor="profile-residence-country" className="block font-caption-strong text-sm text-[#1a1a1e] mb-1.5">
                    Country of Current Legal Residence <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    id="profile-residence-country"
                    type="text"
                    value={residenceCountry}
                    onChange={(e) => setResidenceCountry(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg bg-[#f3f4f3] border border-[#e5e7eb] text-sm text-[#1a1a1e] focus:bg-white focus:outline-none focus-visible:ring-2 focus:ring-[#1d4ed8]"
                    placeholder="e.g. Nigeria, United Kingdom, etc."
                  />
                  <p className="font-caption text-xs text-ink-muted mt-1.5">
                    Certain regional mobility grants require residency within specific territories for at least 12 months.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ACADEMIC FOUNDATION (Matching Stitch Image 8 & 6) */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-left mb-6">
                <h1 className="font-headline-lg text-[#1a1a1e] tracking-tight mb-2">
                  Your Academic Background &amp; Ambition
                </h1>
                <p className="font-body-lead text-ink-muted">
                  Enter your verified GPA scale, primary field, and destination preferences to calculate strict institutional eligibility without guesswork.
                </p>
              </div>

              {/* CARD A: Academic Background & GPA */}
              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-[#e5e7eb]">
                <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#e5e7eb]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#dce2f3]/60 text-[#1d4ed8] flex items-center justify-center font-semibold">
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">school</span>
                    </div>
                    <div>
                      <h2 className="font-title text-base text-[#1a1a1e]">
                        1. Academic Background &amp; GPA Standardization
                      </h2>
                      <p className="font-caption text-xs text-ink-muted">
                        Official institutional records for international credential evaluation
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#eeeeed] text-ink-muted font-label-sm text-[11px]">
                    Section Required
                  </span>
                </div>

                {/* Subfield: Education Level */}
                <div className="mb-6">
                  <label className="block font-caption-strong text-xs text-[#1a1a1e] mb-2.5">
                    Current or Highest Completed Education Level
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEducationLevel('secondary')}
                      className={`flex flex-col p-3.5 text-left rounded-lg transition-all cursor-pointer ${
                        educationLevel === 'secondary'
                          ? 'bg-[#dce2f3]/40 ring-2 ring-[#1d4ed8] text-[#1d4ed8]'
                          : 'bg-[#f3f4f3] hover:bg-[#eeeeed] text-[#1a1a1e]'
                      }`}
                    >
                      <span className="font-caption-strong text-xs">Secondary / High School</span>
                      <span className="font-caption text-xs text-ink-muted">IB, A-Levels, WAEC, Bac</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEducationLevel('bachelors')}
                      className={`flex flex-col p-3.5 text-left rounded-lg transition-all cursor-pointer ${
                        educationLevel === 'bachelors'
                          ? 'bg-[#dce2f3]/40 ring-2 ring-[#1d4ed8] text-[#1d4ed8]'
                          : 'bg-[#f3f4f3] hover:bg-[#eeeeed] text-[#1a1a1e]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-caption-strong text-xs">Bachelor's / Undergrad</span>
                        {educationLevel === 'bachelors' && (
                          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[#1d4ed8]">check_circle</span>
                        )}
                      </div>
                      <span className="font-caption text-xs text-ink-muted">BSc, BA, BEng, BTech, LL.B</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEducationLevel('masters')}
                      className={`flex flex-col p-3.5 text-left rounded-lg transition-all cursor-pointer ${
                        educationLevel === 'masters'
                          ? 'bg-[#dce2f3]/40 ring-2 ring-[#1d4ed8] text-[#1d4ed8]'
                          : 'bg-[#f3f4f3] hover:bg-[#eeeeed] text-[#1a1a1e]'
                      }`}
                    >
                      <span className="font-caption-strong text-xs">Master's / Postgraduate</span>
                      <span className="font-caption text-xs text-ink-muted">MSc, MA, MBA, MRes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEducationLevel('phd')}
                      className={`flex flex-col p-3.5 text-left rounded-lg transition-all cursor-pointer ${
                        educationLevel === 'phd'
                          ? 'bg-[#dce2f3]/40 ring-2 ring-[#1d4ed8] text-[#1d4ed8]'
                          : 'bg-[#f3f4f3] hover:bg-[#eeeeed] text-[#1a1a1e]'
                      }`}
                    >
                      <span className="font-caption-strong text-xs">Doctorate / PhD</span>
                      <span className="font-caption text-xs text-ink-muted">Ph.D, DPhil, Postgrad Fellow</span>
                    </button>
                  </div>
                </div>

                {/* Subfield: Institution Name */}
                <div className="mb-6">
                  <label className="block font-caption-strong text-xs text-[#1a1a1e] mb-1.5">
                    Awarding Institution / Current University
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">account_balance</span>
                    </span>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full h-11 pl-10 pr-24 rounded-lg bg-[#f3f4f3] text-[#1a1a1e] text-sm focus:bg-white focus:outline-none focus-visible:ring-2 focus:ring-[#1d4ed8] transition-all"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5 pointer-events-none">
                    </div>
                  </div>
                  <p className="font-caption text-xs text-ink-muted mt-1.5">
                    Verified against the UNESCO / IAU World Higher Education Database registry.
                  </p>
                </div>

                {/* Grading System & GPA */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-5">
                  <div className="md:col-span-5">
                    <label className="block font-caption-strong text-xs text-[#1a1a1e] mb-1.5">
                      Institutional Grading Scale
                    </label>
                    <select
                      value={gradingScale}
                      onChange={(e) => setGradingScale(e.target.value as GradingScale)}
                      className="w-full h-11 px-3.5 rounded-lg bg-[#f3f4f3] text-[#1a1a1e] text-sm focus:bg-white focus:outline-none focus-visible:ring-2 focus:ring-[#1d4ed8]"
                    >
                      <option value="gpa_4_0">4.0 Scale (US / International Standard)</option>
                      <option value="gpa_5_0">5.0 Scale (Nigeria / Singapore / Eastern Europe)</option>
                      <option value="uk_honours">UK Honours Classification (First, 2:1, 2:2)</option>
                      <option value="percentage">Percentage (0 - 100% Weighted Average)</option>
                      <option value="ects">ECTS Grading System (A, B, C, D, E)</option>
                      <option value="german">German Grading Scale (1.0 Sehr Gut - 4.0 Ausreichend)</option>
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block font-caption-strong text-xs text-[#1a1a1e] mb-1.5">
                      Cumulative Transcript GPA
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={gpa}
                        onChange={(e) => setGpa(parseFloat(e.target.value) || 0)}
                        className="w-full h-11 pl-3.5 pr-16 rounded-lg bg-[#f3f4f3] text-[#1a1a1e] text-lg font-semibold focus:bg-white focus:outline-none focus-visible:ring-2 focus:ring-[#1d4ed8]"
                      />
                      <span className="absolute right-3 font-caption-strong text-xs text-ink-muted">
                        / {gradingScale === 'gpa_5_0' ? '5.00' : gradingScale === 'percentage' ? '100' : '4.00'}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-caption-strong text-xs text-[#1a1a1e] mb-1.5">
                      Graduation Year
                    </label>
                    <select
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-lg bg-[#f3f4f3] text-[#1a1a1e] text-sm focus:bg-white focus:outline-none focus-visible:ring-2 focus:ring-[#1d4ed8]"
                    >
                      <option value="2024 or earlier">2024 or earlier</option>
                      <option value="2025">2025</option>
                      <option value="2026 (Expected)">2026 (Expected)</option>
                      <option value="2027">2027</option>
                      <option value="2028+">2028+</option>
                    </select>
                  </div>
                </div>

                {/* Academic Conversion Callout Banner */}
                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#f3f4f3] border border-[#e5e7eb] text-[#1a1a1e]">
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[#1d4ed8] mt-0.5 shrink-0">info</span>
                  <div className="font-caption text-xs leading-relaxed">
                    <span className="font-caption-strong text-[#1a1a1e]">Equivalency Standardization: </span>
                    ScholarFind standardizes your {gpa} GPA internally using official WES, UK-ENIC, and DAAD equivalence rubrics ({equivalencyLabel}).
                  </div>
                </div>
              </div>

              {/* CARD B: Field of Study & Specialization */}
              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-[#e5e7eb]">
                <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#e5e7eb]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#dce2f3]/60 text-[#1d4ed8] flex items-center justify-center font-semibold">
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">psychology</span>
                    </div>
                    <div>
                      <h2 className="font-title text-base text-[#1a1a1e]">
                        2. Field of Study &amp; Degree Specialization
                      </h2>
                      <p className="font-caption text-xs text-ink-muted">
                        Align disciplinary nomenclature across EU, US, and Commonwealth frameworks
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] font-label-sm text-[11px]">
                    High Grant Match Area
                  </span>
                </div>

                {/* Primary Field */}
                <div className="mb-5">
                  <label className="block font-caption-strong text-xs text-[#1a1a1e] mb-1.5">
                    Primary Academic Field / Major
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">hub</span>
                    </span>
                    <input
                      type="text"
                      value={primaryField}
                      onChange={(e) => setPrimaryField(e.target.value)}
                      className="w-full h-11 pl-10 pr-10 rounded-lg bg-[#f3f4f3] text-[#1a1a1e] text-sm focus:bg-white focus:outline-none focus-visible:ring-2 focus:ring-[#1d4ed8]"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-ink-muted">
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">search</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 font-caption text-xs text-ink-muted">
                    <span>Popular taxonomies:</span>
                    <button 
                      type="button" 
                      onClick={() => setPrimaryField('Biomedical Engineering')} 
                      className="text-[#1d4ed8] hover:underline"
                    >
                      Biomedical Engineering
                    </button> • 
                    <button 
                      type="button" 
                      onClick={() => setPrimaryField('Public Policy & Economics')} 
                      className="text-[#1d4ed8] hover:underline"
                    >
                      Public Policy &amp; Economics
                    </button> • 
                    <button 
                      type="button" 
                      onClick={() => setPrimaryField('Computer Science & Artificial Intelligence (STEM)')} 
                      className="text-[#1d4ed8] hover:underline"
                    >
                      Data Science &amp; AI
                    </button>
                  </div>
                </div>

                {/* Faculty Tags */}
                <div className="mb-6">
                  <label className="block font-caption-strong text-xs text-[#1a1a1e] mb-2">
                    Associated Faculty Tags
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {facultyTags.map((tag) => (
                      <span 
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eeeeed] font-caption-strong text-xs text-[#1a1a1e]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]"></span>
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeFacultyTag(tag)}
                          className="text-ink-muted hover:text-[#1a1a1e] ml-0.5"
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    ))}
                    {showAddTag ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          placeholder="e.g. Bioethics"
                          className="h-8 px-2.5 rounded-lg border border-[#e5e7eb] text-xs focus:outline-none focus-visible:ring-1 focus:ring-[#1d4ed8]"
                          onKeyDown={(e) => e.key === 'Enter' && addFacultyTag()}
                        />
                        <button
                          type="button"
                          onClick={addFacultyTag}
                          className="px-2.5 py-1 rounded-lg bg-[#1d4ed8] text-white text-xs font-semibold"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddTag(true)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f3f4f3] hover:bg-[#eeeeed] font-caption text-xs text-[#1d4ed8] transition-colors"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-[15px]">add</span>
                        Add Sub-discipline
                      </button>
                    )}
                  </div>
                </div>

                {/* Research Keywords */}
                <div className="mb-6">
                  <label className="block font-caption-strong text-xs text-[#1a1a1e] mb-2">
                    Specific Research Subfields &amp; Keywords <span className="text-ink-muted font-normal">(Used for faculty &amp; donor indexing)</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {researchKeywords.map((kw) => (
                      <span 
                        key={kw}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#dce2f3]/40 text-[#1a1a1e] font-caption-strong text-xs"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => removeKeyword(kw)}
                          className="text-ink-muted hover:text-[#ba1a1a]"
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    ))}
                    {showAddKeyword ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newKeywordInput}
                          onChange={(e) => setNewKeywordInput(e.target.value)}
                          placeholder="e.g. Algorithmic Justice"
                          className="h-8 px-2.5 rounded-lg border border-[#e5e7eb] text-xs focus:outline-none focus-visible:ring-1 focus:ring-[#1d4ed8]"
                          onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                        />
                        <button
                          type="button"
                          onClick={addKeyword}
                          className="px-2.5 py-1 rounded-lg bg-[#1d4ed8] text-white text-xs font-semibold"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddKeyword(true)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#f3f4f3] hover:bg-[#eeeeed] text-[#1d4ed8] font-caption-strong text-xs transition-colors"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-[15px]">add</span>
                        Add Keyword
                      </button>
                    )}
                  </div>
                </div>

                {/* Target Program Types */}
                <div>
                  <label className="block font-caption-strong text-xs text-[#1a1a1e] mb-2.5">
                    Target Program Type to Pursue <span className="text-ink-muted font-normal">(Select all that apply)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label 
                      onClick={() => toggleTargetDegree('masters')}
                      className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer select-none transition-all ${
                        targetDegrees.includes('masters')
                          ? 'bg-[#dce2f3]/25 ring-2 ring-[#1d4ed8]'
                          : 'bg-[#f3f4f3] hover:bg-[#eeeeed]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={targetDegrees.includes('masters')}
                        readOnly
                        className="mt-1 h-4 w-4 rounded accent-[#1d4ed8]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-caption-strong text-sm text-[#1a1a1e]">Master's Degree (MSc, MA, MPhil)</span>
                          <span className="text-[10px] font-caption-strong text-[#047857] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full">
                            520+ Grants
                          </span>
                        </div>
                        <p className="font-caption text-xs text-ink-muted mt-0.5">Taught &amp; research master's across UK, Europe, &amp; North America.</p>
                      </div>
                    </label>

                    <label 
                      onClick={() => toggleTargetDegree('phd')}
                      className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer select-none transition-all ${
                        targetDegrees.includes('phd')
                          ? 'bg-[#dce2f3]/25 ring-2 ring-[#1d4ed8]'
                          : 'bg-[#f3f4f3] hover:bg-[#eeeeed]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={targetDegrees.includes('phd')}
                        readOnly
                        className="mt-1 h-4 w-4 rounded accent-[#1d4ed8]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-caption-strong text-sm text-[#1a1a1e]">Doctoral / PhD (DPhil, PhD)</span>
                          <span className="text-[10px] font-caption-strong text-[#047857] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full">
                            320+ Fully Funded
                          </span>
                        </div>
                        <p className="font-caption text-xs text-ink-muted mt-0.5">Funded doctoral studentships, DAAD fellowships, &amp; NIH/NSF lab stipends.</p>
                      </div>
                    </label>

                    <label 
                      onClick={() => toggleTargetDegree('bachelors')}
                      className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer select-none transition-all ${
                        targetDegrees.includes('bachelors')
                          ? 'bg-[#dce2f3]/25 ring-2 ring-[#1d4ed8]'
                          : 'bg-[#f3f4f3] hover:bg-[#eeeeed]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={targetDegrees.includes('bachelors')}
                        readOnly
                        className="mt-1 h-4 w-4 rounded accent-[#1d4ed8]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-caption-strong text-sm text-[#1a1a1e]">Bachelor's Degree</span>
                          <span className="text-[10px] font-caption text-ink-muted bg-[#eeeeed] px-2 py-0.5 rounded-full">
                            140 Grants
                          </span>
                        </div>
                        <p className="font-caption text-xs text-ink-muted mt-0.5">Undergraduate entrance scholarships and regional grants.</p>
                      </div>
                    </label>

                    <label 
                      onClick={() => toggleTargetDegree('postdoc')}
                      className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer select-none transition-all ${
                        targetDegrees.includes('postdoc')
                          ? 'bg-[#dce2f3]/25 ring-2 ring-[#1d4ed8]'
                          : 'bg-[#f3f4f3] hover:bg-[#eeeeed]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={targetDegrees.includes('postdoc')}
                        readOnly
                        className="mt-1 h-4 w-4 rounded accent-[#1d4ed8]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-caption-strong text-sm text-[#1a1a1e]">Postdoctoral Fellowship</span>
                          <span className="text-[10px] font-caption text-ink-muted bg-[#eeeeed] px-2 py-0.5 rounded-full">
                            85 Grants
                          </span>
                        </div>
                        <p className="font-caption text-xs text-ink-muted mt-0.5">Early-career research stipends &amp; mobility grants (e.g. Marie Curie).</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* CARD C: Preferred Destinations & Regions */}
              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-[#e5e7eb]">
                <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#e5e7eb]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#dce2f3]/60 text-[#1d4ed8] flex items-center justify-center font-semibold">
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">public</span>
                    </div>
                    <div>
                      <h2 className="font-title text-base text-[#1a1a1e]">
                        3. Destination Regions &amp; Mobility Model
                      </h2>
                      <p className="font-caption text-xs text-ink-muted">
                        ScholarFind maps institutional fee-waivers and living bursaries by jurisdiction
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#eeeeed] text-ink-muted font-label-sm text-[11px]">
                    {targetRegions.length} Regions Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
                  {/* Western Europe */}
                  <div 
                    onClick={() => toggleTargetRegion('Western & Northern Europe')}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      targetRegions.includes('Western & Northern Europe')
                        ? 'bg-[#dce2f3]/25 ring-2 ring-[#1d4ed8]'
                        : 'bg-[#f3f4f3] hover:bg-[#eeeeed]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🇬🇧 🇩🇪 🇫🇷 🇳🇱 🇸🇪</span>
                        <span className="font-caption-strong text-sm text-[#1a1a1e]">Western &amp; Northern Europe</span>
                      </div>
                      <span aria-hidden="true" className={`material-symbols-outlined text-[20px] ${
                        targetRegions.includes('Western & Northern Europe') ? 'text-[#1d4ed8]' : 'text-ink-muted'
                      }`}>
                        {targetRegions.includes('Western & Northern Europe') ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </div>
                    <p className="font-caption text-xs text-ink-muted mb-2.5">
                      Includes Chevening, Commonwealth, DAAD, Erasmus Mundus, and Swedish Institute bursaries.
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-caption-strong text-[#047857] bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 rounded-full">
                        640+ Matching Opportunities
                      </span>
                    </div>
                  </div>

                  {/* North America */}
                  <div 
                    onClick={() => toggleTargetRegion('North America')}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      targetRegions.includes('North America')
                        ? 'bg-[#dce2f3]/25 ring-2 ring-[#1d4ed8]'
                        : 'bg-[#f3f4f3] hover:bg-[#eeeeed]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🇺🇸 🇨🇦</span>
                        <span className="font-caption-strong text-sm text-[#1a1a1e]">North America</span>
                      </div>
                      <span aria-hidden="true" className={`material-symbols-outlined text-[20px] ${
                        targetRegions.includes('North America') ? 'text-[#1d4ed8]' : 'text-ink-muted'
                      }`}>
                        {targetRegions.includes('North America') ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </div>
                    <p className="font-caption text-xs text-ink-muted mb-2.5">
                      Includes Fulbright, Vanier CGS, Knight-Hennessy, and university departmental assistantships.
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-caption-strong text-[#047857] bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 rounded-full">
                        410+ Matching Opportunities
                      </span>
                    </div>
                  </div>

                  {/* East Asia & Oceania */}
                  <div 
                    onClick={() => toggleTargetRegion('East Asia & Oceania')}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      targetRegions.includes('East Asia & Oceania')
                        ? 'bg-[#dce2f3]/25 ring-2 ring-[#1d4ed8]'
                        : 'bg-[#f3f4f3] hover:bg-[#eeeeed]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🇯🇵 🇰🇷 🇦🇺 🇳🇿</span>
                        <span className="font-caption-strong text-sm text-[#1a1a1e]">East Asia &amp; Oceania</span>
                      </div>
                      <span aria-hidden="true" className={`material-symbols-outlined text-[20px] ${
                        targetRegions.includes('East Asia & Oceania') ? 'text-[#1d4ed8]' : 'text-ink-muted'
                      }`}>
                        {targetRegions.includes('East Asia & Oceania') ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </div>
                    <p className="font-caption text-xs text-ink-muted mb-2.5">
                      MEXT Japan, GKS Korea, Australia Awards, and Research Training Program (RTP) funds.
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-caption text-ink-muted bg-[#eeeeed] px-2.5 py-0.5 rounded-full">
                        210+ Matching Opportunities
                      </span>
                    </div>
                  </div>

                  {/* Latin America & Middle East */}
                  <div 
                    onClick={() => toggleTargetRegion('Latin America & Middle East')}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      targetRegions.includes('Latin America & Middle East')
                        ? 'bg-[#dce2f3]/25 ring-2 ring-[#1d4ed8]'
                        : 'bg-[#f3f4f3] hover:bg-[#eeeeed]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🇧🇷 🇲🇽 🇦🇪 🇸🇦</span>
                        <span className="font-caption-strong text-sm text-[#1a1a1e]">Latin America &amp; Middle East</span>
                      </div>
                      <span aria-hidden="true" className={`material-symbols-outlined text-[20px] ${
                        targetRegions.includes('Latin America & Middle East') ? 'text-[#1d4ed8]' : 'text-ink-muted'
                      }`}>
                        {targetRegions.includes('Latin America & Middle East') ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </div>
                    <p className="font-caption text-xs text-ink-muted mb-2.5">
                      OAS Fellowships, KAUST Discovery Scholarships, and national research council mobility.
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-caption text-ink-muted bg-[#eeeeed] px-2.5 py-0.5 rounded-full">
                        95+ Matching Opportunities
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prioritized Countries */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-caption-strong text-xs text-[#1a1a1e]">
                      Prioritized Destination Countries <span className="text-ink-muted font-normal">(Ranked higher in your matches)</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {targetCountries.map((country) => (
                      <span 
                        key={country}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eeeeed] text-[#1a1a1e] font-caption-strong text-xs"
                      >
                        {country}
                        <button 
                          type="button" 
                          onClick={() => removeCountry(country)}
                          className="text-ink-muted hover:text-[#ba1a1a]"
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => addCountry('Switzerland')}
                        className="text-xs text-[#1d4ed8] hover:underline"
                      >
                        + Switzerland
                      </button>
                      <span className="text-xs text-ink-muted">•</span>
                      <button
                        type="button"
                        onClick={() => addCountry('Japan')}
                        className="text-xs text-[#1d4ed8] hover:underline"
                      >
                        + Japan
                      </button>
                    </div>
                  </div>
                </div>

                {/* Intended Start Term */}
                <div>
                  <label className="block font-caption-strong text-xs text-[#1a1a1e] mb-2">
                    Intended Start Year / Term
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Fall 2026', 'Spring 2027', 'Fall 2027', 'Flexible / Any'].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setIntendedStartTerm(term)}
                        className={`p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          intendedStartTerm === term
                            ? 'bg-[#0037b0] text-white shadow-xs'
                            : 'bg-[#f3f4f3] text-[#1a1a1e] hover:bg-[#eeeeed]'
                        }`}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LANGUAGE & TESTING */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-left mb-6">
                <h1 className="font-headline-lg text-[#1a1a1e] tracking-tight mb-2">
                  Language Proficiency &amp; Professional Experience
                </h1>
                <p className="font-body-lead text-ink-muted">
                  Many endowments grant official language waivers or require minimum professional or leadership tenure.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-[#e5e7eb] space-y-6">
                <div>
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-[#f3f4f3] border border-[#e5e7eb] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasEnglishMediumInstruction}
                      onChange={(e) => setHasEnglishMediumInstruction(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#1d4ed8] accent-[#1d4ed8]"
                    />
                    <div>
                      <span className="font-caption-strong text-sm text-[#1a1a1e] block">
                        Undergraduate Degree Taught in English (Medium of Instruction Waiver)
                      </span>
                      <p className="font-caption text-xs text-ink-muted mt-0.5">
                        Institutions such as Cambridge, DAAD, and UK universities frequently waive external testing if your official transcript confirms English medium of instruction.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-caption-strong text-xs text-[#1a1a1e] mb-1.5">
                      Standardized English Test
                    </label>
                    <select
                      value={englishTestType}
                      onChange={(e) => setEnglishTestType(e.target.value as any)}
                      className="w-full h-11 px-3.5 rounded-lg bg-[#f3f4f3] text-sm text-[#1a1a1e] focus:bg-white focus:outline-none focus-visible:ring-2 focus:ring-[#1d4ed8]"
                    >
                      <option value="none">None / Pending Upload</option>
                      <option value="ielts">IELTS Academic</option>
                      <option value="toefl">TOEFL iBT</option>
                      <option value="duolingo">Duolingo English Test</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-caption-strong text-xs text-[#1a1a1e] mb-1.5">
                      Overall Score / Band
                    </label>
                    <input
                      type="text"
                      value={englishScore}
                      onChange={(e) => setEnglishScore(e.target.value)}
                      placeholder="e.g. 7.5 or 105"
                      disabled={englishTestType === 'none'}
                      className="w-full h-11 px-3.5 rounded-lg bg-[#f3f4f3] text-sm text-[#1a1a1e] focus:bg-white focus:outline-none focus-visible:ring-2 focus:ring-[#1d4ed8] disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-caption-strong text-xs text-[#1a1a1e] mb-1.5">
                    Years of Full-Time Work / Leadership Experience: <span className="text-[#1d4ed8] font-bold">{workExperienceYears} years</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={workExperienceYears}
                    onChange={(e) => setWorkExperienceYears(parseInt(e.target.value) || 0)}
                    className="w-full accent-[#1d4ed8] h-2 bg-[#eeeeed] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between font-label-sm text-[11px] text-ink-muted pt-1">
                    <span>0 yrs (Fresh graduate)</span>
                    <span>2 yrs (Chevening threshold)</span>
                    <span>3+ yrs (Rotary threshold)</span>
                    <span>10+ yrs</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & MATCH FIT */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-left mb-6">
                <h1 className="font-headline-lg text-[#1a1a1e] tracking-tight mb-2">
                  Credential Verification &amp; Match Profile
                </h1>
                <p className="font-body-lead text-ink-muted">
                  Your profile has been synchronized with the deterministic evaluation engine.
                </p>
              </div>

              {/* Summary Metrics Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e5e7eb] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#0037b0] text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                    {normalizedGpaScore >= 85 ? 'A' : 'B+'}
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-[#1a1a1e] text-lg">
                      {institution}
                    </h2>
                    <p className="font-caption text-xs text-ink-muted">
                      Standardized Score: <span className="font-bold text-[#1a1a1e]">{normalizedGpaScore.toFixed(1)}%</span> • {equivalencyLabel}
                    </p>
                    <p className="font-caption text-xs text-[#047857] flex items-center gap-1 mt-0.5">
                      <span aria-hidden="true" className="material-symbols-outlined text-[14px]">verified</span>
                      Institutional record on file
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-headline-md text-[#1d4ed8] font-bold">
                    Profile complete
                  </span>
                  <span className="font-label-sm text-[11px] text-[#047857] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full">
                    Ready to match
                  </span>
                </div>
              </div>

              {/* Profile Details Review Table */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e5e7eb] divide-y divide-[#e5e7eb] text-sm">
                <div className="py-2.5 flex justify-between">
                  <span className="text-ink-muted">Primary Passport</span>
                  <span className="font-semibold text-[#1a1a1e]">{citizenship}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-ink-muted">Degree Level Pursued</span>
                  <span className="font-semibold text-[#1a1a1e] capitalize">{targetDegrees.join(', ')}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-ink-muted">Primary Specialization</span>
                  <span className="font-semibold text-[#1a1a1e]">{primaryField}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-ink-muted">Target Study Regions</span>
                  <span className="font-semibold text-[#1a1a1e]">{targetRegions.join(', ')}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-ink-muted">Delivery Modality</span>
                  <span className="font-semibold text-[#1a1a1e] capitalize">{deliveryModality.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Action Navigation Bar */}
          <div className="mt-8 pt-6 pb-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#e5e7eb] w-full min-w-0">
            <button
              onClick={handlePrev}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#f3f4f3] hover:bg-[#eeeeed] text-[#1a1a1e] font-caption-strong text-xs transition-all cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_back</span>
              {step === 1 ? 'Cancel' : 'Previous Step'}
            </button>

            <div className="flex items-center gap-2 font-caption text-xs text-ink-muted truncate">
              <span className="w-2 h-2 rounded-full bg-[#047857] shrink-0"></span>
              <span className="truncate">Saved on this device</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end min-w-0">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#f3f4f3] hover:bg-[#eeeeed] text-[#1a1a1e] font-caption-strong text-xs transition-colors cursor-pointer text-center"
              >
                Close
              </button>
              <button
                onClick={handleNext}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1d4ed8] hover:bg-[#2563eb] text-white font-body-strong text-xs sm:text-sm shadow-sm transition-all transform active:scale-95 cursor-pointer text-center"
              >
                <span className="truncate">{step === 4 ? 'Save Profile & Explore Matches' : 'Continue to Next Step'}</span>
                <span aria-hidden="true" className="material-symbols-outlined text-[18px] shrink-0">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
