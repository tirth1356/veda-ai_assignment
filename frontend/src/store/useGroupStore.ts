import { create } from 'zustand';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface Group {
  _id: string;
  name: string;
  className: string;
  subject: string;
  assignments: any[]; // Populated assignments
  createdAt: string;
  updatedAt: string;
}

interface GroupState {
  groups: Group[];
  isLoading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  createGroup: (name: string, className: string, subject: string) => Promise<Group>;
  getGroup: (id: string) => Promise<Group>;
  addAssignmentToGroup: (groupId: string, assignmentId: string) => Promise<void>;
  resetStore: () => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  isLoading: false,
  error: null,

  resetStore: () => set({
    groups: [],
    isLoading: false,
    error: null
  }),

  fetchGroups: async () => {
    const token = localStorage.getItem('veda_token');
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      set({ groups: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createGroup: async (name, className, subject) => {
    const token = localStorage.getItem('veda_token');
    if (!token) throw new Error('Not authenticated');

    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/groups`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name, className, subject }),
      });
      if (!response.ok) throw new Error('Failed to create group');
      const newGroup = await response.json();
      set((state) => ({ groups: [newGroup, ...state.groups], isLoading: false }));
      return newGroup;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  getGroup: async (id: string) => {
    const token = localStorage.getItem('veda_token');
    const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch group details');
    return await response.json();
  },

  addAssignmentToGroup: async (groupId, assignmentId) => {
    const token = localStorage.getItem('veda_token');
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/assignments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ assignmentId }),
    });
    if (!response.ok) throw new Error('Failed to add assignment to group');
    // Re-fetch groups to update count in global state
    await get().fetchGroups();
  }
}));
