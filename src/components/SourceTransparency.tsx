import React, { useEffect, useState } from 'react';
import { IngestionSource } from '../types';
import { getSourcesFromDatabase } from '../services/catalogueService';
import { Container } from './ui/Container';
import { Icon } from './ui/Icon';
import { Badge } from './ui/Badge';
import { ErrorPanel } from './ui/ErrorPanel';
import { OfficialRedirectModal } from './OfficialRedirectModal';

export const SourceTransparency: React.FC = () => {
  const [sources, setSources] = useState<IngestionSource[]>([]);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<IngestionSource | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      const res = await getSourcesFromDatabase();
      if (isMounted) {
        setSources(res.data);
        setIsDatabaseConnected(res.fromDatabase);
        setLoadError(res.error ?? null);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalRecords = sources.reduce((sum, s) => sum + (s.scholarshipCount ?? 0), 0);
  const redirectDestination = selectedSource
    ? {
        title: selectedSource.name,
        providerName: selectedSource.originAgency,
        url: selectedSource.provenanceUrl,
        sourceDomain: '',
        sourceName: selectedSource.name,
        lastVerified: selectedSource.lastIngested ?? undefined,
      }
    : null;

  return (
    <div className="w-full max-w-full">
      <div className="border-b border-hairline bg-paper">
        <Container className="py-10 md:py-14">
          <p className="font-data text-[11px] uppercase tracking-[0.14em] text-ink-muted">Provenance</p>
          <h1 className="mt-2 font-ui-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">
            Sources &amp; verification
          </h1>
          <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-muted">
            This page lists source metadata returned by ScholarFind&apos;s catalogue API, including source URLs and
            ingestion dates when available. It does not confirm a provider&apos;s current availability or grant
            permission to reuse its content. Catalogue changes are managed server-side; this page is read-only.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone={isDatabaseConnected ? 'ok' : 'warn'}>
              {isDatabaseConnected ? 'Live registry' : 'Offline catalogue'}
            </Badge>
            <span className="text-xs text-ink-muted">
              {sources.length} sources · {totalRecords} indexed records
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {loading ? (
          <p className="text-sm text-ink-muted">Loading sources…</p>
        ) : (
          <>
            {loadError && !sources.length ? (
              <ErrorPanel title="Source registry unavailable" message={loadError} />
            ) : null}
            {loadError && sources.length ? (
              <ErrorPanel title="Offline source metadata" message={loadError} />
            ) : null}
            <ul className="space-y-4">
              {sources.map((source) => (
                <li key={source.id} className="rounded-card border border-hairline bg-paper-raised p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {source.flag ? <span className="text-xl" aria-hidden>{source.flag}</span> : null}
                        <h2 className="font-ui-display text-base font-semibold text-ink">{source.name}</h2>
                        <Badge tone={source.status === 'active' ? 'ok' : 'warn'}>{source.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">
                        {source.originAgency} · {source.country}
                      </p>
                      <dl className="mt-3 grid grid-cols-1 gap-1 text-xs text-ink-muted sm:grid-cols-2">
                        <div className="flex justify-between gap-2">
                          <dt className="shrink-0">Records</dt>
                          <dd className="font-semibold text-ink">{source.scholarshipCount}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="shrink-0">Last audited</dt>
                          <dd className="font-data text-ink">
                            {source.lastIngested?.slice(0, 10) ?? 'Not recorded'}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:col-span-2">
                          <dt className="shrink-0">Access method</dt>
                          <dd className="truncate text-ink">{source.accessMethod}</dd>
                        </div>
                      </dl>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSource(source)}
                      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-control border border-hairline bg-paper-raised px-3 text-xs font-semibold text-sapphire transition-colors hover:bg-paper-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
                    >
                      View origin source
                      <Icon name="external" size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <section className="mt-10 rounded-card border border-hairline bg-paper-raised p-6">
              <h2 className="font-ui-display text-base font-semibold text-ink">How records enter the catalogue</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Records are collected and validated server-side against each provider&apos;s official charter. The
                client application can only read the verified catalogue and audit registry; it cannot create,
                modify, or delete records.
              </p>
            </section>
          </>
        )}
      </Container>
      {redirectDestination ? (
        <OfficialRedirectModal
          destination={redirectDestination}
          destinationLabel="official source"
          isOpen
          onClose={() => setSelectedSource(null)}
        />
      ) : null}
    </div>
  );
};
