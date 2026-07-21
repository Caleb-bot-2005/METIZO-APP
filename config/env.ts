const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';

export const env = {
  apiBaseUrl,
  // Origin only (no /api suffix) — for resolving relative image URLs returned by the backend.
  apiOrigin: apiBaseUrl.replace(/\/api\/?$/, ''),
  // Real backend only covers auth, jobs/requests, bidding, artisans, pricing and
  // escrow (read-only). Messaging, notifications, marketplace and the wallet/payment-
  // methods screens have no backend yet, so those services stay on mock data
  // regardless of this flag (see the relevant service files).
  useMockData: process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true',
};
