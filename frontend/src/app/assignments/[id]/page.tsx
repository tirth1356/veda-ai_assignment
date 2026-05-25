'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Download, 
  RotateCw, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  FileCheck,
  Calendar,
  Award,
  Share2,
  Star
} from 'lucide-react';
import { useAssignmentStore, IAssignment } from '../../../store/useAssignmentStore';
import { useLibraryStore } from '../../../store/useLibraryStore';
import { useToastStore } from '../../../store/useToastStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function AssignmentOutputView() {
  const router = useRouter();
  const { id } = useParams();
  const assignmentId = Array.isArray(id) ? id[0] : id;

  const { 
    currentAssignment, 
    currentLoading, 
    fetchAssignmentDetails, 
    regenerateAssignment 
  } = useAssignmentStore();

  const showToast = useToastStore((state) => state.showToast);
  const saveQuestion = useLibraryStore((state) => state.saveQuestion);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [userName, setUserName] = useState('Teacher');

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetails(assignmentId);
    }
    const storedName = localStorage.getItem('veda_user_name');
    if (storedName) {
      setUserName(storedName.split(' ')[0]); // Get first name
    }
  }, [assignmentId, fetchAssignmentDetails]);

  const handleDownloadPDF = () => {
    if (!assignmentId) return;
    const url = `${API_BASE_URL}/assignments/${assignmentId}/pdf`;
    window.open(url, '_blank');
  };

  const handleRegenerate = async () => {
    if (!assignmentId) return;
    setIsRegenerating(true);
    try {
      await regenerateAssignment(assignmentId);
      // Route back to create page to monitor websocket progression
      router.push(`/create?id=${assignmentId}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to trigger regeneration.', 'error');
      setIsRegenerating(false);
    }
  };

  if (currentLoading || !currentAssignment) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-gray-500 font-medium">Loading question paper...</p>
      </div>
    );
  }

  const assignment: IAssignment = currentAssignment;

  const getDifficultyColor = (diff: 'Easy' | 'Moderate' | 'Challenging') => {
    switch (diff) {
      case 'Easy':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Challenging':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col space-y-6 pb-16">
      
      {/* Top Banner Alert (Certainly, userName!... + PDF Download button) (Figma Screen 4) */}
      <div className="bg-gray-900 border border-gray-800 text-white rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
        <div className="space-y-1">
          <p className="text-sm font-semibold tracking-wide text-gray-100 leading-relaxed max-w-2xl">
            Certainly, {userName}! Here is your customized Question Paper for your {assignment.className} {assignment.subject} classes based on your configurations:
          </p>
          <div className="flex gap-4 text-[11px] text-gray-400 font-medium pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Due Date: {new Date(assignment.dueDate).toLocaleDateString('en-GB')}
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Total Marks: {assignment.totalMarks}
            </span>
          </div>
        </div>

        <div className="flex gap-3 shrink-0 flex-wrap">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-all border border-gray-700 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-orange-400 text-xs font-bold rounded-xl transition-all border border-gray-750"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Link</span>
          </button>
          
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 text-xs font-black rounded-xl shadow-md transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download as PDF</span>
          </button>
        </div>
      </div>

      {/* Styled Physical Exam Paper Page */}
      <div className="bg-white border-2 border-double border-gray-300 rounded-3xl shadow-md p-6 md:p-14 font-serif relative">
        {/* Page Inner border border */}
        <div className="absolute inset-2 md:inset-4 border border-gray-100 pointer-events-none rounded-2xl"></div>
        
        {/* Double outline line border at the top of content */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-wide font-serif">
            {assignment.schoolName || 'Delhi Public School, Sector-4, Bokaro'}
          </h2>
          <div className="text-sm font-semibold text-gray-600 space-x-4">
            <span>Subject: {assignment.subject}</span>
            <span>•</span>
            <span>Class: {assignment.className}</span>
          </div>
        </div>

        {/* Horizontal Divider Line */}
        <hr className="border-gray-300 mb-4" />

        {/* Timing and Marks grid */}
        <div className="flex justify-between items-center text-xs md:text-sm font-bold text-gray-700 mb-6 font-sans">
          <span>Time Allowed: {assignment.timeAllowed || '45 minutes'}</span>
          <span>Maximum Marks: {assignment.totalMarks}</span>
        </div>

        <hr className="border-gray-300 mb-4" />

        {/* General instructions */}
        <div className="text-xs md:text-sm italic text-gray-500 mb-8 leading-relaxed">
          All questions are compulsory unless stated otherwise.
        </div>

        {/* Student details form lines (Figma Stacked Outline Layout) */}
        <div className="max-w-md space-y-3.5 text-xs md:text-sm font-bold text-gray-700 mb-8 font-sans">
          <div className="flex items-end gap-2">
            <span className="shrink-0">Name:</span>
            <div className="flex-1 border-b border-gray-400 min-h-[16px]"></div>
          </div>
          <div className="flex items-end gap-2">
            <span className="shrink-0">Roll Number:</span>
            <div className="flex-1 border-b border-gray-400 min-h-[16px]"></div>
          </div>
          <div className="flex items-end gap-2">
            <span className="shrink-0">Class: {assignment.className} Section:</span>
            <div className="flex-1 border-b border-gray-400 min-h-[16px]"></div>
          </div>
        </div>


        {/* Thick double black line divider to begin sections */}
        <div className="border-t-2 border-b border-black h-1 mb-8"></div>

        {/* Exam Paper Sections */}
        {assignment.sections && assignment.sections.length > 0 ? (
          <div className="space-y-10">
            {(() => {
              let globalQIndex = 0;
              return assignment.sections.map((section, sIndex) => (
                <div key={section.title} className="space-y-4">
                  
                  {/* Section header banner */}
                  <div className="text-center">
                  <h3 className="text-base font-bold text-gray-900 tracking-wider uppercase underline">
                    {section.title}
                  </h3>
                  <p className="text-xs italic text-gray-500 mt-1">
                    {section.instruction}
                  </p>
                </div>

                {/* Question List */}
                <ol className="space-y-6 pt-4 font-serif">
                  {section.questions.map((q, qIndex) => {
                    globalQIndex++;
                    return (
                    <li key={`${qIndex}-${q.questionText.substring(0, 10)}`} className="flex justify-between items-start gap-4">
                      
                      {/* Left: Question text + details */}
                      <div className="flex-1 flex gap-2">
                        <span className="font-bold text-gray-900 select-none">
                          {globalQIndex}.
                        </span>
                        <div className="space-y-2">
                          <span className="text-sm md:text-base text-gray-800 leading-relaxed">
                            {q.questionText}
                          </span>
                          
                          {/* SVG Diagram inline */}
                          {q.svgDiagram && (
                            <div 
                              className="my-3 p-4 border border-gray-150 bg-gray-50/50 rounded-2xl max-w-[220px] mx-auto flex items-center justify-center shadow-inner"
                              dangerouslySetInnerHTML={{ __html: q.svgDiagram }} 
                            />
                          )}
                          
                          {/* Difficulty Tag and Save Button */}
                          <div className="flex items-center gap-3 pt-1 font-sans">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyColor(q.difficulty)}`}>
                              {q.difficulty}
                            </span>
                            <button
                              onClick={() => {
                                const currentAnswer = assignment.answerKey?.find(a => a.questionNumber === globalQIndex)?.answerText;
                                saveQuestion({
                                  questionText: q.questionText,
                                  difficulty: q.difficulty as any,
                                  marks: q.marks,
                                  svgDiagram: q.svgDiagram,
                                  answerText: currentAnswer,
                                  subject: assignment.subject,
                                  topic: section.title
                                }).then(() => {
                                  showToast('Question saved to Library', 'success');
                                }).catch(() => {
                                  showToast('Failed to save question', 'error');
                                });
                              }}
                              className="text-gray-300 hover:text-orange-500 transition-colors flex items-center gap-1 opacity-50 hover:opacity-100"
                              title="Save to Question Bank"
                            >
                              <Star className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">Save to Library</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Marks */}
                      <div className="text-xs md:text-sm font-bold text-gray-800 shrink-0 font-sans">
                        [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                      </div>

                    </li>
                  );
                })}
                </ol>

              </div>
            ));
          })()}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 text-sm">
            No questions are populated on this paper. Try regenerating.
          </div>
        )}

        <div className="text-center font-bold text-xs pt-12 text-gray-400 uppercase tracking-widest font-sans">
          End of Question Paper
        </div>
      </div>

      {/* Answer Key Section Card */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col space-y-6">
        <div>
          <h3 className="font-extrabold text-lg text-gray-800">Answer Key</h3>
          <p className="text-xs text-gray-400">Detailed answers and marking points generated by AI</p>
        </div>

        <hr className="border-gray-100" />

        {assignment.answerKey && assignment.answerKey.length > 0 ? (
          <div className="space-y-6">
            {assignment.answerKey.map((ans) => (
              <div key={ans.questionNumber} className="flex gap-4">
                <span className="font-bold text-sm text-gray-900 w-6 shrink-0 text-right">
                  {ans.questionNumber}.
                </span>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  {ans.answerText}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-sm text-center py-6">
            No answer key has been generated for this paper.
          </div>
        )}
      </div>

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-150 p-6 rounded-3xl max-w-md w-full mx-4 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="font-extrabold text-sm text-gray-800">Share Question Paper</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Copy the direct download link below to share the generated PDF assessment sheet with your students.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${API_BASE_URL}/assignments/${assignmentId}/pdf`}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none select-all font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${API_BASE_URL}/assignments/${assignmentId}/pdf`);
                  showToast('Share link copied to clipboard!', 'success');
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Copy
              </button>
            </div>
            
            {/* Direct Open Link button */}
            <div className="flex justify-between items-center pt-2">
              <a 
                href={`${API_BASE_URL}/assignments/${assignmentId}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-orange-500 hover:underline flex items-center gap-1"
              >
                Open PDF in new tab &rarr;
              </a>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 border border-gray-150 hover:bg-gray-50 rounded-full text-xs font-semibold text-gray-650 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
