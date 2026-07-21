import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandAsyncStorage } from '@/utils/storage';
import { Address } from '@/types/user';

interface LocationState {
  currentAddress: Address | null;
  savedAddresses: Address[];
  permissionGranted: boolean;
  setCurrentAddress: (address: Address) => void;
  // Upserts by id into savedAddresses (replacing the old blind-append), and makes
  // it the active currentAddress. When makeDefault is true, every other saved
  // address is cleared of isDefault first.
  saveAddress: (address: Address, makeDefault?: boolean) => void;
  // Picks an already-saved address as the active one — this is the "choose your
  // preferred location" action used by the saved-addresses screen.
  selectAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  removeSavedAddress: (id: string) => void;
  setPermissionGranted: (granted: boolean) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      currentAddress: null,
      savedAddresses: [],
      permissionGranted: false,
      setCurrentAddress: (address) => set({ currentAddress: address }),
      saveAddress: (address, makeDefault) =>
        set((s) => {
          const finalAddress = makeDefault ? { ...address, isDefault: true } : address;
          const exists = s.savedAddresses.some((a) => a.id === address.id);
          const savedAddresses = (
            exists ? s.savedAddresses.map((a) => (a.id === address.id ? finalAddress : a)) : [...s.savedAddresses, finalAddress]
          ).map((a) => (makeDefault && a.id !== address.id ? { ...a, isDefault: false } : a));
          return { savedAddresses, currentAddress: finalAddress };
        }),
      selectAddress: (id) =>
        set((s) => {
          const found = s.savedAddresses.find((a) => a.id === id);
          return found ? { currentAddress: found } : {};
        }),
      setDefaultAddress: (id) =>
        set((s) => {
          const savedAddresses = s.savedAddresses.map((a) => ({ ...a, isDefault: a.id === id }));
          const chosen = savedAddresses.find((a) => a.id === id);
          return { savedAddresses, currentAddress: chosen ?? s.currentAddress };
        }),
      removeSavedAddress: (id) =>
        set((s) => ({
          savedAddresses: s.savedAddresses.filter((a) => a.id !== id),
          currentAddress: s.currentAddress?.id === id ? null : s.currentAddress,
        })),
      setPermissionGranted: (granted) => set({ permissionGranted: granted }),
    }),
    {
      name: 'metizo-location',
      storage: createJSONStorage(() => zustandAsyncStorage),
    }
  )
);
