import { create } from 'zustand';

interface User {
  _id: string;
  name: string;
  email: string;
  schoolName?: string;
  schoolCity?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: (token: string, user: User) => {
    localStorage.setItem('veda_token', token);
    localStorage.setItem('veda_user_name', user.name);
    localStorage.setItem('veda_user_email', user.email);
    if (user.schoolName) localStorage.setItem('veda_school_name', user.schoolName);
    if (user.schoolCity) localStorage.setItem('veda_school_city', user.schoolCity);

    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('veda_token');
    localStorage.removeItem('veda_user_name');
    localStorage.removeItem('veda_user_email');
    
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('veda_token');
      if (!token) {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Verify token with backend
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token invalid');
      }

      const data = await response.json();
      set({ 
        user: data.user, 
        token, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      localStorage.removeItem('veda_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
