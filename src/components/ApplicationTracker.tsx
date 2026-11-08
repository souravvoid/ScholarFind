import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrackerStatus, Scholarship } from '../types';
import { SCHOLARSHIPS_DATA } from '../data/scholarshipsData';
import { OfficialRedirectModal } from './OfficialRedirectModal';
import { getDeadlineDisplay } from '../services/databaseService';

interface ApplicationTrackerProps {
  onExplore: () => void;
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({ onExplore }) => {
  const navigate = useNavigate();
  const { savedScholarships, updateTrackerStatus, unsaveScholarship } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | TrackerStatus>('all');
  const [selectedScholarshipForRedirect, setSelectedScholarshipForRedirect] = useState<Scholarship | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  const filteredItems = savedScholarships.filter(item => {
    if (activeTab === 'all') return true;
    return item.status === activeTab;
  });

  const stages: { id: TrackerStatus; label: string; count: number }[] = [
    { id: 'interested', label: 'Interested', count: savedScholarships.filter(s => s.status === 'interested').length },
    { id: 'preparing', label: 'Preparing Docs', count: savedScholarships.filter(s => s.status === 'preparing').length },
    { id: 'ready', label: 'Ready to Apply', count: savedScholarships.filter(s => s.status === 'ready').length },
    { id: 'applied', label: 'Applied Directly', count: savedScholarships.filter(s => s.status === 'applied').length },
  ];

  const handleToggleDoc = (scholarshipId: string, docName: string, currentDocs: string[]) => {
    const updated = currentDocs.includes(docName)
      ? currentDocs.filter(d => d !== docName)
      : [...currentDocs, docName];
    const item = savedScholarships.find(s => s.scholarshipId === scholarshipId);
    if (item) {
      updateTrackerStatus(scholarshipId, item.status, undefined, updated);
    }
  };

  const saveNotes = (scholarshipId: string, currentStatus: TrackerStatus) => {
    updateTrackerStatus(scholarshipId, currentStatus, tempNotes);
    setEditingNotesId(null);
  };

  return (
    <div className="w-full max-w-full pt-8 pb-20 min-w-0">
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 min-w-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 w-full min-w-0">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eeeeed] text-[#434655] font-label-sm text-[11px] uppercase tracking-wider mb-2 font-semibold max-w-full min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8] shrink-0"></span>
              <span className="truncate">Personal Student Dossier</span>
            </div>
            <h1 className="font-headline-lg text-[#1a1a1e] tracking-tight break-words">
              Application Tracker &amp; Saved Endowments
            </h1>
            <p className="font-body-lead text-[#6b7280]">
              Keep track of document readiness, personal deadlines, and official provider submissions.
            </p>
          </div>

          <button
            onClick={onExplore}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0037b0] text-white font-caption-strong text-xs hover:bg-[#2563eb] transition-all cursor-pointer shadow-xs shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Discover More Scholarships</span>
          </button>
        </div>

        {/* Stage Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-[#e5e7eb] pb-3 w-full min-w-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-caption-strong text-xs transition-colors cursor-pointer min-w-0 ${
              activeTab === 'all'
                ? 'bg-[#1d4ed8] text-white shadow-xs'
                : 'bg-white border border-[#e5e7eb] text-[#1a1a1e] hover:bg-[#f3f4f3]'
            }`}
          >
            All Saved ({savedScholarships.length})
          </button>
          {stages.map((st) => (
            <button
              key={st.id}
              onClick={() => setActiveTab(st.id)}
              className={`px-4 py-2 rounded-lg font-caption-strong text-xs transition-colors cursor-pointer flex items-center gap-2 min-w-0 ${
                activeTab === st.id
                  ? 'bg-[#1d4ed8] text-white shadow-xs'
                  : 'bg-white border border-[#e5e7eb] text-[#1a1a1e] hover:bg-[#f3f4f3]'
              }`}
            >
              <span className="truncate">{st.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] shrink-0 ${
                activeTab === st.id ? 'bg-white/20 text-white' : 'bg-[#eeeeed] text-[#6b7280]'
              }`}>
                {st.count}
              </span>
            </button>
          ))}
        </div>

        {/* Saved List */}
        {filteredItems.length === 0 ? (
          <div className="p-8 sm:p-16 text-center bg-white rounded-2xl border border-[#e5e7eb] shadow-xs w-full min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-[#dce2f3]/50 text-[#0037b0] flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">bookmark_border</span>
            </div>
            <h3 className="font-headline-sm text-lg text-[#1a1a1e] mb-1">
              No scholarships in this stage
            </h3>
            <p className="font-body-default text-sm text-[#6b7280] mb-6 max-w-md mx-auto">
              Save verified scholarships from the registry to track required application documents and deadlines.
            </p>
            <button
              onClick={onExplore}
              className="px-6 py-2.5 rounded-full bg-[#1d4ed8] text-white font-caption-strong text-xs shadow-xs hover:bg-[#2563eb] cursor-pointer"
            >
              Explore Scholarship Registry
            </button>
          </div>
        ) : (
          <div className="space-y-4 w-full min-w-0">
            {filteredItems.map((item) => {
              const fullRecord = SCHOLARSHIPS_DATA.find(s => s.id === item.scholarshipId);
              const requiredDocs = fullRecord?.requiredDocuments || [
                'Academic Transcripts (Certified)',
                'Personal Statement / Statement of Purpose',
                'Letters of Recommendation (2)',
                'Curriculum Vitae'
              ];
              const completedCount = item.completedDocs?.length || 0;
              const readinessPercent = Math.round((completedCount / requiredDocs.length) * 100);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 sm:p-6 border border-[#e5e7eb] shadow-xs hover:shadow-md transition-shadow w-full min-w-0 overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 w-full min-w-0">
                    {/* Scholarship info */}
                    <div className="space-y-3 flex-1 w-full min-w-0">
                      <div className="flex flex-wrap items-center gap-2 w-full min-w-0">
                        <span className="font-caption text-xs text-[#6b7280] truncate max-w-full">
                          {item.provider} • {item.destination}
                        </span>
                        <span className="text-[#e5e7eb] hidden sm:inline">•</span>
                        {(() => {
                          const deadlineInfo = getDeadlineDisplay(item.deadline);
                          return (
                            <span className={`font-caption-strong text-xs flex items-center gap-1 shrink-0 ${deadlineInfo.isClosed ? 'text-[#6b7280]' : 'text-[#ba1a1a]'}`}>
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              <span>{item.deadline} {deadlineInfo.isClosed ? '• Closed' : `(${deadlineInfo.daysRemaining}d left)`}</span>
                            </span>
                          );
                        })()}
                      </div>

                      <h3 
                        onClick={() => fullRecord && navigate(`/scholarship/${fullRecord.id}`)}
                        className="font-title text-base sm:text-lg text-[#1a1a1e] hover:text-[#0037b0] transition-colors cursor-pointer break-words min-w-0"
                      >
                        {item.scholarshipTitle}
                      </h3>

                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#f3f4f3] text-xs font-semibold text-[#1a1a1e] max-w-full min-w-0">
                        <span className="shrink-0">Award Value:</span>
                        <span className="text-[#0037b0] truncate">{item.awardValue}</span>
                      </div>

                      {/* Status Selector */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 pt-2 w-full min-w-0">
                        <span className="font-caption-strong text-xs text-[#6b7280] shrink-0">Your Progress:</span>
                        <select
                          value={item.status}
                          onChange={(e) => updateTrackerStatus(item.scholarshipId, e.target.value as TrackerStatus)}
                          className="px-3 py-1.5 rounded-lg bg-[#f3f4f3] border border-[#e5e7eb] text-xs font-semibold text-[#1a1a1e] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1d4ed8] cursor-pointer min-w-0 max-w-full"
                        >
                          <option value="interested">Interested</option>
                          <option value="preparing">Preparing Documents</option>
                          <option value="ready">Ready to Apply</option>
                          <option value="applied">Applied Directly</option>
                        </select>
                      </div>

                      {/* Personal Notes */}
                      <div className="pt-2 w-full min-w-0">
                        {editingNotesId === item.scholarshipId ? (
                          <div className="space-y-2 w-full min-w-0">
                            <textarea
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="Add personal notes, essay drafts, or interview dates..."
                              className="w-full p-2.5 rounded-lg bg-[#f9f9f8] border border-[#e5e7eb] text-xs text-[#1a1a1e] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1d4ed8] min-w-0"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveNotes(item.scholarshipId, item.status)}
                                className="px-3 py-1 rounded bg-[#0037b0] text-white text-xs font-semibold cursor-pointer"
                              >
                                Save Note
                              </button>
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="px-3 py-1 rounded bg-[#eeeeed] text-[#1a1a1e] text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 text-xs text-[#6b7280] w-full min-w-0">
                            <span className="material-symbols-outlined text-[15px] mt-0.5 shrink-0">edit_note</span>
                            <span className="flex-1 italic break-words min-w-0">
                              {item.notes || 'No personal notes added yet.'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingNotesId(item.scholarshipId);
                                setTempNotes(item.notes || '');
                              }}
                              className="text-[#0037b0] hover:underline font-semibold shrink-0 cursor-pointer"
                            >
                              Edit Note
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document Readiness Checklist */}
                    <div className="w-full lg:w-80 p-4 rounded-xl bg-[#f9f9f8] border border-[#e5e7eb] space-y-3 min-w-0">
                      <div className="flex items-center justify-between w-full min-w-0">
                        <span className="font-caption-strong text-xs text-[#1a1a1e] truncate pr-2">
                          Document Readiness
                        </span>
                        <span className="font-caption-strong text-xs text-[#047857] shrink-0">
                          {readinessPercent}% ({completedCount}/{requiredDocs.length})
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-[#e2e2e2] h-1.5 rounded-full overflow-hidden min-w-0">
                        <div 
                          className="bg-[#047857] h-full rounded-full transition-all duration-300"
                          style={{ width: `${readinessPercent}%` }}
                        />
                      </div>

                      {/* Check items */}
                      <div className="space-y-1.5 pt-1 w-full min-w-0">
                        {requiredDocs.map((docItem, idx) => {
                          const isDone = item.completedDocs?.includes(docItem);
                          return (
                            <label 
                              key={idx}
                              onClick={() => handleToggleDoc(item.scholarshipId, docItem, item.completedDocs || [])}
                              className="flex items-start gap-2 text-xs text-[#434655] cursor-pointer hover:text-[#1a1a1e] select-none w-full min-w-0"
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                readOnly
                                className="mt-0.5 w-3.5 h-3.5 rounded text-[#047857] accent-[#047857] cursor-pointer shrink-0"
                              />
                              <span className={`min-w-0 break-words flex-1 ${isDone ? 'line-through text-[#6b7280]' : ''}`}>
                                {docItem}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      {/* Quick Actions */}
                      <div className="pt-2 border-t border-[#e5e7eb] flex flex-wrap items-center justify-between gap-2 w-full min-w-0">
                        <button
                          onClick={() => unsaveScholarship(item.scholarshipId)}
                          className="text-xs text-[#be123c] hover:underline font-caption cursor-pointer"
                        >
                          Remove from Saved
                        </button>

                        <button
                          onClick={() => {
                            if (fullRecord) {
                              setSelectedScholarshipForRedirect(fullRecord);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-xs text-[#0037b0] hover:text-[#2563eb] font-caption-strong cursor-pointer"
                        >
                          <span>Apply at Provider</span>
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Official Redirect Confirmation Dialog */}
      {selectedScholarshipForRedirect && (
        <OfficialRedirectModal
          scholarship={selectedScholarshipForRedirect}
          isOpen={!!selectedScholarshipForRedirect}
          onClose={() => setSelectedScholarshipForRedirect(null)}
        />
      )}
    </div>
  );
};
