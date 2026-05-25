'use client';

import React from 'react';
import { Sparkles, FileText, CheckSquare, CalendarDays, BookOpen, ArrowRight } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  color: string;
}

const TOOLS_DATA: Tool[] = [
  { id: '1', name: 'Rubric Creator', description: 'Design tailored grading rubrics based on assignment criteria, scoring levels, and guidelines.', icon: CheckSquare, badge: 'Coming Soon', color: 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300' },
  { id: '2', name: 'Factual Validator', description: 'Verify test questions and student answers against verified reference materials for absolute accuracy.', icon: FileText, badge: 'Coming Soon', color: 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300' },
  { id: '3', name: 'Curriculum Constructor', description: 'Draft comprehensive 5-day structured lesson plans aligned with specific national curricula standards.', icon: CalendarDays, badge: 'Coming Soon', color: 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300' },
  { id: '4', name: 'Material Summarizer', description: 'Condense detailed textbook chapters or reference papers into bulleted student study notes.', icon: BookOpen, badge: 'Coming Soon', color: 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300' }
];

export default function ToolkitPage() {
  const showToast = useToastStore((state) => state.showToast);
  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">AI Teacher's Toolkit</h1>
        </div>
        <p className="text-xs text-gray-400">Additional AI copilots to streamline curriculum and grading workflows</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TOOLS_DATA.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => showToast(`Copilot "${tool.name}" is coming soon to the toolkit!`, 'info')}
              className="group bg-white border border-gray-200 hover:border-orange-200 hover:shadow-md rounded-3xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Icon Row */}
                <div className="flex justify-between items-center">
                  <div className={`p-3 rounded-2xl border ${tool.color} transition-all`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black tracking-widest uppercase bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-gray-400">
                    {tool.badge}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-gray-800 group-hover:text-orange-500 transition-colors leading-snug">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 group-hover:text-orange-500 transition-colors pt-6">
                <span>Coming Soon</span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
