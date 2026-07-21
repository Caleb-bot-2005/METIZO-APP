import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandAsyncStorage } from '@/utils/storage';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasOnboarded: boolean;
  setUser: (user: User) => void;
  setOnboarded: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasOnboarded: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setOnboarded: (value) => set({ hasOnboarded: value }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'metizo-auth',
      storage: createJSONStorage(() => zustandAsyncStorage),
    }
  )
);
