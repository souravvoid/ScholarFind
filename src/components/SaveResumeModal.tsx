import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface SaveResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  matchedCount?: number;
}

export const SaveResumeModal: React.FC<SaveResumeModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  matchedCount = 842
}) => {
  const { profile } = useAuth();
  const [email, setEmail] = useState(profile?.email || 'amara.okafor@alumni.ui.edu.ng');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndResume = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      setTimeout(() => {
        onComplete();
      }, 1200);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Soft Backdrop Scrim */}
      <div 
        className="fixed inset-0 bg-[#1a1a1e]/45 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Centered Modal Card Container (matching Stitch Image 10) */}
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[520px] bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] overflow-hidden z-10 p-7 sm:p-8 my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#6b7280] hover:text-[#1a1a1e] hover:bg-[#f3f4f3] transition-colors"
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Bespoke Vector Badge: Secure Bookmark Vault Graphic */}
        <div className="flex justify-center mb-5">
          <div className="relative w-20 h-20 rounded-2xl bg-[#fbfbfa] border border-[#e5e7eb] flex items-center justify-center shadow-xs">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#dce2f3]/40 via-transparent to-[#ecfdf5]/50"></div>
            <svg className="relative w-12 h-12" fill="none" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
              {/* Academic Cap / Vault Crest Path */}
              <path d="M28 10L8 19L28 28L48 19L28 10Z" fill="#1d4ed8" fillOpacity="0.12" stroke="#1d4ed8" strokeLinejoin="round" strokeWidth="2" />
              <path d="M43 21.5V33C43 33 39 37 28 37C17 37 13 33 13 33V21.5" stroke="#1d4ed8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M28 28V46" stroke="#1d4ed8" strokeLinecap="round" strokeWidth="2" />
              {/* Bookmark Ribbon with Emerald Accent */}
              <path d="M33 34H41V46L37 43L33 46V34Z" fill="#047857" fillOpacity="0.9" />
              <circle cx="28" cy="46" fill="#b45309" r="3" />
              <path d="M47 14L49 11L52 9L49 7L47 4L45 7L42 9L45 11L47 14Z" fill="#1d4ed8" />
            </svg>
            {/* Active Status Floating Pill Badge */}
            <div className="absolute -bottom-1.5 -right-1.5 bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
              <span className="font-label-sm text-[10px] text-[#047857] tracking-wider">SAVED</span>
            </div>
          </div>
        </div>

        {/* Typography: Header & Context */}
        <div className="text-center space-y-2 mb-6">
          <h2 className="font-headline-sm text-headline-sm text-[#1a1a1e] font-semibold tracking-tight">
            Save progress and resume later?
          </h2>
          <p className="font-body-default text-sm text-[#6b7280] max-w-[420px] mx-auto leading-relaxed">
            Your academic background, GPA conversions, and active destination regions have been safely autosaved.
          </p>
        </div>

        {/* Highlighted Progress Callout Card */}
        <div className="bg-[#f9f9f8] border border-[#e5e7eb] rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#eeeeed] flex items-center justify-center shrink-0 text-[#1d4ed8]">
              <span className="material-symbols-outlined text-[20px]">bookmark_added</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-caption-strong text-xs text-[#1a1a1e]">
                  {matchedCount} verified awards currently matched
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
              </div>
              <p className="font-caption text-xs text-[#6b7280] leading-snug">
                Saved to your candidate profile. We will email a secure resumption link so you can seamlessly continue on mobile or desktop without a password.
              </p>
            </div>
          </div>
        </div>

        {/* Verified Magic Link Email Input */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <label className="font-caption-strong text-xs text-[#1a1a1e]" htmlFor="magic-email">
              Candidate Email
            </label>
            <span className="inline-flex items-center gap-1 font-label-sm text-[11px] text-[#047857]">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Identity verified
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6b7280]">
              <span className="material-symbols-outlined text-[18px]">mail</span>
            </div>
            <input
              id="magic-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 pl-10 pr-24 bg-white border border-[#e5e7eb] rounded-lg font-body-default text-sm text-[#1a1a1e] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="font-label-sm text-[10px] text-[#6b7280] uppercase tracking-wider bg-[#eeeeed] px-2 py-0.5 rounded">
                RESUME KEY
              </span>
            </div>
          </div>
          <p className="font-caption text-xs text-[#6b7280] flex items-center gap-1.5 pt-0.5">
            <span className="material-symbols-outlined text-[15px] text-[#6b7280]">lock</span>
            One-click resumption link will be encrypted and sent here. Valid for 14 days.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSaveAndResume}
            disabled={isSending || isSent}
            className={`w-full h-12 rounded-full font-body-strong text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
              isSent
                ? 'bg-[#047857] text-white'
                : 'bg-[#1d4ed8] hover:bg-[#2563eb] text-white cursor-pointer'
            }`}
          >
            {isSending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                <span>Generating secure resumption key...</span>
              </>
            ) : isSent ? (
              <>
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Link Sent! Progress Safely Saved</span>
              </>
            ) : (
              <>
                <span>Save and Resume Later</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full h-11 bg-transparent hover:bg-[#f3f4f3] text-[#1a1a1e] font-caption-strong text-sm rounded-full transition-colors flex items-center justify-center cursor-pointer"
          >
            Keep Working on Profile
          </button>
        </div>

        {/* Trust Note Footer */}
        <div className="mt-5 pt-3 text-center border-t border-[#e5e7eb]">
          <p className="font-caption text-xs text-[#6b7280] max-w-[380px] mx-auto text-center flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-[#047857]">verified_user</span>
            ScholarFind never charges discovery fees or submits applications without your explicit review.
          </p>
        </div>
      </div>
    </div>
  );
};
