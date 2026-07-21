import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandAsyncStorage } from '@/utils/storage';
import { User } from '@/types/user';

interface SettingsState {
  language: string;
  notificationsEnabled: boolean;
  biometricsEnabled: boolean;
  biometricEmail: string | null;
  // Snapshot of the user tied to the biometric session, restored on biometric
  // unlock without a network call (see login.tsx) — separate from authStore's
  // user, which logout() clears.
  biometricUser: User | null;
  setLanguage: (language: string) => void;
  setNotificationsEnabled: (value: boolean) => void;
  setBiometricsEnabled: (value: boolean) => void;
  setBiometricEmail: (email: string | null) => void;
  setBiometricUser: (user: User | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'English',
      notificationsEnabled: true,
      biometricsEnabled: false,
      biometricEmail: null,
      biometricUser: null,
      setLanguage: (language) => set({ language }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setBiometricsEnabled: (biometricsEnabled) => set({ biometricsEnabled }),
      setBiometricEmail: (biometricEmail) => set({ biometricEmail }),
      setBiometricUser: (biometricUser) => set({ biometricUser }),
    }),
    { name: 'metizo-settings', storage: createJSONStorage(() => zustandAsyncStorage) }
  )
);
