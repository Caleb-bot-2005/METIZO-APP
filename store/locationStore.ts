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

// Collapses any pre-existing duplicate Home/Work entries left over from before
// saveAddress() enforced singular slots, so already-installed apps self-heal
// on next launch instead of showing a row of repeated Home chips forever.
function dedupeSavedAddresses(addresses: Address[]): Address[] {
  const slots = new Map<string, Address>();
  const others: Address[] = [];
  for (const address of addresses) {
    if (address.label === 'Other') {
      others.push(address);
      continue;
    }
    const current = slots.get(address.label);
    if (!current || address.isDefault || !current.isDefault) {
      slots.set(address.label, address);
    }
  }
  return [...slots.values(), ...others];
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
          // Home/Work are singular slots — re-saving one (e.g. running the
          // location flow again) should replace that slot, not pile up another
          // "Home" chip. Other has no such limit since it covers arbitrary places.
          const sameSlot =
            address.label !== 'Other' ? s.savedAddresses.find((a) => a.label === address.label) : undefined;
          const targetId = sameSlot?.id ?? address.id;
          const finalAddress = { ...address, id: targetId, isDefault: makeDefault ? true : address.isDefault };
          const exists = s.savedAddresses.some((a) => a.id === targetId);
          const savedAddresses = (
            exists ? s.savedAddresses.map((a) => (a.id === targetId ? finalAddress : a)) : [...s.savedAddresses, finalAddress]
          ).map((a) => (makeDefault && a.id !== targetId ? { ...a, isDefault: false } : a));
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
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<LocationState>) };
        return { ...merged, savedAddresses: dedupeSavedAddresses(merged.savedAddresses) };
      },
    }
  )
);
