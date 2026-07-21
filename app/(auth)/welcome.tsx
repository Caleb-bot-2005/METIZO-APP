import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { gradients } from '@/theme/colors';

export default function WelcomeScreen() {
  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <Logo size={40} color="#FFFFFF" dotColor="#FACC15" />
          </View>
          <Text style={styles.title}>Welcome to METIZO</Text>
          <Text style={styles.subtitle}>
            The smartest way to hire trusted artisans — post a job, compare bids, and pay securely.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Button label="Create Account" variant="gold" size="lg" onPress={() => router.push('/(auth)/register')} />
          <Button label="Log In" variant="outline-light" size="lg" onPress={() => router.push('/(auth)/login')} />
          <Text style={styles.terms}>By continuing you agree to our Terms & Privacy Policy</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 32 },
  hero: { alignItems: 'center', gap: 16, marginTop: 64 },
  iconWrap: { width: 64, height: 64, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 30, color: '#FFFFFF' },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 16, color: 'rgba(255,255,255,0.75)', textAlign: 'center', paddingHorizontal: 16, lineHeight: 24 },
  terms: { fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8 },
});
