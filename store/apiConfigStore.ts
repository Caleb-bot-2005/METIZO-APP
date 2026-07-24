import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandAsyncStorage } from '@/utils/storage';
import { env } from '@/config/env';

interface ApiConfigState {
  // null = use the build-time default (env.apiBaseUrl). Set once someone
  // overrides it from the Server Connection settings screen — lets the app
  // point at a new backend address (LAN IP change, tunnel URL, etc.) without
  // editing .env and restarting Metro every time the network changes.
  apiBaseUrlOverride: string | null;
  setApiBaseUrlOverride: (url: string | null) => void;
}

export const useApiConfigStore = create<ApiConfigState>()(
  persist(
    (set) => ({
      apiBaseUrlOverride: null,
      setApiBaseUrlOverride: (apiBaseUrlOverride) => set({ apiBaseUrlOverride }),
    }),
    { name: 'metizo-api-config', storage: createJSONStorage(() => zustandAsyncStorage) }
  )
);

// Strips a trailing slash so callers can append paths like `${apiBaseUrl}/requests` consistently.
export function getActiveApiBaseUrl(): string {
  const override = useApiConfigStore.getState().apiBaseUrlOverride;
  const url = override && override.trim() ? override.trim() : env.apiBaseUrl;
  return url.replace(/\/+$/, '');
}

// Origin only (no /api suffix) — for resolving relative image URLs the backend
// returns (see workPhotoService/portfolioService), kept in sync with whatever
// server the app is currently pointed at.
export function getActiveApiOrigin(): string {
  return getActiveApiBaseUrl().replace(/\/api\/?$/, '');
}
