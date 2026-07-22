import * as SecureStore from 'expo-secure-store';
import { apiClient } from './api/client';
import { mockDelay } from './mockDelay';
import { env } from '@/config/env';
import { User, UserRole } from '@/types/user';

interface AuthResponse {
  user: User;
  accessToken: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  category?: string;
  bio?: string;
  location?: string;
}

// Backend DTO: { token, userId, fullName, email, role: 'CUSTOMER'|'ARTISAN'|'ADMIN' }.
interface BackendAuthResponse {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: 'CUSTOMER' | 'ARTISAN' | 'ADMIN';
}

function toUser(res: BackendAuthResponse): User {
  return {
    id: String(res.userId),
    name: res.fullName,
    email: res.email,
    role: res.role === 'ARTISAN' ? 'artisan' : 'customer',
    createdAt: new Date().toISOString(),
  };
}

function mockUser(email: string, role: UserRole = 'customer'): User {
  return {
    // Artisans map to mockArtisans[0] ('a1', Kwame Mensah) so the mock profile,
    // portfolio and job feed all resolve to the same pre-populated test identity
    // (useUpdateMyProfile's mock branch already assumes 'a1' — this keeps them in sync).
    id: role === 'artisan' ? 'a1' : 'u1',
    name: email.split('@')[0].replace(/[._]/g, ' ') || 'Metizo User',
    email,
    role,
    createdAt: new Date().toISOString(),
  };
}

export const authService = {
  async login(email: string, password: string, role: UserRole = 'customer'): Promise<AuthResponse> {
    if (env.useMockData) {
      const response = { user: mockUser(email, role), accessToken: 'mock-access' };
      await mockDelay(null, 900);
      await SecureStore.setItemAsync('metizo-access-token', response.accessToken);
      return response;
    }
    const { data } = await apiClient.post<BackendAuthResponse>('/auth/login', { email, password });
    await SecureStore.setItemAsync('metizo-access-token', data.token);
    return { user: toUser(data), accessToken: data.token };
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    const { name, email, password, role, category, bio, location } = input;
    if (env.useMockData) {
      const response = { user: { ...mockUser(email, role), name }, accessToken: 'mock-access' };
      await mockDelay(null, 900);
      await SecureStore.setItemAsync('metizo-access-token', response.accessToken);
      return response;
    }
    const { data } = await apiClient.post<BackendAuthResponse>('/auth/register', {
      fullName: name,
      email,
      password,
      role: role === 'artisan' ? 'ARTISAN' : 'CUSTOMER',
      category,
      bio,
      location,
    });
    await SecureStore.setItemAsync('metizo-access-token', data.token);
    return { user: toUser(data), accessToken: data.token };
  },

  // Register() above already triggers the backend to email a real 4-digit code.
  // These verify/resend it for real (Resend) — the user is already authenticated
  // by register() by the time this runs; email verification is a trust signal,
  // not a login gate, matching how the account is already usable meanwhile.
  async verifyEmail(email: string, code: string): Promise<{ verified: boolean }> {
    if (env.useMockData) return mockDelay({ verified: code.length === 4 }, 700);
    try {
      await apiClient.post('/auth/verify-email', { email, code });
      return { verified: true };
    } catch {
      return { verified: false };
    }
  },

  async resendVerification(email: string): Promise<{ sent: boolean }> {
    if (env.useMockData) return mockDelay({ sent: true }, 700);
    await apiClient.post('/auth/resend-verification', { email });
    return { sent: true };
  },

  // Real password-reset flow: emails an actual 4-digit code via the backend (Resend),
  // hashed + expiring server-side. reset() verifies the code and sets the new password
  // in one call (the backend has no separate "verify code" step).
  //
  // devCode is only ever non-null when the backend has no email provider
  // configured — lets the app skip straight to the new-password screen
  // instead of the user hunting through server logs. With a real provider
  // configured, it's always null and the normal "check your email" flow applies.
  async forgotPassword(email: string): Promise<{ devCode: string | null }> {
    const { data } = await apiClient.post<{ devCode: string | null }>('/auth/forgot-password', { email });
    return data;
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { email, code, newPassword });
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('metizo-access-token');
  },
};
