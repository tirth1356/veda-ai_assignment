import React, { useState } from 'react';
import { IAssignment, useAssignmentStore } from '../store/useAssignmentStore';
import { FileText, Edit3, X, Download, ShieldAlert, BarChart, Clock, BookOpen, Layers } from 'lucide-react';

interface AssignmentPreviewModalProps {
  open: boolean;
  assignment: IAssignment | null;
  onClose: () => void;
  onConfirm: () => void;
}

const AssignmentPreviewModal: React.FC<AssignmentPreviewModalProps> = ({ open, assignment, onClose, onConfirm }) => {
  const [feedback, setFeedback] = useState('');
  const applyChanges = useAssignmentStore(state => state.applyChanges);

  if (!open || !assignment) return null;

  const handleApplyChanges = async () => {
    if (!feedback.trim()) return;
    try {
      await applyChanges(assignment._id, feedback);
      onClose(); // close modal to show the progress bar in the background
    } catch (err) {
      console.error('Failed to apply changes:', err);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-700 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'challenging': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300 p-2 sm:p-6 md:p-10">
      <div className="bg-white md:rounded-[2rem] rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] md:h-[90vh] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300 border border-gray-200/50">
        
        {/* LEFT PANE - Questions Preview */}
        <div className="flex-1 flex flex-col md:h-full bg-gray-50/30 shrink-0 md:shrink">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">{assignment.title}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500">
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {assignment.subject || 'Subject N/A'}</span>
                <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {assignment.className || 'Class N/A'}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {assignment.timeAllowed || 'Time N/A'}</span>
                <span className="flex items-center gap-1.5"><BarChart className="w-3.5 h-3.5" /> {assignment.totalMarks} Marks</span>
              </div>
            </div>
            
            {/* Mobile close button only */}
            <button onClick={onClose} className="md:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 md:overflow-y-auto p-5 md:p-8 space-y-10 custom-scrollbar">
            {assignment.sections && assignment.sections.length > 0 ? (
              assignment.sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-6">
                  {/* Section Header */}
                  <div className="pb-4 border-b border-gray-200/60">
                    <h3 className="text-lg font-extrabold text-gray-800 uppercase tracking-widest">{section.title}</h3>
                    {section.instruction && (
                      <p className="text-sm text-gray-500 mt-1 italic">{section.instruction}</p>
                    )}
                  </div>

                  {/* Questions List */}
                  <div className="space-y-5">
                    {section.questions.map((q, qIdx) => (
                      <div key={qIdx} className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 transition-all duration-300">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            <span className="font-bold text-gray-400 text-sm mt-0.5">Q{qIdx + 1}.</span>
                            <p className="text-gray-800 font-medium text-sm leading-relaxed">{q.questionText}</p>
                          </div>
                          <span className="shrink-0 font-bold text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                            {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                          </span>
                        </div>
                        
                        {/* Tags */}
                        <div className="mt-4 flex items-center gap-3 pl-8">
                          <div className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getDifficultyColor(q.difficulty)}`}>
                            {q.difficulty || 'Moderate'}
                          </div>
                          {q.svgDiagram && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-md flex items-center gap-1">
                              Has Diagram
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                <ShieldAlert className="w-12 h-12 text-gray-300" />
                <p className="font-medium">No structured sections found in this generation.</p>
                {/* Fallback to raw data if sections are missing */}
                <div className="max-w-2xl w-full max-h-64 overflow-auto bg-gray-100 p-4 rounded-xl text-xs">
                  <pre>{JSON.stringify(assignment, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE - Actions & Feedback */}
        <div className="w-full md:w-80 lg:w-[400px] bg-gray-900 flex flex-col shrink-0 text-white relative rounded-b-2xl md:rounded-r-[2rem] md:rounded-bl-none">
          
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10 hidden md:block">
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 md:p-8 md:pt-16 flex-1 flex flex-col space-y-6 md:space-y-8 md:overflow-y-auto">
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-tight text-white">Review & Actions</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Review the generated questions. You can request changes or immediately generate your final PDF document.
              </p>
            </div>

            {/* Changes Box */}
            <div className="flex-1 flex flex-col space-y-3">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5" />
                Request Changes
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="E.g. Make questions harder, add more diagram questions, replace Q3..."
                className="w-full flex-1 min-h-[150px] p-4 bg-white/5 border border-white/10 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 rounded-2xl text-sm text-gray-200 placeholder-gray-500 resize-none transition-all"
              />
              <button 
                type="button"
                onClick={handleApplyChanges}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors border border-white/5"
              >
                Apply Changes
              </button>
            </div>

            {/* Final Action */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              <button
                onClick={onConfirm}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm font-black transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Generate PDF</span>
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-colors"
              >
                Cancel & Close
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AssignmentPreviewModal;
