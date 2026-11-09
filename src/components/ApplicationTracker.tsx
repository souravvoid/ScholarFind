import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrackerStatus } from '../types';
import { SCHOLARSHIPS_DATA } from '../data/scholarshipsData';
import { OfficialRedirectModal } from './OfficialRedirectModal';
import { getDeadlineDisplay } from '../services/databaseService';
import { Container } from './ui/Container';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { Link } from 'react-router-dom';

const STAGES: { id: TrackerStatus; label: string }[] = [
  { id: 'interested', label: 'Interested' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready' },
  { id: 'applied', label: 'Applied' },
];

export const ApplicationTracker: React.FC<{ onExplore: () => void }> = ({ onExplore }) => {
  const navigate = useNavigate();
  const { savedScholarships, updateTrackerStatus, unsaveScholarship } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | TrackerStatus>('all');
  const [redirectTarget, setRedirectTarget] = useState<(typeof SCHOLARSHIPS_DATA)[number] | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>('');

  const filteredItems = savedScholarships.filter((item) => activeTab === 'all' || item.status === activeTab);

  const counts = STAGES.reduce<Record<string, number>>((acc, stage) => {
    acc[stage.id] = savedScholarships.filter((i) => i.status === stage.id).length;
    return acc;
  }, {});

  const dueSoon = savedScholarships.filter((i) => {
    const d = getDeadlineDisplay(i.deadline);
    return !d.isClosed && d.daysRemaining <= 14;
  }).length;

  if (savedScholarships.length === 0) {
    return (
      <div className="w-full max-w-full">
        <div className="border-b border-hairline bg-paper">
          <Container className="py-10 md:py-14">
            <p className="font-data text-[11px] uppercase tracking-[0.14em] text-ink-muted">Tracker</p>
            <h1 className="mt-2 font-ui-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">
              Saved &amp; in progress
            </h1>
          </Container>
        </div>
        <Container className="py-16">
          <EmptyState
            icon="saved"
            title="Nothing saved yet"
            description="Save scholarships from the catalogue and they will appear here with deadlines, stages, and checklists."
            action={
              <Button variant="primary" size="md" onClick={onExplore}>
                Browse the catalogue
              </Button>
            }
          />
        </Container>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full">
      <div className="border-b border-hairline bg-paper">
        <Container className="py-10 md:py-14">
          <p className="font-data text-[11px] uppercase tracking-[0.14em] text-ink-muted">Tracker</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-ui-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">
                Saved &amp; in progress
              </h1>
              <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-muted">
                {savedScholarships.length} saved · {dueSoon} due within 14 days. Saved on this
                device.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Tracker stages">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
              className={`min-h-9 rounded-chip border px-3 text-xs font-semibold transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire ${
                activeTab === 'all'
                  ? 'border-sapphire bg-[#DCE1FF] text-sapphire'
                  : 'border-hairline bg-paper text-ink-muted hover:bg-paper-sunken'
              }`}
            >
              All ({savedScholarships.length})
            </button>
            {STAGES.map((stage) => (
              <button
                key={stage.id}
                type="button"
                role="tab"
                aria-selected={activeTab === stage.id}
                onClick={() => setActiveTab(stage.id)}
                className={`min-h-9 rounded-chip border px-3 text-xs font-semibold transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire ${
                  activeTab === stage.id
                    ? 'border-sapphire bg-[#DCE1FF] text-sapphire'
                    : 'border-hairline bg-paper text-ink-muted hover:bg-paper-sunken'
                }`}
              >
                {stage.label} ({counts[stage.id]})
              </button>
            ))}
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <ul className="space-y-4">
          {filteredItems.map((item) => {
            const fullRecord = SCHOLARSHIPS_DATA.find((s) => s.id === item.scholarshipId);
            const deadline = getDeadlineDisplay(item.deadline);
            const requiredDocs = fullRecord?.requiredDocuments ?? [];
            const isEditing = editingNotesId === item.scholarshipId;

            return (
              <li key={item.id} className="rounded-card border border-hairline bg-paper-raised p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    {fullRecord ? (
                      <Link
                        to={`/scholarship/${fullRecord.id}`}
                        className="font-ui-display text-lg font-semibold leading-snug text-ink hover:text-sapphire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
                      >
                        {item.scholarshipTitle}
                      </Link>
                    ) : (
                      <div>
                        <p className="font-ui-display text-lg font-semibold leading-snug text-ink">
                          {item.scholarshipTitle}
                        </p>
                        <p className="mt-1 text-xs text-warn-text">
                          This record is no longer in the current catalogue. Only its saved details remain.
                        </p>
                      </div>
                    )}
                    <p className="mt-1 text-sm text-ink-muted">
                      {item.provider} · {item.destination}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                      <span className="font-data">{item.awardValue}</span>
                      <span aria-hidden>·</span>
                      <span
                        className={`font-data ${deadline.isClosed ? 'text-ink-muted' : deadline.daysRemaining <= 14 ? 'text-warn-text' : 'text-ink-muted'}`}
                      >
                        {deadline.isClosed
                          ? 'Cycle closed'
                          : deadline.daysRemaining === 0
                            ? 'Closes today'
                            : `${deadline.daysRemaining} days left`}
                      </span>
                      <span aria-hidden>·</span>
                      <span className="font-data">{item.deadline}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {fullRecord ? (
                      <button
                        type="button"
                        onClick={() => setRedirectTarget(fullRecord)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-hairline bg-paper-raised px-3 text-xs font-semibold text-sapphire transition-colors hover:bg-paper-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
                      >
                        Apply
                        <Icon name="external" size={14} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void unsaveScholarship(item.scholarshipId)}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-bad-border bg-paper-raised px-3 text-xs font-semibold text-bad-text transition-colors hover:bg-bad-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex items-center gap-2 text-sm text-ink-muted">
                    Stage
                    <select
                      value={item.status}
                      onChange={(e) => void updateTrackerStatus(item.scholarshipId, e.target.value as TrackerStatus)}
                      className="min-h-9 rounded-control border border-hairline bg-paper-raised px-3 text-xs font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
                    >
                      {STAGES.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {requiredDocs.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-ink">Required documents</p>
                    <ul className="mt-2 space-y-1">
                      {requiredDocs.map((doc, idx) => {
                        const done = item.completedDocs.includes(doc);
                        return (
                          <li key={idx}>
                            <label className="flex items-start gap-2 text-xs text-ink-muted">
                              <input
                                type="checkbox"
                                checked={done}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...item.completedDocs, doc]
                                    : item.completedDocs.filter((d) => d !== doc);
                                  void updateTrackerStatus(item.scholarshipId, item.status, item.notes, next);
                                }}
                                className="mt-0.5 h-4 w-4 rounded border-hairline text-sapphire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
                              />
                              <span className={done ? 'line-through text-ink-muted' : 'text-ink'}>{doc}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-4">
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        rows={3}
                        className="w-full rounded-control border border-hairline bg-paper-raised px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => {
                            void updateTrackerStatus(item.scholarshipId, item.status, notesDraft, item.completedDocs);
                            setEditingNotesId(null);
                          }}
                        >
                          Save notes
                        </Button>
                        <Button
                          variant="ghost"
                          size="md"
                          onClick={() => setEditingNotesId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setNotesDraft(item.notes);
                        setEditingNotesId(item.scholarshipId);
                      }}
                      className="text-xs font-semibold text-sapphire hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
                    >
                      {item.notes ? 'Edit notes' : 'Add notes'}
                    </button>
                  )}
                  {!isEditing && item.notes ? (
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">{item.notes}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </Container>

      {redirectTarget ? (
        <OfficialRedirectModal
          scholarship={redirectTarget}
          isOpen={!!redirectTarget}
          onClose={() => setRedirectTarget(null)}
        />
      ) : null}
    </div>
  );
};
