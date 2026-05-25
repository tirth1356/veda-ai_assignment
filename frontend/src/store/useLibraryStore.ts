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

export interface ILibraryDocument {
  _id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  createdAt: string;
}

interface LibraryState {
  savedQuestions: ISavedQuestion[];
  documents: ILibraryDocument[];
  isLoading: boolean;
  fetchSavedQuestions: () => Promise<void>;
  saveQuestion: (question: Partial<ISavedQuestion>) => Promise<void>;
  removeQuestion: (id: string) => Promise<void>;
  
  fetchDocuments: () => Promise<void>;
  uploadDocuments: (files: File[]) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const useLibraryStore = create<LibraryState>((set, get) => ({
  savedQuestions: [],
  documents: [],
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
  },

  fetchDocuments: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('veda_token');
      const response = await fetch(`${API_BASE_URL}/library/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      set({ documents: data, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  uploadDocuments: async (files: File[]) => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('veda_token');
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/library/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!response.ok) throw new Error('Failed to upload documents');
      const newDocs = await response.json();
      set({ documents: [...newDocs, ...get().documents], isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
      throw error;
    }
  },

  removeDocument: async (id: string) => {
    try {
      const token = localStorage.getItem('veda_token');
      const response = await fetch(`${API_BASE_URL}/library/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to remove document');
      set({ documents: get().documents.filter(d => d._id !== id) });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}));
