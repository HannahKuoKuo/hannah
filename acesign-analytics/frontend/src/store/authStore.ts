import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  company_name?: string;
  full_name?: string;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;

  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      isLoading: false,

      setAuth: (token: string, user: User) =>
        set({
          token,
          user,
          isLoggedIn: true
        }),

      setUser: (user: User) =>
        set({ user }),

      logout: () =>
        set({
          token: null,
          user: null,
          isLoggedIn: false
        }),

      setLoading: (loading: boolean) =>
        set({ isLoading: loading }),

      clearAuth: () =>
        set({
          token: null,
          user: null,
          isLoggedIn: false
        })
    }),
    {
      name: 'auth-store',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(name);
        }
      }
    }
  )
);
