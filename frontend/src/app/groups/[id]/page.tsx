'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, GraduationCap, Plus, Loader2, FileText, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useGroupStore } from '../../../store/useGroupStore';
import { useToastStore } from '../../../store/useToastStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function GroupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  
  const showToast = useToastStore((state) => state.showToast);
  const { getGroup, addAssignmentToGroup, fetchGroups } = useGroupStore();

  const [group, setGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [isFetchingAssignments, setIsFetchingAssignments] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Custom Confirmation Modal state
  const [assignmentToRemove, setAssignmentToRemove] = useState<string | null>(null);

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    setIsLoading(true);
    try {
      const data = await getGroup(groupId);
      setGroup(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load group', 'error');
      router.push('/groups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = async () => {
    setIsModalOpen(true);
    setIsFetchingAssignments(true);
    try {
      const token = localStorage.getItem('veda_token');
      const res = await fetch(`${API_BASE_URL}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch assignments');
      const data = await res.json();
      setAllAssignments(data);
    } catch (err) {
      showToast('Could not load assignments', 'error');
    } finally {
      setIsFetchingAssignments(false);
    }
  };

  const handleAddAssignment = async (assignmentId: string) => {
    setIsAdding(true);
    try {
      await addAssignmentToGroup(groupId, assignmentId);
      showToast('Assignment added to group!', 'success');
      await loadGroup(); // refresh
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to add', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const confirmRemoveAssignment = async () => {
    if (!assignmentToRemove) return;
    try {
      const token = localStorage.getItem('veda_token');
      const res = await fetch(`${API_BASE_URL}/groups/${groupId}/assignments/${assignmentToRemove}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to remove assignment');
      showToast('Assignment removed from group', 'success');
      setAssignmentToRemove(null);
      await loadGroup(); // refresh
      await fetchGroups(); // update global count
    } catch (err: any) {
      showToast(err.message || 'Failed to remove', 'error');
    }
  };

  if (isLoading || !group) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-gray-500 font-bold text-sm animate-pulse">Loading group details...</p>
      </div>
    );
  }

  // Filter out assignments that are already in the group
  const groupAssignmentIds = group.assignments.map((a: any) => a._id);
  const availableAssignments = allAssignments.filter(a => !groupAssignmentIds.includes(a._id));

  return (
    <div className="flex flex-col space-y-6 relative">
      
      <Link href="/groups" className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 w-fit">
        <ArrowLeft className="w-4 h-4" />
        Back to Groups
      </Link>

      {/* Header Banner */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">{group.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
              <GraduationCap className="w-4 h-4 text-orange-500" />
              {group.className}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
              <BookOpen className="w-4 h-4 text-blue-500" />
              {group.subject}
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-orange-500 text-white hover:bg-orange-600 rounded-full font-bold text-xs shadow-md shadow-orange-200 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Assignment</span>
        </button>
      </div>

      {/* Assignments List */}
      <div>
        <h3 className="text-sm font-extrabold text-gray-800 mb-4 px-2">Group Assignments ({group.assignments.length})</h3>
        
        {group.assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl space-y-4">
            <FileText className="w-12 h-12 text-gray-300" />
            <p className="text-sm font-semibold text-gray-500">No assignments added to this group yet.</p>
            <button 
              onClick={handleOpenAddModal}
              className="text-orange-500 font-bold text-xs hover:text-orange-600 underline underline-offset-4"
            >
              Add an assignment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.assignments.map((assignment: any) => (
              <div key={assignment._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between group">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-800 line-clamp-1">{assignment.title}</h4>
                    <p className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => setAssignmentToRemove(assignment._id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    assignment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                    assignment.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {assignment.status}
                  </span>
                  <Link 
                    href={`/assignments/${assignment._id}`}
                    className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD ASSIGNMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-black text-gray-800">Add Assignment to Group</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {isFetchingAssignments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                </div>
              ) : availableAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm font-semibold text-gray-500">No available assignments to add.</p>
                  <p className="text-xs text-gray-400 mt-2">All assignments are either already in this group, or you haven't created any yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableAssignments.map(a => (
                    <div key={a._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-orange-200 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800 line-clamp-1">{a.title}</span>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button 
                        onClick={() => handleAddAssignment(a._id)}
                        disabled={isAdding}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REMOVE ASSIGNMENT CONFIRMATION MODAL */}
      {assignmentToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setAssignmentToRemove(null)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-200 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-black text-gray-800 mb-2">Remove Assignment</h2>
            <p className="text-sm font-semibold text-gray-500 mb-6">Are you sure you want to remove this assignment from the group? This action cannot be undone.</p>
            
            <div className="flex w-full gap-3">
              <button 
                onClick={() => setAssignmentToRemove(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-sm rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRemoveAssignment}
                className="flex-1 py-2.5 bg-red-500 text-white hover:bg-red-600 font-bold text-sm rounded-xl transition-colors shadow-md shadow-red-200"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
