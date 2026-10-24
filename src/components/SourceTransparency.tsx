import React, { useState, useEffect } from 'react';
import { INGESTION_SOURCES } from '../data/sourcesData';
import { IngestionSource } from '../types';
import { getSourcesFromDatabase, triggerLiveSourceSync } from '../services/databaseService';

export const SourceTransparency: React.FC = () => {
  const [sources, setSources] = useState<IngestionSource[]>(INGESTION_SOURCES);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{ [sourceId: string]: string }>({});
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch actual sources from Firestore database on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSources() {
      setLoading(true);
      const res = await getSourcesFromDatabase();
      if (isMounted) {
        setSources(res.data);
        setIsDatabaseConnected(res.fromDatabase);
        setLoading(false);
      }
    }
    loadSources();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRunIngestion = async (sourceId: string) => {
    setRunningJobId(sourceId);
    setSyncFeedback(prev => ({ ...prev, [sourceId]: 'Contacting official registry & executing pipeline...' }));

    const result = await triggerLiveSourceSync(sourceId);

    if (result.success) {
      setSources(prev => prev.map(s => {
        if (s.id === sourceId) {
          return {
            ...s,
            lastIngested: result.timestamp,
            status: 'verified'
          };
        }
        return s;
      }));
      setSyncFeedback(prev => ({
        ...prev,
        [sourceId]: `Audit verified! Stored in Firestore (Log: ${result.logId?.slice(0, 8)}...)`
      }));
    } else {
      setSyncFeedback(prev => ({
        ...prev,
        [sourceId]: `Sync failed: ${result.error || 'Connection error'}`
      }));
    }
    setRunningJobId(null);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden pt-8 pb-20 min-w-0">
      <div className="w-full max-w-[1280px] mx-auto px-3.5 sm:px-4 md:px-8 lg:px-12 min-w-0">
        {/* Header */}
        <div className="mb-8 sm:mb-10 text-left w-full min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eeeeed] text-[#434655] font-label-sm text-[11px] uppercase tracking-wider mb-2 font-semibold max-w-full">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDatabaseConnected ? 'bg-[#047857]' : 'bg-[#b45309]'}`}></span>
            <span className="truncate">{isDatabaseConnected ? 'Live Firestore Database Audit Registry' : 'Offline / Cached Mode'}</span>
          </div>
          <h1 className="font-headline-lg text-[#1a1a1e] tracking-tight mb-2 break-words">
            Source Transparency &amp; Ingestion Pipeline
          </h1>
          <p className="font-body-lead text-[#6b7280] max-w-3xl">
            ScholarFind operates under strict academic audit principles. We do not permit commercial lead generators, sponsored listings, or unverified scraper data. Every record maps directly to an audited public government gazette or university senate trust.
          </p>
        </div>

        {/* 10 Sources Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 w-full min-w-0">
          {sources.map((src) => {
            const isRunning = runningJobId === src.id;

            return (
              <div
                key={src.id}
                className="bg-white rounded-2xl p-4 sm:p-6 border border-[#e5e7eb] shadow-xs hover:shadow-md transition-all flex flex-col justify-between w-full min-w-0"
              >
                <div className="w-full min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3 mb-3 w-full min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{src.flag}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-title text-base text-[#1a1a1e] truncate">
                          {src.name}
                        </h3>
                        <span className="font-caption text-xs text-[#6b7280] block truncate">
                          {src.originAgency} • {src.country}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] text-[11px] font-semibold self-start shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
                      {src.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-[#434655] bg-[#f9f9f8] p-3 rounded-xl border border-[#e5e7eb] mb-4 w-full min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                      <span className="text-[#6b7280] shrink-0">Adapter Module:</span>
                      <span className="font-mono text-[#0037b0] text-[11px] break-all">{src.adapterModule}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                      <span className="text-[#6b7280] shrink-0">Access Method:</span>
                      <span className="font-medium text-[#1a1a1e] truncate">{src.accessMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">Verified Endowments:</span>
                      <span className="font-bold text-[#1a1a1e]">{src.scholarshipCount} listings</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">Last Ingested:</span>
                      <span className="text-[#6b7280]">{src.lastIngested.slice(0, 16).replace('T', ' ')} UTC</span>
                    </div>
                  </div>

                  <p className="font-caption text-xs text-[#6b7280] leading-relaxed mb-4 break-words">
                    <strong>Audit Protocol:</strong> {src.auditPrinciples}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#e5e7eb] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 w-full min-w-0">
                  <a
                    href={src.provenanceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center sm:justify-start gap-1 text-xs text-[#0037b0] hover:underline min-h-[44px] sm:min-h-0 py-2 sm:py-0"
                  >
                    <span>View Origin Source</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>

                  <button
                    onClick={() => handleRunIngestion(src.id)}
                    disabled={isRunning}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-[#f3f4f3] hover:bg-[#e8e8e7] text-xs font-semibold text-[#1a1a1e] transition-colors cursor-pointer disabled:opacity-60 min-h-[44px] sm:min-h-0"
                  >
                    <span className={`material-symbols-outlined text-[15px] ${isRunning ? 'animate-spin text-[#0037b0]' : 'text-[#6b7280]'}`}>
                      sync
                    </span>
                    <span>{isRunning ? 'Auditing feed...' : 'Audit & Refresh'}</span>
                  </button>
                </div>

                {syncFeedback[src.id] && (
                  <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] text-[11px] font-caption flex items-center gap-1.5 animate-in fade-in min-w-0">
                    <span className="material-symbols-outlined text-[14px] shrink-0">check_circle</span>
                    <span className="truncate">{syncFeedback[src.id]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Technical Architecture & Audit Principles Box */}
        <div className="bg-white rounded-2xl p-8 border border-[#e5e7eb] shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dce2f3] text-[#0037b0] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[24px]">architecture</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-lg text-[#1a1a1e]">
                ScholarFind Institutional Architecture
              </h2>
              <p className="font-caption text-xs text-[#6b7280]">
                Built for radical transparency, data sovereignty, and deterministic criteria evaluation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2">
              <h4 className="font-caption-strong text-sm text-[#1a1a1e]">
                1. Modular Ingestion Pipeline
              </h4>
              <p className="font-body-default text-xs text-[#6b7280] leading-relaxed">
                Python 3.12 with Pydantic validation schemas. Each collector runs in an isolated sandbox with exponential backoff, rate limits, robots.txt compliance, and idempotent upserts keyed on normalized official IDs.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-caption-strong text-sm text-[#1a1a1e]">
                2. Explainable Rule Engine
              </h4>
              <p className="font-body-default text-xs text-[#6b7280] leading-relaxed">
                Replaces black-box "AI guessing" with mathematical Boolean evaluation. Every criterion is classified as mandatory, optional, or informational, citing the exact clause from the provider's official endowment charter.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-caption-strong text-sm text-[#1a1a1e]">
                3. Zero-Trust Security &amp; ABAC
              </h4>
              <p className="font-body-default text-xs text-[#6b7280] leading-relaxed">
                Private user profiles, saved records, and tracker entries are protected with Firebase Firestore Security Rules and Attribute-Based Access Control. No candidate data is accessible across user boundaries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
