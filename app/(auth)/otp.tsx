import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useForgotPassword, useResendVerification, useVerifyEmail } from '@/hooks/queries/useAuth';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function OtpScreen() {
  const { destination, next } = useLocalSearchParams<{ destination?: string; next?: string }>();
  const [digits, setDigits] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const inputs = useRef<(TextInput | null)[]>([]);
  const verifyEmail = useVerifyEmail();
  const resendVerification = useResendVerification();
  const forgotPassword = useForgotPassword();
  const toast = useToast();
  const isPasswordReset = next === 'reset-new-password';

  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  function handleChange(value: string, index: number) {
    const next4 = [...digits];
    next4[index] = value.slice(-1);
    setDigits(next4);
    if (value && index < 3) inputs.current[index + 1]?.focus();
  }

  async function handleVerify() {
    const code = digits.join('');
    // The backend has no separate "verify code" step for password reset — the
    // code is checked together with the new password in one call, so just carry
    // it forward to the new-password screen instead of verifying it here.
    if (isPasswordReset) {
      router.push({ pathname: '/(auth)/new-password', params: { email: destination ?? '', code } });
      return;
    }
    try {
      const result = await verifyEmail.mutateAsync({ destination: destination ?? '', code });
      if (!result.verified) {
        toast.show('Invalid code, please try again.', 'error');
        return;
      }
      router.replace({ pathname: '/(auth)/success', params: { mode: next ?? 'verify-email' } });
    } catch {
      toast.show('Verification failed. Please try again.', 'error');
    }
  }

  async function handleResend() {
    try {
      if (isPasswordReset) {
        await forgotPassword.mutateAsync(destination ?? '');
      } else {
        await resendVerification.mutateAsync(destination ?? '');
      }
      setTimer(30);
      toast.show('Code resent', 'success');
    } catch {
      toast.show('Could not resend the code. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.backRow}>
        <BackButton />
      </View>
      <View style={styles.body}>
        <View style={{ gap: 8 }}>
          <Text style={styles.title}>Verify your code</Text>
          <Text style={styles.subtitle}>
            Enter the 4-digit code we sent to {destination ?? 'your email'}
          </Text>
        </View>

        <View style={styles.digitsRow}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              value={digit}
              onChangeText={(value) => handleChange(value, index)}
              keyboardType="number-pad"
              maxLength={1}
              style={[styles.digitInput, { borderColor: digit ? colors.primary : colors.border }]}
            />
          ))}
        </View>

        <Button
          label="Verify"
          size="lg"
          loading={verifyEmail.isPending}
          disabled={digits.some((d) => !d)}
          onPress={handleVerify}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Didn&apos;t receive a code?</Text>
          {timer > 0 ? (
            <Text style={styles.footerText}>Resend in {timer}s</Text>
          ) : (
            <Text style={styles.footerLink} onPress={handleResend}>
              Resend
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    backRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 },
    body: { paddingHorizontal: 24, paddingTop: 24, gap: 32 },
    title: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text },
    subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
    digitsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
    digitInput: {
      fontFamily: 'Inter_700Bold',
      fontSize: 24,
      color: colors.text,
      backgroundColor: colors.card,
      borderRadius: 16,
      textAlign: 'center',
      borderWidth: 1,
      width: 60,
      height: 64,
    },
    footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
    footerText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
    footerLink: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
  });
}
