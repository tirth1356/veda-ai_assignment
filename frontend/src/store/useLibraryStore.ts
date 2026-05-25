import { create } from 'zustand';

export interface ISavedQuestion {
  _id: string;
  questionText: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  svgDiagram?: string;
  answerText?: string;
  subject?: string;
  topic?: string;
  createdAt: string;
}

interface LibraryState {
  savedQuestions: ISavedQuestion[];
  isLoading: boolean;
  fetchSavedQuestions: () => Promise<void>;
  saveQuestion: (question: Partial<ISavedQuestion>) => Promise<void>;
  removeQuestion: (id: string) => Promise<void>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const useLibraryStore = create<LibraryState>((set, get) => ({
  savedQuestions: [],
  isLoading: false,

  fetchSavedQuestions: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('veda_token');
      const response = await fetch(`${API_BASE_URL}/library`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch library');
      const data = await response.json();
      set({ savedQuestions: data, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  saveQuestion: async (question) => {
    try {
      const token = localStorage.getItem('veda_token');
      const response = await fetch(`${API_BASE_URL}/library`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(question)
      });
      if (!response.ok) throw new Error('Failed to save question');
      const newQuestion = await response.json();
      set({ savedQuestions: [newQuestion, ...get().savedQuestions] });
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  removeQuestion: async (id) => {
    try {
      const token = localStorage.getItem('veda_token');
      const response = await fetch(`${API_BASE_URL}/library/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to remove question');
      set({ savedQuestions: get().savedQuestions.filter(q => q._id !== id) });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}));
