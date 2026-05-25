'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, BookOpen, GraduationCap, ArrowRight, Loader2, X } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';
import { useGroupStore } from '../../store/useGroupStore';
import Link from 'next/link';
import { GroupCardSkeleton } from '../../components/Skeleton';

export default function GroupsPage() {
  const showToast = useToastStore((state) => state.showToast);
  const { groups, isLoading, fetchGroups, createGroup } = useGroupStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !className || !subject) {
      showToast('Please fill all fields', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createGroup(name, className, subject);
      showToast('Group created successfully!', 'success');
      setIsModalOpen(false);
      setName('');
      setClassName('');
      setSubject('');
    } catch (err: any) {
      showToast(err.message || 'Failed to create group', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 relative">
      {/* Page Title */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">My Class Groups</h1>
          </div>
          <p className="text-xs text-gray-400">Organize and store assignments based on class and subject</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-full font-bold text-xs shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-orange-400" />
          <span>Create Group</span>
        </button>
      </div>


      {isLoading && groups.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white border border-gray-100 rounded-3xl space-y-4">
          <Users className="w-12 h-12 text-gray-300" />
          <p className="text-sm font-semibold text-gray-500">No class groups created yet.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-orange-500 font-bold text-xs hover:text-orange-600 underline underline-offset-4"
          >
            Create your first group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((group) => (
            <Link 
              key={group._id}
              href={`/groups/${group._id}`}
              className="bg-white border border-gray-200 hover:border-orange-300 hover:shadow-lg rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Decorative gradient blob */}
              <div className="absolute top-[-20%] right-[-10%] w-[150px] h-[150px] rounded-full bg-orange-50 blur-3xl group-hover:bg-orange-100 transition-colors"></div>

              {/* Header info */}
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-gray-800 tracking-tight">{group.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                    <GraduationCap className="w-3.5 h-3.5 text-orange-500" />
                    <span>{group.className}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mt-1">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                    <span>{group.subject}</span>
                  </div>
                </div>
                
                <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500 transition-colors">
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-gray-50 text-center font-sans relative z-10">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assignments</p>
                  <span className="text-sm font-black text-gray-800">{group.assignments?.length || 0}</span>
                </div>
                <div className="space-y-0.5 border-l border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Created</p>
                  <span className="text-xs font-bold text-gray-600">
                    {new Date(group.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-800">Create New Group</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600">Group Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Morning Batch A"
                  className="w-full px-4 py-2.5 border border-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 rounded-xl text-sm"
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600">Class / Grade</label>
                <input 
                  type="text" 
                  value={className} 
                  onChange={(e) => setClassName(e.target.value)} 
                  placeholder="e.g. Grade 10"
                  className="w-full px-4 py-2.5 border border-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 rounded-xl text-sm"
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600">Subject</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="e.g. Physics"
                  className="w-full px-4 py-2.5 border border-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 rounded-xl text-sm"
                  required 
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
