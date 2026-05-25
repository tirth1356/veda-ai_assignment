'use client';

import React, { useEffect } from 'react';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { useGroupStore } from '../store/useGroupStore';
import { useAuthStore } from '../store/useAuthStore';
import { socket } from '../lib/socket';

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const fetchAssignments = useAssignmentStore((state) => state.fetchAssignments);
  const fetchGroups = useGroupStore((state) => state.fetchGroups);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Re-fetch data whenever authentication state changes (login/logout/page refresh)
  useEffect(() => {
    if (isAuthenticated) {
      fetchAssignments();
      fetchGroups();
      
      // Global socket listener to keep dashboard synced
      socket.connect();
      socket.on('assignment-progress', (data: any) => {
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          fetchAssignments();
        }
      });

      return () => {
        socket.off('assignment-progress');
      };
    }
  }, [isAuthenticated, fetchAssignments, fetchGroups]);

  return <>{children}</>;
}
