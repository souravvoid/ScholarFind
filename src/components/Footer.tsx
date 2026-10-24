import React from 'react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-white border-t border-[#e5e7eb] py-10">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0037b0] flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-[17px]">school</span>
            </div>
            <span className="font-title text-base text-[#1a1a1e] font-semibold">ScholarFind</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <button
              onClick={() => onNavigate('landing')}
              className="font-caption text-xs text-[#6b7280] hover:text-[#1a1a1e] transition-colors cursor-pointer"
            >
              About ScholarFind
            </button>
            <button
              onClick={() => onNavigate('sources')}
              className="font-caption text-xs text-[#6b7280] hover:text-[#1a1a1e] transition-colors cursor-pointer"
            >
              Verified Sources
            </button>
            <button
              onClick={() => onNavigate('sources')}
              className="font-caption text-xs text-[#6b7280] hover:text-[#1a1a1e] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onNavigate('sources')}
              className="font-caption text-xs text-[#6b7280] hover:text-[#1a1a1e] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onNavigate('sources')}
              className="font-caption text-xs text-[#6b7280] hover:text-[#1a1a1e] transition-colors cursor-pointer"
            >
              Student Disclaimers
            </button>
            <button
              onClick={() => onNavigate('sources')}
              className="font-caption text-xs text-[#6b7280] hover:text-[#1a1a1e] transition-colors cursor-pointer"
            >
              Support
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[#6b7280] font-caption text-xs">
          <p>© {new Date().getFullYear()} ScholarFind Academic Verification Initiative. All rights reserved.</p>
          <p>Authoritative registry for verified international collegiate endowments.</p>
        </div>
      </div>
    </footer>
  );
};
