import React, { useState } from 'react';
import { Scholarship } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface RedirectDestination {
  title: string;
  providerName: string;
  url: string;
  sourceDomain: string;
  sourceName?: string;
  lastVerified?: string;
}

type OfficialRedirectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  destinationLabel?: string;
} & (
  | { scholarship: Scholarship; destinationUrl?: string; destination?: never }
  | { destination: RedirectDestination; scholarship?: never; destinationUrl?: never }
);

export const OfficialRedirectModal: React.FC<OfficialRedirectModalProps> = (props) => {
  const { isOpen, onClose, destinationLabel = 'official application' } = props;
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const panelRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const isScholarship = props.scholarship !== undefined;
  const title = isScholarship ? props.scholarship.title : props.destination.title;
  const providerName = isScholarship ? props.scholarship.providerName : props.destination.providerName;
  const destinationUrl = isScholarship
    ? props.destinationUrl || props.scholarship.officialApplicationUrl || props.scholarship.officialSourceUrl
    : props.destination.url;
  const auditedDomain = isScholarship ? props.scholarship.sourceDomain || '' : props.destination.sourceDomain;
  const sourceName = isScholarship
    ? props.scholarship.provenance?.sourceName
    : props.destination.sourceName;
  const lastVerified = isScholarship ? props.scholarship.lastVerified : props.destination.lastVerified;

  // Trust-boundary check: any non-https/unparseable URL is blocked; hosts are ranked
  // against the record's audited source domain (a legit allied portal shows a warning).
  type Gate = 'verified' | 'mismatch' | 'unverified' | 'blocked';
  let parsedHost = '';
  let gate: Gate = 'blocked';
  try {
    const urlObj = new URL(destinationUrl);
    parsedHost = urlObj.hostname;
    const hostMatched = auditedDomain !== '' &&
      (parsedHost === auditedDomain || parsedHost.endsWith('.' + auditedDomain));
    if (urlObj.protocol === 'https:' && parsedHost !== '') {
      gate = auditedDomain === '' ? 'unverified' : hostMatched ? 'verified' : 'mismatch';
    }
  } catch (e) {
    parsedHost = '';
  }

  const handleProceed = () => {
    // Guard against bypass: only open if the URL passed the gate (https + host check)
    if (gate === 'blocked') return;
    let u: URL;
    try {
      u = new URL(destinationUrl);
    } catch {
      return;
    }
    if (u.protocol !== 'https:') return;
    // Open in secure new tab with noopener, noreferrer
    window.open(destinationUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#1f1633]/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="redirect-dialog-title"
        className="relative w-full max-w-[540px] max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] p-5 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200 min-w-0 outline-none"
      >
        {/* Close Button with 44px touch target */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-5 sm:right-5 w-11 h-11 flex items-center justify-center rounded-full text-ink-muted hover:text-[#1f1633] hover:bg-[#F5F4F7] transition-colors cursor-pointer"
          aria-label="Close redirect confirmation"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-xl bg-[#ECE7F7] text-[#150f23] flex items-center justify-center mb-5">
          <span aria-hidden="true" className="material-symbols-outlined text-[26px]">open_in_new</span>
        </div>

        <h3 id="redirect-dialog-title" className="font-headline-sm text-headline-sm text-[#1f1633] mb-2">
          Leaving ScholarFind for the {destinationLabel}
        </h3>

        <p className="font-body-default text-[var(--color-ink-muted)] mb-5 leading-relaxed">
          You are about to continue to the verified {destinationLabel} for{' '}
          <strong className="text-[#1f1633]">{title}</strong> hosted by{' '}
          <strong className="text-[#1f1633]">{providerName}</strong>.
        </p>

        {/* Destination Trust Notice Box */}
        <div className={`p-4 rounded-xl border mb-5 space-y-2 ${
          gate === 'verified' ? 'bg-[#F5F4F7] border-[#e5e7eb]'
          : gate === 'mismatch' || gate === 'unverified' ? 'bg-[#fffbeb] border-[#fde68a]'
          : 'bg-[#fff1f2] border-[#fecdd3]'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold text-ink-muted uppercase tracking-wider">
            <span>
              {gate === 'verified'
                ? 'Verified Destination Host'
                : gate === 'mismatch'
                  ? 'Unaudited origin'
                  : gate === 'unverified'
                    ? 'Origin not independently verified'
                    : 'Blocked Destination'}
            </span>
            <span className={`inline-flex items-center gap-1 lowercase font-normal ${
              gate === 'verified' ? 'text-[#047857]' : gate === 'mismatch' || gate === 'unverified' ? 'text-[#b45309]' : 'text-[#be123c]'
            }`}>
              <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                {gate === 'verified' ? 'lock' : gate === 'mismatch' || gate === 'unverified' ? 'warning' : 'gpp_bad'}
              </span>
              {gate === 'verified'
                ? 'https verified'
                : gate === 'mismatch'
                  ? 'https · origin differs'
                  : gate === 'unverified'
                    ? 'https · origin not independently verified'
                    : 'cannot verify origin'}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-sm text-[#1f1633] bg-white p-2 rounded-lg border border-[#e5e7eb] break-all">
            <span aria-hidden="true" className={`material-symbols-outlined text-[18px] ${
              gate === 'verified' ? 'text-[#150f23]' : gate === 'mismatch' || gate === 'unverified' ? 'text-[#b45309]' : 'text-[#be123c]'
            }`}>
              {gate === 'verified' ? 'verified' : gate === 'mismatch' ? 'help' : 'gpp_bad'}
            </span>
            <span>{parsedHost || destinationUrl}</span>
          </div>
          <p className="font-caption text-xs text-ink-muted">
            {gate === 'verified' ? (
              <>Audit Provenance: Verified via {sourceName || 'the listed source'}{lastVerified ? ` on ${lastVerified}` : ''}.</>
            ) : gate === 'mismatch' ? (
              <>This host differs from the record's audited source domain ({auditedDomain}). Providers
              sometimes use allied application portals — verify the URL matches the official program
              guidance before entering personal data.</>
            ) : gate === 'unverified' ? (
              <>This HTTPS URL has no separately audited host to compare against. Verify it against
              the provider's official program guidance before entering personal data.</>
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
            className="mt-0.5 w-4 h-4 rounded text-[#150f23] focus:ring-[#150f23] accent-[#150f23]"
          />
          <span className="font-caption text-xs text-[#b45309] leading-relaxed">
            I understand that ScholarFind is an independent indexing platform. Final eligibility criteria, admissions, and financial award decisions are determined exclusively by the scholarship provider.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 w-full min-w-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-lg border border-[#e5e7eb] font-caption-strong text-sm text-[#1f1633] hover:bg-[#F5F4F7] transition-colors flex items-center justify-center cursor-pointer"
          >
            Stay on ScholarFind
          </button>
          <button
            onClick={handleProceed}
            disabled={!hasAcknowledged || gate === 'blocked'}
            className={`w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-body-strong text-sm transition-all shadow-sm ${
              hasAcknowledged && gate !== 'blocked'
                ? 'bg-[#422082] hover:bg-[#6a5fc1] text-white active:scale-95 cursor-pointer'
                : 'bg-[var(--color-surface-container-highest)] text-ink-muted cursor-not-allowed'
            }`}
          >
            <span>Continue to {destinationLabel}</span>
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
