'use client';

import React from 'react';
import { Users, Plus, BookOpen, UserCheck, BarChart3, GraduationCap } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

interface GroupCard {
  id: string;
  className: string;
  subject: string;
  studentsCount: number;
  assignmentsCount: number;
  averageScore: string;
  color: string;
}

const GROUPS_DATA: GroupCard[] = [
  { id: '1', className: 'CBSE Grade 8', subject: 'Science', studentsCount: 34, assignmentsCount: 4, averageScore: '76%', color: 'from-orange-500 to-red-500 shadow-orange-100' },
  { id: '2', className: 'CBSE Grade 8', subject: 'English', studentsCount: 32, assignmentsCount: 2, averageScore: '82%', color: 'from-blue-500 to-indigo-500 shadow-blue-100' },
  { id: '3', className: 'CBSE Grade 9', subject: 'Physics', studentsCount: 28, assignmentsCount: 3, averageScore: '69%', color: 'from-emerald-500 to-teal-500 shadow-emerald-100' },
  { id: '4', className: 'CBSE Grade 5', subject: 'English', studentsCount: 30, assignmentsCount: 1, averageScore: '85%', color: 'from-purple-500 to-pink-500 shadow-purple-100' }
];

export default function GroupsPage() {
  const showToast = useToastStore((state) => state.showToast);
  return (
    <div className="flex flex-col space-y-6">
      {/* Page Title */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">My Class Groups</h1>
          </div>
          <p className="text-xs text-gray-400">Monitor academic progress and manage assessment rosters</p>
        </div>

        <button 
          onClick={() => showToast('Feature coming soon: Manage your student rosters.', 'info')}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-full font-bold text-xs shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-orange-400" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {GROUPS_DATA.map((group) => (
          <div 
            key={group.id}
            className="bg-white border border-gray-200 hover:border-orange-200 hover:shadow-md rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between"
          >
            {/* Header info */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-gray-800 tracking-tight">{group.className}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
                  <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                  <span>{group.subject}</span>
                </div>
              </div>
              
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${group.color} flex items-center justify-center shadow-md`}>
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t border-gray-50 text-center font-sans">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Students</p>
                <div className="flex items-center justify-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm font-black text-gray-800">{group.studentsCount}</span>
                </div>
              </div>

              <div className="space-y-0.5 border-x border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Papers</p>
                <span className="text-sm font-black text-gray-800">{group.assignmentsCount}</span>
              </div>

              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Score</p>
                <div className="flex items-center justify-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-sm font-black text-green-700">{group.averageScore}</span>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
