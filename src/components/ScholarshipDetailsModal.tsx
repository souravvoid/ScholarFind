import React, { useState } from 'react';
import { Scholarship, StudentProfile } from '../types';
import { evaluateEligibility } from '../utils/eligibilityEngine';
import { useAuth } from '../context/AuthContext';
import { OfficialRedirectModal } from './OfficialRedirectModal';
import { getDeadlineDisplay } from '../services/databaseService';

interface ScholarshipDetailsModalProps {
  scholarship: Scholarship | null;
  onClose: () => void;
  onOpenProfileBuilder: () => void;
}

export const ScholarshipDetailsModal: React.FC<ScholarshipDetailsModalProps> = ({
  scholarship,
  onClose,
  onOpenProfileBuilder
}) => {
  const { profile, isSaved, saveScholarship, unsaveScholarship } = useAuth();
  const [showRedirectConfirm, setShowRedirectConfirm] = useState(false);

  if (!scholarship) return null;

  const evaluation = evaluateEligibility(scholarship, profile);
  const currentlySaved = isSaved(scholarship.id);

  const getStatusBadge = () => {
    switch (evaluation.status) {
      case 'likely_eligible':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] font-label-sm text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
            {evaluation.statusLabel}
          </span>
        );
      case 'more_info_needed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fffbeb] border border-[#fde68a] text-[#b45309] font-label-sm text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b45309]"></span>
            {evaluation.statusLabel}
          </span>
        );
      case 'ineligible':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] font-label-sm text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#be123c]"></span>
            Does not meet a mandatory criterion
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eeeeed] text-[#434655] font-label-sm text-[11px]">
            Review criteria
          </span>
        );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
        {/* Backdrop Scrim */}
        <div 
          className="fixed inset-0 bg-[#1a1a1e]/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal Window Container */}
        <div 
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-[820px] max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] overflow-hidden z-50 my-auto animate-in fade-in zoom-in-95 duration-200 min-w-0"
        >
          {/* Sticky Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#e5e7eb] bg-[#fbfbfa] w-full min-w-0">
            <div className="flex items-center gap-2 min-w-0 pr-2 flex-1">
              <span className="text-xl shrink-0">{scholarship.destinationFlag}</span>
              <span className="font-caption-strong text-xs sm:text-sm text-[#1a1a1e] truncate">
                {scholarship.destinationCountries.join(', ')} • {scholarship.providerCategory}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center rounded-full text-[#6b7280] hover:text-[#1a1a1e] hover:bg-[#e8e8e7] transition-colors shrink-0 cursor-pointer"
              aria-label="Close details"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 w-full min-w-0">
            {/* Top Overview & Status */}
            <div className="w-full min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-3 w-full min-w-0">
                {getStatusBadge()}
                <span className="text-xs text-[#6b7280] truncate">
                  Verified {scholarship.lastVerified} via {scholarship.sourceDomain}
                </span>
              </div>
              <h2 className="font-headline-md sm:font-headline-lg text-[#1a1a1e] mb-2 break-words">
                {scholarship.title}
              </h2>
              <p className="font-title text-base text-[#0037b0] font-medium truncate">
                {scholarship.providerName}
              </p>
            </div>

            {/* Key Value Proposition Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#f3f4f3] border border-[#e5e7eb] w-full min-w-0">
              <div className="space-y-1 min-w-0">
                <span className="block font-label-sm text-[#6b7280] uppercase tracking-wider truncate">Total Award Value</span>
                <span className="font-headline-sm text-[20px] text-[#1a1a1e] block truncate">
                  {scholarship.totalAwardValue}
                </span>
                <span className="font-caption text-xs text-[#6b7280] block break-words">
                  {scholarship.awardDetails}
                </span>
              </div>
              <div className="space-y-1 min-w-0">
                <span className="block font-label-sm text-[#6b7280] uppercase tracking-wider truncate">Deadline</span>
                {(() => {
                  const deadlineInfo = getDeadlineDisplay(scholarship.applicationDeadline);
                  return (
                    <>
                      <div className={`flex items-center gap-1.5 font-caption-strong text-sm min-w-0 ${deadlineInfo.isClosed ? 'text-[#6b7280]' : 'text-[#ba1a1a]'}`}>
                        <span className="material-symbols-outlined text-[16px] shrink-0">schedule</span>
                        <span className="truncate">{scholarship.applicationDeadline}</span>
                      </div>
                      <span className="font-caption text-xs text-[#6b7280] block truncate">
                        {deadlineInfo.statusLabel}
                      </span>
                    </>
                  );
                })()}
              </div>
              <div className="space-y-1 min-w-0">
                <span className="block font-label-sm text-[#6b7280] uppercase tracking-wider truncate">Eligible Study Levels</span>
                <span className="font-caption-strong text-sm text-[#1a1a1e] block capitalize truncate">
                  {scholarship.studyLevels.join(', ')}
                </span>
                <span className="font-caption text-xs text-[#6b7280] block truncate">
                  Academic Year {scholarship.academicYear}
                </span>
              </div>
            </div>

            {/* Overview Statement */}
            <div className="space-y-2">
              <h3 className="font-title text-base text-[#1a1a1e]">
                About this Endowment
              </h3>
              <p className="font-body-default text-[#434655] leading-relaxed">
                {scholarship.overview}
              </p>
            </div>

            {/* Deterministic Eligibility Rubric Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-title text-base text-[#1a1a1e]">
                    Eligibility Rubric &amp; Verified Criteria
                  </h3>
                  <p className="font-caption text-xs text-[#6b7280]">
                    Evaluated against your active student profile ({profile?.displayName || 'Guest Profile'})
                  </p>
                </div>
                <button
                  onClick={onOpenProfileBuilder}
                  className="font-caption-strong text-xs text-[#0037b0] hover:underline"
                >
                  Edit Profile
                </button>
              </div>

              <div className="space-y-3">
                {evaluation.evaluatedList.map((item, idx) => {
                  let statusBg = 'bg-[#ecfdf5] border-[#a7f3d0] text-[#047857]';
                  let icon = 'check_circle';
                  if (item.status === 'missing') {
                    statusBg = 'bg-[#fffbeb] border-[#fde68a] text-[#b45309]';
                    icon = 'help';
                  } else if (item.status === 'failed') {
                    statusBg = 'bg-[#fff1f2] border-[#fecdd3] text-[#be123c]';
                    icon = 'cancel';
                  }

                  return (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl border border-[#e5e7eb] bg-white space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[18px] ${
                            item.status === 'passed' ? 'text-[#047857]' : item.status === 'missing' ? 'text-[#b45309]' : 'text-[#be123c]'
                          }`}>
                            {icon}
                          </span>
                          <span className="font-caption-strong text-sm text-[#1a1a1e]">
                            {item.criterion.title}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${statusBg}`}>
                          {item.status === 'passed' ? 'Met' : item.status === 'missing' ? 'Info Needed' : 'Not Met'}
                        </span>
                      </div>
                      <p className="font-caption text-xs text-[#434655] pl-6">
                        {item.explanation}
                      </p>
                      <div className="pt-1 pl-6 flex items-center gap-1 font-caption text-[11px] text-[#6b7280]">
                        <span className="material-symbols-outlined text-[13px]">policy</span>
                        <span>Official Source: {item.criterion.sourceCitation}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Required Documentation */}
            <div className="space-y-3">
              <h3 className="font-title text-base text-[#1a1a1e]">
                Required Application Documents
              </h3>
              <ul className="space-y-2">
                {scholarship.requiredDocuments.map((doc, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-[#434655]">
                    <span className="material-symbols-outlined text-[18px] text-[#0037b0] shrink-0 mt-0.5">
                      description
                    </span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Application Steps */}
            <div className="space-y-3">
              <h3 className="font-title text-base text-[#1a1a1e]">
                Application Instructions
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-[#434655]">
                {scholarship.applicationInstructions.map((instruction, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="font-medium text-[#1a1a1e]">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Provenance & Institutional Integrity Card */}
            <div className="p-4 rounded-xl bg-[#f3f4f3] border border-[#e5e7eb] flex items-start gap-3.5">
              <span className="material-symbols-outlined text-[22px] text-[#0037b0] shrink-0 mt-0.5">
                verified_user
              </span>
              <div className="space-y-1">
                <span className="font-caption-strong text-xs text-[#1a1a1e] block">
                  Authoritative Indexing Guarantee
                </span>
                <p className="font-caption text-xs text-[#6b7280] leading-relaxed">
                  ScholarFind operates under strict non-commercial audit principles. We link directly to verified official host domains. Record collected: {scholarship.provenance.collectedAt.slice(0, 10)}.
                </p>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Footer CTA Bar */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[#e5e7eb] bg-[#fbfbfa] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            <button
              onClick={() => {
                if (currentlySaved) {
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
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border font-caption-strong text-sm transition-colors cursor-pointer min-h-[44px] ${
                currentlySaved
                  ? 'bg-[#dce2f3] text-[#0037b0] border-[#b7c4ff]'
                  : 'bg-white text-[#1a1a1e] border-[#e5e7eb] hover:bg-[#f3f4f3]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {currentlySaved ? 'bookmark_added' : 'bookmark_border'}
              </span>
              <span>{currentlySaved ? 'Saved to Tracker' : 'Save Scholarship'}</span>
            </button>

            <button
              onClick={() => setShowRedirectConfirm(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#1d4ed8] hover:bg-[#2563eb] text-white font-body-strong text-sm shadow-md active:scale-95 transition-all cursor-pointer min-h-[44px]"
            >
              <span>Continue to Official Application</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Redirect Confirmation Dialog */}
      <OfficialRedirectModal
        scholarship={scholarship}
        isOpen={showRedirectConfirm}
        onClose={() => setShowRedirectConfirm(false)}
      />
    </>
  );
};
