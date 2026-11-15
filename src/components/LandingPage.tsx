import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SCHOLARSHIPS_DATA } from '../data/scholarshipsData';
import { getDeadlineDisplay } from '../services/databaseService';
import { Container } from './ui/Container';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Card } from './ui/Card';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onOpenProfileBuilder: () => void;
}

const HOW_IT_WORKS = [
  {
    icon: 'checklist' as const,
    title: 'Answer four questions',
    body: 'Citizenship, academics, goals, and target regions. Takes about two minutes.',
  },
  {
    icon: 'verified' as const,
    title: 'See the exact rule',
    body: 'Every verdict shows the eligibility rule that produced it, plus what you are missing.',
  },
  {
    icon: 'external' as const,
    title: 'Apply at the official page',
    body: 'We never host applications. Every link is checked against its audited source domain.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenProfileBuilder,
}) => {
  const navigate = useNavigate();

  const featuredScholarships = useMemo(() => {
    return [...SCHOLARSHIPS_DATA]
      .sort((a, b) => new Date(a.applicationDeadline).getTime() - new Date(b.applicationDeadline).getTime())
      .slice(0, 3);
  }, []);

  const counts = useMemo(() => {
    const countries = new Set(SCHOLARSHIPS_DATA.flatMap((s) => s.destinationCountries));
    const providers = new Set(SCHOLARSHIPS_DATA.map((s) => s.providerName));
    return { records: SCHOLARSHIPS_DATA.length, countries: countries.size, providers: providers.size };
  }, []);

  const handleHeroSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const degree = (form.elements.namedItem('degree') as HTMLSelectElement).value;
    const field = (form.elements.namedItem('field') as HTMLInputElement).value.trim();
    const params = new URLSearchParams();
    if (degree) params.set('degree', degree);
    if (field) params.set('q', field);
    navigate(`/explore${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="flex w-full max-w-full flex-col overflow-x-hidden min-w-0">
      {/* Announcement bar */}
      <div className="w-full bg-arc-indigo text-white">
        <Container className="flex items-center justify-center gap-2 py-2.5 text-center">
          <span className="font-data text-xs text-white/90">Curated verified catalogue</span>
          <span className="hidden text-white/70 sm:inline">—</span>
          <span className="hidden text-sm text-white/90 sm:inline">
            {counts.records} opportunities across {counts.countries} countries, from {counts.providers} providers.
          </span>
        </Container>
      </div>

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-arc-blue-textured text-white">
        <Container className="pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h1 className="font-arc-display text-4xl leading-tight text-white sm:text-5xl md:text-6xl">
              &ldquo;Your future deserves to be funded.&rdquo;
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">
              One profile. Opportunities worldwide. A clearer path to apply. Discover curated, verified funding
              from trusted universities, foundations, and governments without the guesswork.
            </p>

            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Button variant="primary" size="lg" onClick={onOpenProfileBuilder} className="bg-white text-royal hover:bg-white/90">
                <Icon name="arrowRight" size={16} />
                Get Started
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => onNavigate('explore')}
                className="border-white/35 bg-arc-indigo text-white hover:bg-[#141466]"
              >
                Explore Scholarships
              </Button>
            </div>

            <form
              onSubmit={handleHeroSearch}
              className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:grid-cols-3 sm:p-5"
            >
              <select
                name="degree"
                defaultValue="masters"
                aria-label="Degree level"
                className="rounded-control bg-white px-3 py-2.5 text-sm text-arc-indigo focus:outline-none focus-visible:ring-2 focus:ring-white/60"
              >
                <option value="bachelors">Bachelor&apos;s</option>
                <option value="masters">Master&apos;s</option>
                <option value="phd">PhD / Doctoral</option>
              </select>
              <input
                name="field"
                type="text"
                placeholder="Field of study"
                aria-label="Field of study"
                className="rounded-control bg-white px-3 py-2.5 text-sm text-arc-indigo placeholder:text-ink-muted focus:outline-none focus-visible:ring-2 focus:ring-white/60"
              />
              <button
                type="submit"
                className="rounded-control bg-white px-3 py-2.5 font-data text-xs font-bold uppercase tracking-[0.05em] text-royal transition-colors hover:bg-white/90"
              >
                Find Scholarships
              </button>
            </form>
          </div>
        </Container>

        <svg className="arc-wave-divider text-cream" viewBox="0 0 1440 24" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,12 C240,24 480,0 720,12 C960,24 1200,0 1440,12 L1440,24 L0,24 Z" fill="currentColor" />
        </svg>
      </section>

      {/* How it works */}
      <section className="w-full bg-cream">
        <Container className="py-16 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-data text-xs uppercase tracking-[0.14em] text-ink-muted">How it works</p>
            <h2 className="mt-2 font-arc-display text-3xl text-arc-indigo md:text-4xl">
              Three steps, no guesswork
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <Card key={step.title} className="text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#DCE1FF] text-sapphire">
                  <Icon name={step.icon} size={20} />
                </span>
                <h3 className="mt-4 font-ui-display text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured records */}
      <section className="w-full bg-arc-blue-textured text-white">
        <Container className="py-16 lg:py-24">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-data text-xs text-white/85">Featured</p>
              <h2 className="font-arc-display text-3xl text-white md:text-4xl">Scholarships worth your time</h2>
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => onNavigate('explore')}
              className="self-start border-white/35 bg-arc-indigo text-white hover:bg-[#141466] md:self-auto"
            >
              View all
              <Icon name="arrowRight" size={15} />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featuredScholarships.map((scholarship) => {
              const deadline = getDeadlineDisplay(scholarship.applicationDeadline);
              return (
                <button
                  key={scholarship.id}
                  type="button"
                  onClick={() => navigate(`/scholarship/${scholarship.id}`)}
                  className="group flex flex-col overflow-hidden rounded-card border border-white/20 bg-white/10 text-left transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-white/5">
                    <img
                      src={scholarship.heroImage}
                      alt={scholarship.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-royal/60 via-transparent to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-data text-xs text-white/85">
                      {scholarship.studyLevels[0]} · {scholarship.providerName}
                    </p>
                    <h3 className="mt-2 font-ui-display text-lg font-semibold text-white group-hover:text-white/90">
                      {scholarship.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/85">{scholarship.overview}</p>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span className="font-data text-xs text-white/85">
                        {deadline.isClosed
                          ? 'Cycle closed'
                          : deadline.daysRemaining === 0
                            ? 'Closes today'
                            : `${deadline.daysRemaining} days left`}
                      </span>
                      <Icon name="arrowRight" size={16} className="text-white/70 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Conversion band */}
      <section className="w-full bg-arc-indigo text-white">
        <Container className="py-16 text-center lg:py-24">
          <h2 className="font-arc-display text-3xl text-white md:text-5xl">Ready to find your funding?</h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80">
            Build your profile once. Get matched to verified scholarships worldwide.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="primary" size="lg" onClick={onOpenProfileBuilder} className="bg-white text-royal hover:bg-white/90">
              <Icon name="arrowRight" size={16} />
              Get Started
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('explore')}
              className="border-white/35 bg-transparent text-white hover:bg-white/10"
            >
              Explore Scholarships
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
};
