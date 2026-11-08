import React, { useState } from 'react';
import { Scholarship } from '../types';

interface OfficialRedirectModalProps {
  scholarship: Scholarship;
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialRedirectModal: React.FC<OfficialRedirectModalProps> = ({
  scholarship,
  isOpen,
  onClose
}) => {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  if (!isOpen) return null;

  // Trust-boundary check: any non-https/unparseable URL is blocked; hosts are ranked
  // against the record's audited source domain (a legit allied portal shows a warning).
  const destinationUrl = scholarship.officialApplicationUrl || scholarship.officialSourceUrl;
  const auditedDomain = scholarship.sourceDomain || '';
  type Gate = 'verified' | 'mismatch' | 'blocked';
  let parsedHost = '';
  let gate: Gate = 'blocked';
  try {
    const urlObj = new URL(destinationUrl);
    parsedHost = urlObj.hostname;
    const hostMatched = auditedDomain !== '' &&
      (parsedHost === auditedDomain || parsedHost.endsWith('.' + auditedDomain));
    if (urlObj.protocol === 'https:' && parsedHost !== '') {
      gate = hostMatched ? 'verified' : 'mismatch';
    }
  } catch (e) {
    parsedHost = '';
  }

  const handleProceed = () => {
    // Open in secure new tab with noopener, noreferrer
    window.open(destinationUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#1a1a1e]/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="redirect-dialog-title"
        className="relative w-full max-w-[540px] max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] p-5 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200 min-w-0"
      >
        {/* Close Button with 44px touch target */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-5 sm:right-5 w-11 h-11 flex items-center justify-center rounded-full text-[#6b7280] hover:text-[#1a1a1e] hover:bg-[#f3f4f3] transition-colors cursor-pointer"
          aria-label="Close redirect confirmation"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-xl bg-[#dce2f3] text-[#0037b0] flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-[26px]">open_in_new</span>
        </div>

        <h3 id="redirect-dialog-title" className="font-headline-sm text-headline-sm text-[#1a1a1e] mb-2">
          Leaving ScholarFind to Official Portal
        </h3>

        <p className="font-body-default text-[#6b7280] mb-5 leading-relaxed">
          You are about to continue to the verified official application website for{' '}
          <strong className="text-[#1a1a1e]">{scholarship.title}</strong> hosted by{' '}
          <strong className="text-[#1a1a1e]">{scholarship.providerName}</strong>.
        </p>

        {/* Destination Trust Notice Box */}
        <div className={`p-4 rounded-xl border mb-5 space-y-2 ${
          gate === 'verified' ? 'bg-[#f3f4f3] border-[#e5e7eb]'
          : gate === 'mismatch' ? 'bg-[#fffbeb] border-[#fde68a]'
          : 'bg-[#fff1f2] border-[#fecdd3]'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
            <span>{gate === 'verified' ? 'Verified Destination Host' : gate === 'mismatch' ? 'Unaudited origin' : 'Blocked Destination'}</span>
            <span className={`inline-flex items-center gap-1 lowercase font-normal ${
              gate === 'verified' ? 'text-[#047857]' : gate === 'mismatch' ? 'text-[#b45309]' : 'text-[#be123c]'
            }`}>
              <span className="material-symbols-outlined text-[14px]">
                {gate === 'verified' ? 'lock' : gate === 'mismatch' ? 'warning' : 'gpp_bad'}
              </span>
              {gate === 'verified' ? 'https verified' : gate === 'mismatch' ? 'https · origin differs' : 'cannot verify origin'}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-sm text-[#1a1a1e] bg-white p-2 rounded-lg border border-[#e5e7eb] break-all">
            <span className={`material-symbols-outlined text-[18px] ${
              gate === 'verified' ? 'text-[#0037b0]' : gate === 'mismatch' ? 'text-[#b45309]' : 'text-[#be123c]'
            }`}>
              {gate === 'verified' ? 'verified' : gate === 'mismatch' ? 'help' : 'gpp_bad'}
            </span>
            <span>{parsedHost || destinationUrl}</span>
          </div>
          <p className="font-caption text-xs text-[#6b7280]">
            {gate === 'verified' ? (
              <>Audit Provenance: Verified via {scholarship.provenance.sourceName} on {scholarship.lastVerified}.</>
            ) : gate === 'mismatch' ? (
              <>This host differs from the record's audited source domain ({auditedDomain}). Providers
              sometimes use allied application portals — verify the URL matches the official program
              guidance before entering personal data.</>
            ) : (
              <>This link is not HTTPS or cannot be parsed, so it has been blocked. Review the
              program's official guidance manually before applying.</>
            )}
          </p>
        </div>

        {/* Disclaimer acknowledgment checkbox */}
        <label className="flex items-start gap-3 p-3 rounded-lg bg-[#fffbeb] border border-[#fde68a] mb-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasAcknowledged}
            onChange={(e) => setHasAcknowledged(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-[#0037b0] focus:ring-[#0037b0] accent-[#0037b0]"
          />
          <span className="font-caption text-xs text-[#b45309] leading-relaxed">
            I understand that ScholarFind is an independent indexing platform. Final eligibility criteria, admissions, and financial award decisions are determined exclusively by the scholarship provider.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 w-full min-w-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-lg border border-[#e5e7eb] font-caption-strong text-sm text-[#1a1a1e] hover:bg-[#f3f4f3] transition-colors flex items-center justify-center cursor-pointer"
          >
            Stay on ScholarFind
          </button>
          <button
            onClick={handleProceed}
            disabled={!hasAcknowledged || gate === 'blocked'}
            className={`w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-body-strong text-sm transition-all shadow-sm ${
              hasAcknowledged && gate !== 'blocked'
                ? 'bg-[#1d4ed8] hover:bg-[#2563eb] text-white active:scale-95 cursor-pointer'
                : 'bg-[#e2e2e2] text-[#6b7280] cursor-not-allowed'
            }`}
          >
            <span>Continue to Official Application</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
