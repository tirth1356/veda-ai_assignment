'use client';

import React, { useEffect } from 'react';
import { useAssignmentStore } from '../store/useAssignmentStore';

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const fetchAssignments = useAssignmentStore((state) => state.fetchAssignments);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return <>{children}</>;
}
