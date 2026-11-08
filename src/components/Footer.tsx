import React from 'react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-arc-blue-textured text-white">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 lg:px-12 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-10 border-b border-white/15">
          {/* Left: link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <p className="font-arc-mono text-xs text-white/85 mb-4">Product</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Explore Scholarships', tab: 'explore' },
                  { label: 'Tracker & Saved', tab: 'tracker' },
                  { label: 'Source Transparency', tab: 'sources' },
                ].map((l) => (
                  <li key={l.label}>
                    <button
                      onClick={() => onNavigate(l.tab)}
                      className="text-sm text-white/85 hover:text-white transition-colors cursor-pointer"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-arc-mono text-xs text-white/85 mb-4">Resources</p>
              <ul className="space-y-2.5">
                {['Verified Sources', 'Privacy Policy', 'Terms of Service'].map((l) => (
                  <li key={l}>
                    <button
                      onClick={() => onNavigate('sources')}
                      className="text-sm text-white/85 hover:text-white transition-colors cursor-pointer"
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-arc-mono text-xs text-white/85 mb-4">Support</p>
              <ul className="space-y-2.5">
                {['Student Disclaimers', 'Support', 'About ScholarFind'].map((l) => (
                  <li key={l}>
                    <button
                      onClick={() => onNavigate('landing')}
                      className="text-sm text-white/85 hover:text-white transition-colors cursor-pointer"
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: company mark */}
          <div className="flex flex-col items-start md:items-end justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]">school</span>
              </div>
              <span className="font-arc-display text-xl text-white">ScholarFind</span>
            </div>
            <p className="text-sm text-white/85 md:text-right max-w-xs">
              Global scholarship discovery, academic credential standardization, and deterministic eligibility matching.
            </p>
            <div className="flex items-center gap-3">
              {([
                ['public', 'Website'],
                ['mail', 'Email'],
                ['code', 'Repository'],
              ] as const).map(([ic, label]) => (
                <button
                  key={ic}
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center text-white/85 hover:text-white hover:border-white/60 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">{ic}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-white/85 text-xs">
          <p>© {new Date().getFullYear()} ScholarFind Academic Verification Initiative. All rights reserved.</p>
          <p>Authoritative registry for verified international collegiate endowments.</p>
        </div>
      </div>
    </footer>
  );
};