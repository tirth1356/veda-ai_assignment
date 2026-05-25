'use client';

import React from 'react';
import { useToastStore } from '../store/useToastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let bgColor = 'bg-blue-50 border-blue-200 text-blue-800';
        let iconColor = 'text-blue-500';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          bgColor = 'bg-green-50 border-green-200 text-green-800';
          iconColor = 'text-green-500';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          bgColor = 'bg-red-50 border-red-200 text-red-800';
          iconColor = 'text-red-500';
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg ${bgColor} pointer-events-auto transition-all duration-300 animate-in slide-in-from-right-5 fade-in-20`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-xs font-bold leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-0.5 hover:bg-black/5 rounded text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
