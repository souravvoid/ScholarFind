import React from 'react';
import { Scholarship } from '../types';
import { SCHOLARSHIPS_DATA } from '../data/scholarshipsData';
import { getDeadlineDisplay } from '../services/databaseService';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onOpenProfileBuilder: () => void;
  onSelectScholarship: (scholarship: Scholarship) => void;
}

const TESTIMONIALS = [
  {
    quote: 'ScholarFind turned a maze of deadlines into a clear, funded path. I matched with three programs in a week.',
    handle: '@amara.k',
    emoji: '✨',
  },
  {
    quote: 'The eligibility rubric is the first thing that actually explained why I qualified. No guesswork.',
    handle: '@diego.r',
    emoji: '💙',
  },
  {
    quote: 'Verified sources only. I stopped wasting time on scammy listings and applied with confidence.',
    handle: '@priya.s',
    emoji: '🕊️',
  },
  {
    quote: 'One profile, opportunities worldwide. The tracker kept every deadline honest.',
    handle: '@yuki.t',
    emoji: '⚡',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenProfileBuilder,
  onSelectScholarship
}) => {
  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('explore');
  };

  const featuredIds = ['gates-cambridge', 'daad-helmut-schmidt', 'knight-hennessy'];
  const featuredScholarships = featuredIds
    .map(id => SCHOLARSHIPS_DATA.find(s => s.id === id))
    .filter((s): s is Scholarship => !!s);

  return (
    <div className="flex flex-col w-full max-w-full overflow-x-hidden min-w-0">
      {/* Announcement bar */}
      <div className="w-full bg-[#1A1A8C] text-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 lg:px-12 py-2.5 flex items-center justify-center gap-2 text-center">
          <span className="font-arc-mono text-xs text-white/90">Now available worldwide</span>
          <span className="text-white/70 hidden sm:inline">—</span>
          <span className="font-body-default text-sm text-white/90 hidden sm:inline">
            Discover verified funding from trusted universities, foundations, and governments.
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative w-full bg-arc-blue-textured text-white overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 lg:px-12 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Circular stamp */}
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full border-2 border-white/40 flex items-center justify-center rotate-[-8deg]">
                <span className="font-arc-mono text-white text-[10px] leading-tight text-center">
                  Now<br />Open<br />Worldwide
                </span>
              </div>
            </div>

            {/* Hero display quote */}
            <h1 className="font-arc-display text-white text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] max-w-3xl mb-6 break-words">
              &ldquo;Your future deserves to be funded.&rdquo;
            </h1>

            {/* Supporting copy */}
            <p className="font-body-lead text-white/85 max-w-2xl mb-10 text-lg">
              One profile. Opportunities worldwide. A clearer path to apply. Discover curated, verified funding from trusted universities, foundations, and governments without the guesswork.
            </p>

            {/* Button pair */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-12">
              <button
                onClick={onOpenProfileBuilder}
                className="arc-btn-primary"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                <span>Get Started</span>
              </button>
              <button
                onClick={() => onNavigate('explore')}
                className="arc-btn-secondary"
              >
                <span className="material-symbols-outlined text-[16px]">search</span>
                <span>Explore Scholarships</span>
              </button>
            </div>

            {/* Search form card */}
            <form
              onSubmit={handleHeroSearch}
              className="w-full max-w-3xl bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <select
                defaultValue="masters"
                className="bg-white text-[#1A1A8C] rounded-lg px-3 py-2.5 font-body-default text-sm focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                <option value="bachelors">Bachelor's</option>
                <option value="masters">Master's</option>
                <option value="phd">PhD / Doctoral</option>
              </select>
              <input
                type="text"
                placeholder="Field of study"
                className="bg-white text-[#1A1A8C] rounded-lg px-3 py-2.5 font-body-default text-sm placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-white/60"
              />
              <button
                type="submit"
                className="bg-white text-[#3B3BFF] font-arc-mono text-xs rounded-lg px-3 py-2.5 hover:bg-white/90 transition-colors cursor-pointer"
              >
                Find Scholarships
              </button>
            </form>
          </div>
        </div>

        {/* Wavy divider */}
        <svg className="arc-wave-divider text-[#FFFEF0]" viewBox="0 0 1440 24" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,12 C240,24 480,0 720,12 C960,24 1200,0 1440,12 L1440,24 L0,24 Z" fill="currentColor" />
        </svg>
      </section>

      {/* Social proof / testimonials (cream band) */}
      <section className="w-full bg-arc-cream">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 lg:px-12 py-16 lg:py-24">
          {/* Emoji icons row */}
          <div className="flex items-center justify-center gap-6 mb-10 text-2xl">
            <span aria-hidden>✌️</span>
            <span aria-hidden>💙</span>
            <span aria-hidden>✨</span>
          </div>

          <h2 className="font-arc-display text-[#1A1A8C] text-3xl md:text-4xl text-center mb-4">
            Loved by scholars worldwide
          </h2>
          <p className="font-body-lead text-[#6B6B8C] text-center max-w-2xl mx-auto mb-12">
            Real students, real funding, real outcomes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.handle} className="flex flex-col items-center text-center">
                <span className="text-2xl mb-4" aria-hidden>{t.emoji}</span>
                <p className="font-arc-display text-[#3B3BFF] text-lg md:text-xl leading-snug mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <span className="arc-pill">{t.handle}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wavy divider back to blue */}
        <svg className="arc-wave-divider text-[#3B3BFF]" viewBox="0 0 1440 24" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,12 C240,0 480,24 720,12 C960,0 1200,24 1440,12 L1440,24 L0,24 Z" fill="currentColor" />
        </svg>
      </section>

      {/* Featured scholarships (on blue) */}
      <section className="w-full bg-arc-blue-textured text-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 lg:px-12 py-16 lg:py-24">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <p className="font-arc-mono text-xs text-white/85 mb-2">Featured</p>
              <h2 className="font-arc-display text-white text-3xl md:text-4xl">
                Scholarships worth your time
              </h2>
            </div>
            <button
              onClick={() => onNavigate('explore')}
              className="arc-btn-secondary self-start md:self-auto"
            >
              <span>View all</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredScholarships.map((s) => {
              const deadlineInfo = getDeadlineDisplay(s.applicationDeadline);
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectScholarship(s)}
                  className="text-left bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 transition-colors cursor-pointer group"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-white/5">
                    <img
                      src={s.heroImage}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#3B3BFF]/60 via-transparent to-transparent"></div>
                  </div>
                  <div className="p-5">
                    <p className="font-arc-mono text-xs text-white/85 mb-2">
                      {s.studyLevels[0]} · {s.providerName}
                    </p>
                    <h3 className="font-headline-sm text-white text-lg mb-2 group-hover:text-white/90">
                      {s.title}
                    </h3>
                    <p className="font-body-default text-white/85 text-sm line-clamp-2 mb-4">
                      {s.overview}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-arc-mono text-xs text-white/85">
                        {deadlineInfo.isClosed
                          ? 'Cycle closed'
                          : deadlineInfo.daysRemaining === 0
                            ? 'Closes today'
                            : `${deadlineInfo.daysRemaining} days left`}
                      </span>
                      <span className="material-symbols-outlined text-white/70 group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Conversion band */}
      <section className="w-full bg-[#1A1A8C] text-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 lg:px-12 py-16 lg:py-24 text-center">
          <h2 className="font-arc-display text-white text-3xl md:text-5xl mb-6">
            Ready to find your funding?
          </h2>
          <p className="font-body-lead text-white/80 max-w-2xl mx-auto mb-10">
            Build your profile once. Get matched to verified scholarships worldwide.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={onOpenProfileBuilder} className="arc-btn-primary">
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              <span>Get Started</span>
            </button>
            <button onClick={() => onNavigate('explore')} className="arc-btn-secondary">
              <span>Explore Scholarships</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};