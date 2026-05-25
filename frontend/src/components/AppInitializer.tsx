'use client';

import React, { useEffect } from 'react';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { useAuthStore } from '../store/useAuthStore';

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const fetchAssignments = useAssignmentStore((state) => state.fetchAssignments);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Re-fetch assignments whenever authentication state changes (login/logout/page refresh)
  useEffect(() => {
    if (isAuthenticated) {
      fetchAssignments();
    }
  }, [isAuthenticated, fetchAssignments]);

  return <>{children}</>;
}
