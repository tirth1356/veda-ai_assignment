'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  ChevronRight, 
  MoreVertical, 
  Trash2, 
  Eye, 
  Sparkles,
  Calendar,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award,
  Users
} from 'lucide-react';
import { useAssignmentStore, IAssignment } from '../../store/useAssignmentStore';
import { useToastStore } from '../../store/useToastStore';
import DashboardCharts from '../../components/DashboardCharts';

export default function Dashboard() {
  const router = useRouter();
  const { assignments, isLoading, deleteAssignment } = useAssignmentStore();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [userName, setUserName] = useState('Madhur');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const showToast = useToastStore((state) => state.showToast);

  const completedCount = assignments.filter(a => a.status === 'COMPLETED').length;
  const totalCount = assignments.length;
  const reviewPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const strokeDashoffset = 125 - (125 * (reviewPercent / 100));
  const timeSaved = (totalCount * 2.5).toFixed(1);
  const timeSavedMore = (totalCount * 0.5).toFixed(1);
  const totalQuestionsDrafted = assignments.reduce((acc, a) => acc + (a.totalQuestions || 0), 0);

  useEffect(() => {
    // Read dynamic user name
    const storedName = localStorage.getItem('veda_user_name');
    if (storedName) {
      // Get first name
      const firstName = storedName.split(' ')[0];
      setUserName(firstName);
    }
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
    setActiveMenuId(null);
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  React.useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB').replace(/\//g, '-');
    } catch {
      return dateStr;
    }
  };

  // Mock list of recent assignments matching Figma screenshots if DB is empty
  const mockRecentAssignments = [
    {
      _id: 'mock-1',
      title: 'Assignment on Motion',
      status: 'COMPLETED',
      subject: 'Science',
      className: 'Class 10-A',
      submittedCount: '50/50',
      dueDate: '21-06-2025',
      createdAt: '2025-06-20T00:00:00.000Z',
      lineColor: 'border-orange-500',
      activeTag: 'Active',
      tagColor: 'bg-green-50 text-green-700'
    },
    {
      _id: 'mock-2',
      title: 'Quiz on Electricity',
      status: 'COMPLETED',
      subject: 'Science',
      className: 'Class 10-A',
      submittedCount: '47/50',
      dueDate: '21-06-2025',
      createdAt: '2025-06-20T00:00:00.000Z',
      lineColor: 'border-red-500',
      activeTag: 'Closed',
      tagColor: 'bg-gray-100 text-gray-700'
    }
  ];

  // Pick display assignments (actual DB entries take precedence, fall back to mock)
  const displayAssignments = assignments.length > 0 
    ? assignments.slice(0, 2).map((a, index) => ({
        _id: a._id,
        title: a.title,
        status: a.status,
        subject: a.subject || 'Science',
        className: a.className || 'Class 10-A',
        submittedCount: index === 0 ? '50/50' : '47/50', // Mock submissions count
        dueDate: formatDate(a.dueDate),
        createdAt: a.createdAt,
        lineColor: index === 0 ? 'border-orange-500' : 'border-red-500',
        activeTag: a.status === 'COMPLETED' ? 'Active' : 'Processing',
        tagColor: a.status === 'COMPLETED' 
          ? 'bg-green-50 text-green-700'
          : 'bg-orange-50 text-orange-700 animate-pulse'
      }))
    : mockRecentAssignments;

  const EmptyStateGraphic = () => (
    <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
      <img src="/image-removebg.png" alt="No Assessments" className="w-full h-full object-contain" />
    </div>
  );
 
  // If there are no assignments in the DB, show high-fidelity Empty State screen matching Figma mockup
  if (!isLoading && assignments.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center max-w-md mx-auto space-y-6 select-none animate-in fade-in duration-300">
        <EmptyStateGraphic />
        <div className="space-y-2">
          <h2 className="text-lg font-black text-gray-800 tracking-tight">You haven't generated any assessments yet.</h2>
          <p className="text-xs text-gray-400 font-medium leading-relaxed">
            Run the AI generator to build structured exam papers.
          </p>
        </div>
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 py-3 px-6 bg-gray-950 hover:bg-gray-900 text-white rounded-full font-bold text-xs shadow-md hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-4 h-4 text-orange-400" />
          <span>Generate New Assessment</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-8 select-none relative pb-16">
      
      {/* Greetings Block */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            Hi {userName} <span className="animate-bounce">👋</span>
          </h1>
        </div>
        <p className="text-xs text-gray-400">Welcome Back, Ready to create your next assignment?</p>
      </div>

      {/* TOP CARDS: ANALYTICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
        
        {/* Card 1: Recharts Overview */}
        <div className="col-span-1 md:col-span-2">
          <DashboardCharts data={[]} />
        </div>

        {/* Card 2: Average Difficulty (New) */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <h4 className="text-xs font-bold text-gray-400">Average Difficulty</h4>
          <div className="my-3 flex items-center justify-center h-full">
            <span className="text-3xl font-black tracking-tight text-gray-800">Moderate</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-500">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Perfect for Class 10-A</span>
          </div>
        </div>

        {/* Card 3: Time Saved */}
        <div className="bg-gray-950 border border-transparent rounded-3xl p-6 shadow-lg flex flex-col justify-between text-white">
          <h4 className="text-xs font-bold text-gray-400">Time Saved By AI</h4>
          <div className="my-3">
            <span className="text-3xl font-black tracking-tight text-white">{timeSaved} hrs</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-orange-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{timeSavedMore} hrs more than last month</span>
          </div>
        </div>

      </div>

      {/* RECENT ASSIGNMENTS SECTION */}
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>
            <h2 className="text-base font-extrabold text-gray-800 tracking-tight">Recent Assignments</h2>
          </div>
          <Link
            href="/assignments"
            className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayAssignments.map((assignment) => (
            <div
              key={assignment._id}
              onClick={() => {
                if (assignment._id.startsWith('mock-')) {
                  showToast('Figma Template Demo: Click "Create Assignment" or navigate to "Assignments" tab to view real database papers.', 'info');
                } else if (assignment.status === 'COMPLETED') {
                  router.push(`/assignments/${assignment._id}`);
                } else {
                  router.push(`/create?id=${assignment._id}`);
                }
              }}
              className={`group relative bg-white border border-gray-200 hover:border-orange-200 hover:shadow-md rounded-3xl p-6 pb-8 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px] overflow-hidden`}
            >
              <div className={`absolute bottom-0 left-0 right-0 h-1.5 border-b-4 ${assignment.lineColor}`}></div>

              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-lg text-gray-800 group-hover:text-orange-500 transition-colors leading-snug truncate">
                    {assignment.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold text-gray-400">
                      {assignment.className} • {assignment.subject}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border border-transparent ${assignment.tagColor}`}>
                      {assignment.activeTag}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={(e) => toggleMenu(e, assignment._id)}
                    className="p-1.5 hover:bg-gray-55 border border-transparent rounded-lg text-gray-400 hover:text-gray-700 transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenuId === assignment._id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10">
                      <button
                        onClick={() => {
                          if (assignment._id.startsWith('mock-')) return;
                          router.push(`/assignments/${assignment._id}`);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-600 hover:bg-orange-50 hover:text-orange-500 flex items-center gap-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, assignment._id)}
                        disabled={assignment._id.startsWith('mock-')}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-20 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submissions count and Dates */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-50 text-[11px] font-semibold font-sans">
                <div>
                  <span className="text-lg font-black text-gray-800 leading-none">{assignment.submittedCount}</span>
                  <span className="text-gray-400 block mt-0.5">Submitted</span>
                </div>
                <div className="text-right flex flex-col justify-end text-gray-400">
                  <span>Assigned on: {formatDate(assignment.createdAt)}</span>
                  <span>Due: <strong className="text-gray-700">{assignment.dueDate}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center Sticky Floating "+ Create Assignment" Pill Button */}
      {assignments.length > 0 && (
        <div className="sticky bottom-2 left-0 right-0 flex justify-center z-25 pointer-events-none mt-10">
          <Link
            href="/create"
            className="pointer-events-auto flex items-center justify-center gap-2 py-3 px-8 bg-gray-950 hover:bg-gray-900 text-white rounded-full font-extrabold text-xs shadow-xl border border-gray-800 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            <span>Create Assignment</span>
          </Link>
        </div>
      )}

      {/* Custom delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-150 p-6 rounded-3xl max-w-sm w-full mx-4 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="font-extrabold text-sm text-gray-800">Delete Assignment?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Are you sure you want to delete this assignment? This will permanently remove the questions, answers, and generated files.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-gray-150 hover:bg-gray-50 rounded-full text-xs font-semibold text-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirmId) {
                    await deleteAssignment(deleteConfirmId);
                    setDeleteConfirmId(null);
                    showToast('Assignment deleted successfully.', 'success');
                  }
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold transition-all shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
