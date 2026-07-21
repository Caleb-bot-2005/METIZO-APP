import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { env } from '@/config/env';
import { useAuthStore } from '@/store/authStore';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('metizo-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isHandlingSessionExpiry = false;

// The backend issues a single long-lived JWT (no refresh endpoint) — on a 401 the
// token is simply invalid or expired (e.g. a stale token from before this device
// switched from mock data to the real backend). Previously this only cleared the
// stored token and left the caller to notice, which meant screens failed silently
// with no feedback. Now it actually logs the user out and sends them to log back in.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isHandlingSessionExpiry) {
      isHandlingSessionExpiry = true;
      await SecureStore.deleteItemAsync('metizo-access-token');
      useAuthStore.getState().logout();
      router.replace('/(auth)/login');
      setTimeout(() => {
        isHandlingSessionExpiry = false;
      }, 1000);
    }
    return Promise.reject(error);
  }
);
