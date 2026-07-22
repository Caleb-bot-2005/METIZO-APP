import { create } from 'zustand';

// Scratch buffer for the emergency request's location while the form is open —
// separate from jobStore's draft since it's a distinct, one-tap flow (not the
// multi-step job wizard) and shouldn't share/clobber that draft's state.
interface EmergencyLocationState {
  latitude?: number;
  longitude?: number;
  address?: string;
  setLocation: (loc: { latitude: number; longitude: number; address: string }) => void;
  reset: () => void;
}

export const useEmergencyStore = create<EmergencyLocationState>((set) => ({
  latitude: undefined,
  longitude: undefined,
  address: undefined,
  setLocation: (loc) => set(loc),
  reset: () => set({ latitude: undefined, longitude: undefined, address: undefined }),
}));
