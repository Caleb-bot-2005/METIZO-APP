import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/user';

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: ({ email, password, role }: { email: string; password: string; role?: UserRole }) =>
      authService.login(email, password, role),
    onSuccess: (data) => setUser(data.user),
  });
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

export function useRegister() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
    onSuccess: (data) => setUser(data.user),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: ({ destination, code }: { destination: string; code: string }) =>
      authService.verifyEmail(destination, code),
  });
}

export function useResendVerification() {
  return useMutation({ mutationFn: (destination: string) => authService.resendVerification(destination) });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => authService.forgotPassword(email) });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ email, code, newPassword }: { email: string; code: string; newPassword: string }) =>
      authService.resetPassword(email, code, newPassword),
  });
}
