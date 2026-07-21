import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useForgotPassword } from '@/hooks/queries/useAuth';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const forgotPassword = useForgotPassword();
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  async function handleSend() {
    try {
      await forgotPassword.mutateAsync(email);
      router.push({ pathname: '/(auth)/otp', params: { destination: email, next: 'reset-new-password' } });
    } catch {
      toast.show('Could not send reset code. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.backRow}>
        <BackButton />
      </View>
      <View style={styles.body}>
        <View style={styles.card}>
          <View style={{ gap: 8 }}>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>
              Enter your email and we&apos;ll send you a code to reset your password.
            </Text>
          </View>
          <Input
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            icon={<Mail size={18} color="#64748B" />}
            value={email}
            onChangeText={setEmail}
          />
          <Button label="Send Reset Code" size="lg" loading={forgotPassword.isPending} disabled={!email} onPress={handleSend} />
        </View>
      </View>
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
