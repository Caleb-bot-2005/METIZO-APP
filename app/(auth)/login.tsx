import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Briefcase, Fingerprint, Lock, Mail, UserCircle } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { useLogin } from '@/hooks/queries/useAuth';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { env } from '@/config/env';
import { getHomeRoute } from '@/utils/navigation';
import { UserRole } from '@/types/user';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

function roleWelcomeMessage(role: string | undefined) {
  return role === 'artisan' ? "Welcome back — you're in as an Artisan." : "Welcome back — you're in as a Customer.";
}

export default function LoginScreen() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  const login = useLogin();
  const toast = useToast();
  const biometricsEnabled = useSettingsStore((s) => s.biometricsEnabled);
  const biometricEmail = useSettingsStore((s) => s.biometricEmail);
  const setBiometricEmail = useSettingsStore((s) => s.setBiometricEmail);
  const setBiometricUser = useSettingsStore((s) => s.setBiometricUser);
  const [role, setRole] = useState<UserRole>('customer');
  const colors = useThemeColors();
  const styles = createStyles(colors);

  async function onSubmit(values: FormValues) {
    try {
      const { user, accessToken } = await login.mutateAsync({ ...values, role });
      // The role toggle above is just a UI hint for which portal the user expects —
      // the account's real role always comes from the backend. If the user forgot
      // to switch tabs before logging in, trust the backend's role rather than
      // rejecting a valid login; just let them know which portal they landed in.
      if (user.role !== role) {
        setRole(user.role);
      }
      if (biometricsEnabled) {
        setBiometricEmail(values.email);
        setBiometricUser(user);
        // Snapshot the real token under its own key so it survives a later
        // logout() (which deletes the active session token) — biometric unlock
        // restores from this snapshot instead of re-authenticating.
        await SecureStore.setItemAsync('metizo-biometric-token', accessToken);
      }
      toast.show(roleWelcomeMessage(user.role), 'success');
      // Mock data has nothing to geolocate against — don't gate a test login
      // behind real device GPS permission, which may never resolve in a
      // simulator/emulator with no location fix.
      if (env.useMockData) {
        useLocationStore.getState().setPermissionGranted(true);
        router.replace(getHomeRoute(user.role));
      } else {
        router.replace('/(location)/permission');
      }
    } catch (error: any) {
      if (!error?.response) {
        toast.show("Can't reach the server. Check your connection and try again.", 'error');
      } else if (error.response.status === 401 || error.response.status === 400) {
        toast.show(error.response.data?.message ?? 'Invalid email or password.', 'error');
      } else {
        toast.show('Unable to log in. Please try again.', 'error');
      }
    }
  }

  // The backend only supports real password auth — there's no passwordless/biometric
  // endpoint. Sending a fake password here would always fail, so instead biometric
  // unlock is a *local* gate: Face ID/fingerprint confirms it's really you, then we
  // restore the session from the token snapshotted at the last real login, with no
  // network call. If that token has since expired, the app's normal 401 handling
  // (services/api/client.ts) will catch it on the first real request and send the
  // user back to log in for real.
  async function onBiometricLogin() {
    if (!biometricEmail) return;
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Log in to METIZO' });
    if (!result.success) return;

    const { biometricUser } = useSettingsStore.getState();
    const token = await SecureStore.getItemAsync('metizo-biometric-token');
    if (!biometricUser || !token) {
      toast.show('Biometric session expired — please log in with your password.', 'error');
      return;
    }

    await SecureStore.setItemAsync('metizo-access-token', token);
    useAuthStore.getState().setUser(biometricUser);
    toast.show(roleWelcomeMessage(biometricUser.role), 'success');
    router.replace('/(location)/permission');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.backRow}>
          <BackButton />
        </View>
        <View style={styles.body}>
          <View style={styles.card}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <View style={styles.shieldWrap}>
                <Logo size={30} color="#FFFFFF" />
              </View>
              <View style={{ gap: 4, alignItems: 'center' }}>
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>Log in to continue booking trusted artisans.</Text>
              </View>
            </View>

            <View style={styles.roleSwitcher}>
              <RoleOption
                icon={UserCircle}
                label="I need a service"
                selected={role === 'customer'}
                onPress={() => setRole('customer')}
              />
              <RoleOption
                icon={Briefcase}
                label="I'm an artisan"
                selected={role === 'artisan'}
                onPress={() => setRole('artisan')}
                activeColor={colors.artisan}
              />
            </View>

            <View style={{ gap: 16 }}>
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <Input
                    label="Email"
                    placeholder="you@example.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    icon={<Mail size={18} color="#64748B" />}
                    error={errors.email?.message}
                    value={field.value}
                    onChangeText={field.onChange}
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <Input
                    label="Password"
                    placeholder="••••••••"
                    isPassword
                    icon={<Lock size={18} color="#64748B" />}
                    error={errors.password?.message}
                    value={field.value}
                    onChangeText={field.onChange}
                  />
                )}
              />
              <Text style={styles.forgotLink} onPress={() => router.push('/(auth)/forgot-password')}>
                Forgot password?
              </Text>
            </View>

            <Button label="Log In" size="lg" loading={login.isPending} onPress={handleSubmit(onSubmit)} />

            {biometricsEnabled && biometricEmail ? (
              <AnimatedPressable onPress={onBiometricLogin} style={styles.biometricRow}>
                <Fingerprint size={18} color="#0A84FF" />
                <Text style={styles.biometricLabel}>Log in with biometrics</Text>
              </AnimatedPressable>
            ) : null}
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <Text style={styles.footerLink} onPress={() => router.push('/(auth)/register')}>
              Sign up
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoleOption({
  icon: Icon,
  label,
  selected,
  onPress,
  activeColor,
}: {
  icon: typeof UserCircle;
  label: string;
  selected: boolean;
  onPress: () => void;
  activeColor?: string;
}) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const tint = activeColor ?? colors.primary;
  return (
    <AnimatedPressable onPress={onPress} style={[styles.roleOption, selected ? { backgroundColor: tint } : null]}>
      <Icon size={18} color={selected ? '#FFFFFF' : colors.primary} />
      <Text style={[styles.roleOptionLabel, selected ? styles.roleOptionLabelActive : null]}>{label}</Text>
    </AnimatedPressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    roleSwitcher: { flexDirection: 'row', gap: 8, backgroundColor: colors.background, borderRadius: 16, padding: 4 },
    roleOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
    roleOptionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary },
    roleOptionLabelActive: { color: '#FFFFFF' },
    backRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 },
    body: { paddingHorizontal: 24, paddingTop: 24, gap: 24, flex: 1 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 28,
      padding: 24,
      gap: 24,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#0F172A',
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    shieldWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text },
    subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    forgotLink: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary, textAlign: 'right' },
    biometricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 4 },
    biometricLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
    footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
    footerText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
    footerLink: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
  });
}
