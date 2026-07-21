import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { useToast } from '@/components/ui/Toast';
import { useResetPassword } from '@/hooks/queries/useAuth';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function NewPasswordScreen() {
  const { email, code } = useLocalSearchParams<{ email?: string; code?: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const resetPassword = useResetPassword();
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const tooShort = password.length < 6;
  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit() {
    try {
      await resetPassword.mutateAsync({ email: email ?? '', code: code ?? '', newPassword: password });
      router.replace({ pathname: '/(auth)/success', params: { mode: 'reset-success' } });
    } catch {
      toast.show('That code is invalid or has expired. Please request a new one.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.backRow}>
          <BackButton />
        </View>
        <View style={styles.body}>
          <View style={styles.card}>
            <View style={{ gap: 8 }}>
              <Text style={styles.title}>Set a new password</Text>
              <Text style={styles.subtitle}>Choose a new password for {email ?? 'your account'}.</Text>
            </View>

            <View>
              <Input
                label="New password"
                placeholder="••••••••"
                isPassword
                icon={<Lock size={18} color="#64748B" />}
                value={password}
                onChangeText={setPassword}
              />
              <PasswordStrength password={password} />
            </View>

            <Input
              label="Confirm password"
              placeholder="••••••••"
              isPassword
              icon={<Lock size={18} color="#64748B" />}
              error={mismatch ? 'Passwords do not match' : undefined}
              value={confirm}
              onChangeText={setConfirm}
            />

            <Button
              label="Reset Password"
              size="lg"
              loading={resetPassword.isPending}
              disabled={tooShort || mismatch || confirm.length === 0}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    backRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 },
    body: { paddingHorizontal: 24, paddingTop: 24, gap: 24 },
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
  });
}
