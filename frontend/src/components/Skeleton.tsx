import React from 'react';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`}></div>
  );
}

export function AssignmentCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[200px]">
      <div>
        <Skeleton className="h-6 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function GroupCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[220px]">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-full">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-gray-50">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16 mx-auto" />
          <Skeleton className="h-5 w-8 mx-auto" />
        </div>
        <div className="space-y-1 border-l border-gray-100">
          <Skeleton className="h-3 w-16 mx-auto" />
          <Skeleton className="h-5 w-12 mx-auto" />
        </div>
      </div>
    </div>
  );
}
