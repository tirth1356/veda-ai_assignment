'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Eye, 
  Loader2,
  FileQuestion
} from 'lucide-react';
import { useAssignmentStore } from '../../store/useAssignmentStore';
import { useToastStore } from '../../store/useToastStore';

const EmptyStateGraphic = () => (
  <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
    <img src="/image-removebg.png" alt="No Assessments" className="w-full h-full object-contain" />
  </div>
);

export default function AssignmentsPage() {
  const router = useRouter();
  const { assignments, isLoading, deleteAssignment } = useAssignmentStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const showToast = useToastStore((state) => state.showToast);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
    setActiveMenuId(null);
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const { classes, subjects } = React.useMemo(() => {
    const classesSet = new Set<string>();
    const subjectsSet = new Set<string>();
    assignments.forEach(a => {
      if (a.className) classesSet.add(a.className);
      if (a.subject) subjectsSet.add(a.subject);
    });
    return {
      classes: Array.from(classesSet).sort(),
      subjects: Array.from(subjectsSet).sort()
    };
  }, [assignments]);

  React.useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.subject && a.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesClass = selectedClass ? a.className === selectedClass : true;
    const matchesSubject = selectedSubject ? a.subject === selectedSubject : true;
    return matchesSearch && matchesClass && matchesSubject;
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB').replace(/\//g, '-');
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <AssignmentCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileQuestion className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">All Generated Assessments</h1>
        </div>
        <p className="text-xs text-gray-400">Review your generated tests and download exam sheets</p>
      </div>

      
        {assignments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center max-w-md mx-auto space-y-6 select-none animate-in fade-in duration-300">
              <EmptyStateGraphic />
              <div className="space-y-2">
                <h2 className="text-lg font-black text-gray-800 tracking-tight">No assignments yet</h2>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
                </p>
              </div>
              <Link href="/create" className="flex items-center justify-center gap-2 py-3 px-6 bg-gray-950 hover:bg-gray-900 text-white rounded-full font-bold text-xs shadow-md hover:-translate-y-0.5 transition-all">
                <Plus className="w-4 h-4 text-orange-400" />
                <span>Create Your First Assignment</span>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500">
                <Filter className="w-4 h-4 text-gray-400" />
                <select className="bg-transparent focus:outline-none" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="bg-transparent focus:outline-none" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                  <option value="">All Subjects</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search by topic or subject..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded-xl text-xs placeholder-gray-400 transition-all" />
              </div>
            </div>
          )}



          {/* Grid list */}
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No matching assignments found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment._id}
                  onClick={() => {
                    if (assignment.status === 'COMPLETED') {
                      router.push(`/assignments/${assignment._id}`);
                    } else {
                      router.push(`/create?id=${assignment._id}`);
                    }
                  }}
                  className="group relative bg-white border border-gray-200 hover:border-orange-200 hover:shadow-md rounded-3xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[170px]"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-lg text-gray-800 group-hover:text-orange-500 transition-colors leading-snug truncate">
                        {assignment.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2 h-2 rounded-full ${
                          assignment.status === 'COMPLETED' ? 'bg-green-500' :
                          assignment.status === 'PROCESSING' ? 'bg-orange-400 animate-pulse' :
                          assignment.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-400'
                        }`}></span>
                        <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                          {assignment.status}
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => toggleMenu(e, assignment._id)}
                        className="p-1.5 hover:bg-gray-50 border border-transparent hover:border-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === assignment._id && (
                        <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10 animate-in fade-in slide-in-from-top-1 duration-150">
                          <button
                            onClick={() => router.push(assignment.status === 'COMPLETED' ? `/assignments/${assignment._id}` : `/create?id=${assignment._id}`)}
                            className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-600 hover:bg-orange-50 hover:text-orange-500 flex items-center gap-2 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, assignment._id)}
                            className="w-full px-4 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50 text-[11px] text-gray-400 font-semibold font-sans">
                    <div>
                      Assigned on : <span className="text-gray-500">{formatDate(assignment.createdAt)}</span>
                    </div>
                    <div>
                      Due : <span className="text-gray-900 font-bold">{formatDate(assignment.dueDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

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
