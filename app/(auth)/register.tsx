import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { Briefcase, Lock, Mail, User, UserCircle } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { useRegister, useVerifyEmail } from '@/hooks/queries/useAuth';
import { serviceCategories } from '@/constants/categories';
import { UserRole } from '@/types/user';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const schema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const register = useRegister();
  const verifyEmail = useVerifyEmail();
  const toast = useToast();
  const password = watch('password');

  const [role, setRole] = useState<UserRole>('customer');
  const [category, setCategory] = useState<string | undefined>();
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [categoryError, setCategoryError] = useState<string | undefined>();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  async function onSubmit(values: FormValues) {
    if (role === 'artisan' && !category) {
      setCategoryError('Choose the service you offer');
      return;
    }
    try {
      const result = await register.mutateAsync({
        ...values,
        role,
        ...(role === 'artisan' ? { category, bio, location } : {}),
      });
      if (result.devVerificationCode) {
        // No email provider configured on this backend — the verification code
        // can't actually be emailed, so verify automatically instead of
        // stranding the new account on an OTP screen for a code that never arrives.
        try {
          await verifyEmail.mutateAsync({ destination: values.email, code: result.devVerificationCode });
        } catch {
          // Even if auto-verify somehow fails, the account is already fully
          // usable (see authService's note: verification isn't a login gate).
        }
        router.replace({ pathname: '/(auth)/success', params: { mode: 'verify-email' } });
        return;
      }
      router.push({ pathname: '/(auth)/otp', params: { destination: values.email, next: 'verify-email' } });
    } catch {
      toast.show('Unable to create account. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.backRow}>
          <BackButton />
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={{ gap: 6 }}>
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>Join thousands who trust METIZO for home services.</Text>
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
                name="name"
                render={({ field }) => (
                  <Input
                    label="Full name"
                    placeholder="Kwame Mensah"
                    icon={<User size={18} color="#64748B" />}
                    error={errors.name?.message}
                    value={field.value}
                    onChangeText={field.onChange}
                  />
                )}
              />
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
              <View>
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
                <PasswordStrength password={password} />
              </View>

              {role === 'artisan' ? (
                <View style={{ gap: 16 }}>
                  <View style={{ gap: 8 }}>
                    <Text style={styles.fieldLabel}>What service do you offer?</Text>
                    <View style={styles.categoryGrid}>
                      {serviceCategories.map((c) => (
                        <AnimatedPressable
                          key={c.id}
                          onPress={() => {
                            setCategory(c.id);
                            setCategoryError(undefined);
                          }}
                          style={[styles.categoryChip, category === c.id ? styles.categoryChipActive : null]}>
                          <Text style={[styles.categoryChipLabel, category === c.id ? styles.categoryChipLabelActive : null]}>
                            {c.name}
                          </Text>
                        </AnimatedPressable>
                      ))}
                    </View>
                    {categoryError ? <Text style={styles.error}>{categoryError}</Text> : null}
                  </View>
                  <Input label="Location" placeholder="East Legon, Accra" value={location} onChangeText={setLocation} />
                  <Input
                    label="Short bio (optional)"
                    placeholder="Tell customers about your experience..."
                    multiline
                    style={{ minHeight: 70, textAlignVertical: 'top' }}
                    value={bio}
                    onChangeText={setBio}
                  />
                </View>
              ) : null}
            </View>

            <Button label="Create Account" size="lg" loading={register.isPending} onPress={handleSubmit(onSubmit)} />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Text style={styles.footerLink} onPress={() => router.push('/(auth)/login')}>
              Log in
            </Text>
          </View>
        </ScrollView>
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
    <AnimatedPressable
      onPress={onPress}
      style={[styles.roleOption, selected ? { backgroundColor: tint } : null]}>
      <Icon size={18} color={selected ? '#FFFFFF' : colors.primary} />
      <Text style={[styles.roleOptionLabel, selected ? styles.roleOptionLabelActive : null]}>{label}</Text>
    </AnimatedPressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    backRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 },
    body: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, gap: 24 },
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
    title: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text },
    subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
    roleSwitcher: { flexDirection: 'row', gap: 8, backgroundColor: colors.background, borderRadius: 16, padding: 4 },
    roleOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
    roleOptionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary },
    roleOptionLabelActive: { color: '#FFFFFF' },
    fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryChip: { backgroundColor: colors.background, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: colors.border },
    categoryChipActive: { backgroundColor: colors.artisan, borderColor: colors.artisan },
    categoryChipLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text },
    categoryChipLabelActive: { color: '#FFFFFF' },
    error: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.danger },
    footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
    footerText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
    footerLink: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
  });
}
