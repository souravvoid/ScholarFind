import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrackerStatus, Scholarship } from '../types';
import { SCHOLARSHIPS_DATA } from '../data/scholarshipsData';
import { OfficialRedirectModal } from './OfficialRedirectModal';

interface ApplicationTrackerProps {
  onSelectScholarship: (scholarship: Scholarship) => void;
  onExplore: () => void;
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  onSelectScholarship,
  onExplore
}) => {
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
    <div className="w-full pt-8 pb-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eeeeed] text-[#434655] font-label-sm text-[11px] uppercase tracking-wider mb-2 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]"></span>
              Personal Student Dossier
            </div>
            <h1 className="font-headline-lg text-[#1a1a1e] tracking-tight">
              Application Tracker &amp; Saved Endowments
            </h1>
            <p className="font-body-lead text-[#6b7280]">
              Keep track of document readiness, personal deadlines, and official provider submissions.
            </p>
          </div>

          <button
            onClick={onExplore}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0037b0] text-white font-caption-strong text-xs hover:bg-[#2563eb] transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Discover More Scholarships</span>
          </button>
        </div>

        {/* Stage Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-[#e5e7eb] pb-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-caption-strong text-xs transition-colors cursor-pointer ${
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
              className={`px-4 py-2 rounded-lg font-caption-strong text-xs transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === st.id
                  ? 'bg-[#1d4ed8] text-white shadow-xs'
                  : 'bg-white border border-[#e5e7eb] text-[#1a1a1e] hover:bg-[#f3f4f3]'
              }`}
            >
              <span>{st.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === st.id ? 'bg-white/20 text-white' : 'bg-[#eeeeed] text-[#6b7280]'
              }`}>
                {st.count}
              </span>
            </button>
          ))}
        </div>

        {/* Saved List */}
        {filteredItems.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-[#e5e7eb] shadow-xs">
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
              className="px-6 py-2.5 rounded-full bg-[#1d4ed8] text-white font-caption-strong text-xs shadow-xs hover:bg-[#2563eb]"
            >
              Explore Scholarship Registry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
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
                  className="bg-white rounded-2xl p-6 border border-[#e5e7eb] shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Scholarship info */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-caption text-xs text-[#6b7280]">
                          {item.provider} • {item.destination}
                        </span>
                        <span className="text-[#e5e7eb]">•</span>
                        <span className="font-caption-strong text-xs text-[#ba1a1a] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          Deadline: {item.deadline}
                        </span>
                      </div>

                      <h3 
                        onClick={() => fullRecord && onSelectScholarship(fullRecord)}
                        className="font-title text-lg text-[#1a1a1e] hover:text-[#0037b0] transition-colors cursor-pointer"
                      >
                        {item.scholarshipTitle}
                      </h3>

                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#f3f4f3] text-xs font-semibold text-[#1a1a1e]">
                        <span>Award Value:</span>
                        <span className="text-[#0037b0]">{item.awardValue}</span>
                      </div>

                      {/* Status Selector */}
                      <div className="flex items-center gap-3 pt-2">
                        <span className="font-caption-strong text-xs text-[#6b7280]">Your Progress:</span>
                        <select
                          value={item.status}
                          onChange={(e) => updateTrackerStatus(item.scholarshipId, e.target.value as TrackerStatus)}
                          className="px-3 py-1.5 rounded-lg bg-[#f3f4f3] border border-[#e5e7eb] text-xs font-semibold text-[#1a1a1e] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1d4ed8] cursor-pointer"
                        >
                          <option value="interested">Interested</option>
                          <option value="preparing">Preparing Documents</option>
                          <option value="ready">Ready to Apply</option>
                          <option value="applied">Applied Directly</option>
                        </select>
                      </div>

                      {/* Personal Notes */}
                      <div className="pt-2">
                        {editingNotesId === item.scholarshipId ? (
                          <div className="space-y-2">
                            <textarea
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="Add personal notes, essay drafts, or interview dates..."
                              className="w-full p-2.5 rounded-lg bg-[#f9f9f8] border border-[#e5e7eb] text-xs text-[#1a1a1e] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveNotes(item.scholarshipId, item.status)}
                                className="px-3 py-1 rounded bg-[#0037b0] text-white text-xs font-semibold"
                              >
                                Save Note
                              </button>
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="px-3 py-1 rounded bg-[#eeeeed] text-[#1a1a1e] text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 text-xs text-[#6b7280]">
                            <span className="material-symbols-outlined text-[15px] mt-0.5">edit_note</span>
                            <span className="flex-1 italic">
                              {item.notes || 'No personal notes added yet.'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingNotesId(item.scholarshipId);
                                setTempNotes(item.notes || '');
                              }}
                              className="text-[#0037b0] hover:underline font-semibold"
                            >
                              Edit Note
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document Readiness Checklist */}
                    <div className="w-full lg:w-80 p-4 rounded-xl bg-[#f9f9f8] border border-[#e5e7eb] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-caption-strong text-xs text-[#1a1a1e]">
                          Document Readiness
                        </span>
                        <span className="font-caption-strong text-xs text-[#047857]">
                          {readinessPercent}% ({completedCount}/{requiredDocs.length})
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-[#e2e2e2] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#047857] h-full rounded-full transition-all duration-300"
                          style={{ width: `${readinessPercent}%` }}
                        />
                      </div>

                      {/* Check items */}
                      <div className="space-y-1.5 pt-1">
                        {requiredDocs.map((docItem, idx) => {
                          const isDone = item.completedDocs?.includes(docItem);
                          return (
                            <label 
                              key={idx}
                              onClick={() => handleToggleDoc(item.scholarshipId, docItem, item.completedDocs || [])}
                              className="flex items-start gap-2 text-xs text-[#434655] cursor-pointer hover:text-[#1a1a1e] select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                readOnly
                                className="mt-0.5 w-3.5 h-3.5 rounded text-[#047857] accent-[#047857] cursor-pointer"
                              />
                              <span className={isDone ? 'line-through text-[#6b7280]' : ''}>
                                {docItem}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      {/* Quick Actions */}
                      <div className="pt-2 border-t border-[#e5e7eb] flex items-center justify-between gap-2">
                        <button
                          onClick={() => unsaveScholarship(item.scholarshipId)}
                          className="text-xs text-[#be123c] hover:underline font-caption"
                        >
                          Remove from Saved
                        </button>

                        <button
                          onClick={() => {
                            if (fullRecord) {
                              setSelectedScholarshipForRedirect(fullRecord);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-xs text-[#0037b0] hover:text-[#2563eb] font-caption-strong"
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
