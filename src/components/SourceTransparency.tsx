import React, { useEffect, useState } from 'react';
import { IngestionSource } from '../types';
import { INGESTION_SOURCES } from '../data/sourcesData';
import { getSourcesFromDatabase } from '../services/databaseService';
import { Container } from './ui/Container';
import { Icon } from './ui/Icon';
import { Badge } from './ui/Badge';

export const SourceTransparency: React.FC = () => {
  const [sources, setSources] = useState<IngestionSource[]>(INGESTION_SOURCES);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      const res = await getSourcesFromDatabase();
      if (isMounted) {
        setSources(res.data);
        setIsDatabaseConnected(res.fromDatabase);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalRecords = sources.reduce((sum, s) => sum + (s.scholarshipCount ?? 0), 0);

  return (
    <div className="w-full max-w-full">
      <div className="border-b border-hairline bg-paper">
        <Container className="py-10 md:py-14">
          <p className="font-data text-[11px] uppercase tracking-[0.14em] text-ink-muted">Provenance</p>
          <h1 className="mt-2 font-ui-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">
            Sources &amp; verification
          </h1>
          <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-muted">
            ScholarFind is an independent index. Every record links to its official source and shows the date it
            was last audited. Catalogue writes happen server-side; this client can only read.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone={isDatabaseConnected ? 'ok' : 'warn'}>
              {isDatabaseConnected ? 'Live registry' : 'Cached registry'}
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
            <ul className="space-y-4">
              {sources.map((source) => (
                <li key={source.id} className="rounded-card border border-hairline bg-paper-raised p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl" aria-hidden>
                          {source.flag}
                        </span>
                        <h2 className="font-ui-display text-base font-semibold text-ink">{source.name}</h2>
                        <Badge tone="ok">{source.status}</Badge>
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
                          <dd className="font-data text-ink">{source.lastIngested.slice(0, 10)}</dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:col-span-2">
                          <dt className="shrink-0">Access method</dt>
                          <dd className="truncate text-ink">{source.accessMethod}</dd>
                        </div>
                      </dl>
                      <p className="mt-3 text-xs leading-relaxed text-ink-muted">{source.auditPrinciples}</p>
                    </div>
                    <a
                      href={source.provenanceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-control border border-hairline bg-paper-raised px-3 text-xs font-semibold text-sapphire transition-colors hover:bg-paper-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
                    >
                      View origin source
                      <Icon name="external" size={14} />
                    </a>
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
    </div>
  );
};
