import { create } from 'zustand';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface IQuestion {
  questionText: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  svgDiagram?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAnswerKeyItem {
  questionNumber: number;
  answerText: string;
}

export interface IQuestionTypeConfig {
  type: string;
  count: number;
  marks: number;
}

export interface IAssignment {
  _id: string;
  title: string;
  dueDate: string;
  questionTypes: IQuestionTypeConfig[];
  additionalInstructions?: string;
  filePath?: string;
  originalFileName?: string;
  totalQuestions: number;
  totalMarks: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  error?: string;
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  sections?: ISection[];
  answerKey?: IAnswerKeyItem[];
  createdAt: string;
  updatedAt: string;
}

interface ProgressState {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  message?: string;
  error?: string;
}

interface AssignmentStore {
  assignments: IAssignment[];
  isLoading: boolean;
  currentAssignment: IAssignment | null;
  currentLoading: boolean;
  
  // Real-time progress state
  generationProgress: ProgressState | null;

  // Actions
  fetchAssignments: () => Promise<void>;
  fetchAssignmentDetails: (id: string) => Promise<IAssignment | null>;
  createAssignment: (formData: FormData) => Promise<any>;
  deleteAssignment: (id: string) => Promise<void>;
  regenerateAssignment: (id: string) => Promise<void>;
  applyChanges: (id: string, feedback: string) => Promise<void>;
  setGenerationProgress: (progress: ProgressState) => void;
  clearGenerationProgress: () => void;
  resetStore: () => void;
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  isLoading: false,
  currentAssignment: null,
  currentLoading: false,
  generationProgress: null,

  resetStore: () => set({
    assignments: [],
    currentAssignment: null,
    generationProgress: null,
    isLoading: false,
    currentLoading: false,
  }),

  fetchAssignments: async () => {
    const token = localStorage.getItem('veda_token');
    if (!token) return;

    set({ isLoading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch assignments');
      const data = await response.json();
      set({ assignments: data, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  fetchAssignmentDetails: async (id: string) => {
    set({ currentLoading: true });
    try {
      const token = localStorage.getItem('veda_token');
      const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch assignment details');
      const data = await response.json();
      set({ currentAssignment: data, currentLoading: false });
      return data;
    } catch (error) {
      console.error(error);
      set({ currentLoading: false, currentAssignment: null });
      return null;
    }
  },

  createAssignment: async (formData: FormData) => {
    set({
      generationProgress: {
        status: 'PENDING',
        progress: 0,
        message: 'Submitting request to queue...',
      },
    });

    try {
      const token = localStorage.getItem('veda_token');
      const response = await fetch(`${API_BASE_URL}/assignments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create assignment');
      }

      const data = await response.json();
      
      // Fetch list again
      get().fetchAssignments();

      return data;
    } catch (error: any) {
      set({
        generationProgress: {
          status: 'FAILED',
          progress: 0,
          error: error.message || 'Submission failed',
        },
      });
      throw error;
    }
  },

  deleteAssignment: async (id: string) => {
    try {
      const token = localStorage.getItem('veda_token');
      const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete assignment');
      set({
        assignments: get().assignments.filter((a) => a._id !== id),
      });
      if (get().currentAssignment?._id === id) {
        set({ currentAssignment: null });
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  regenerateAssignment: async (id: string) => {
    set({
      generationProgress: {
        status: 'PENDING',
        progress: 0,
        message: 'Re-submitting to generation queue...',
      },
    });

    try {
      const token = localStorage.getItem('veda_token');
      const response = await fetch(`${API_BASE_URL}/assignments/${id}/regenerate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to regenerate assignment');
      
      // Update details view
      get().fetchAssignmentDetails(id);
    } catch (error: any) {
      set({
        generationProgress: {
          status: 'FAILED',
          progress: 0,
          error: error.message || 'Regeneration request failed',
        },
      });
      throw error;
    }
  },

  applyChanges: async (id: string, feedback: string) => {
    set({
      generationProgress: {
        status: 'PENDING',
        progress: 0,
        message: 'Applying changes and resubmitting...',
      },
    });

    try {
      const token = localStorage.getItem('veda_token');
      const response = await fetch(`${API_BASE_URL}/assignments/${id}/apply-changes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ feedback }),
      });

      if (!response.ok) throw new Error('Failed to apply changes');
      
      // Update details view
      get().fetchAssignmentDetails(id);
    } catch (error: any) {
      set({
        generationProgress: {
          status: 'FAILED',
          progress: 0,
          error: error.message || 'Apply changes request failed',
        },
      });
      throw error;
    }
  },

  setGenerationProgress: (progress: ProgressState) => {
    set({ generationProgress: progress });
    
    // If completed or failed, update the details model if we are currently looking at it
    const current = get().currentAssignment;
    if (current && (progress.status === 'COMPLETED' || progress.status === 'FAILED')) {
      get().fetchAssignmentDetails(current._id);
    }
  },

  clearGenerationProgress: () => {
    set({ generationProgress: null });
  },
}));
