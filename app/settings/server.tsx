import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Server } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useApiConfigStore, getActiveApiBaseUrl } from '@/store/apiConfigStore';
import { env } from '@/config/env';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { ThemeColors } from '@/theme/colors';

// Lets the server address be changed from inside the running app — the LAN
// IP, tunnel URL, etc. can change at any time, and previously the only way
// to point the app at a new one was editing .env and restarting Metro.
export default function ServerConnectionScreen() {
  const override = useApiConfigStore((s) => s.apiBaseUrlOverride);
  const setOverride = useApiConfigStore((s) => s.setApiBaseUrlOverride);
  const [url, setUrl] = useState(override ?? env.apiBaseUrl);
  const [testing, setTesting] = useState(false);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  async function testConnection(testUrl: string) {
    setTesting(true);
    try {
      const base = testUrl.trim().replace(/\/+$/, '');
      const { status } = await axios.get(`${base}/pricing/categories`, { timeout: 8000 });
      if (status === 200) {
        toast.show('Connected successfully!', 'success');
        return true;
      }
      toast.show(`Server responded but with an unexpected status (${status}).`, 'error');
      return false;
    } catch {
      toast.show("Couldn't reach that address. Double-check it and try again.", 'error');
      return false;
    } finally {
      setTesting(false);
    }
  }

  async function save() {
    if (!url.trim()) {
      toast.show('Enter a server address first.', 'error');
      return;
    }
    const ok = await testConnection(url);
    if (ok) {
      setOverride(url.trim());
      toast.show('Server address saved.', 'success');
    }
  }

  function resetToDefault() {
    setOverride(null);
    setUrl(env.apiBaseUrl);
    toast.show('Reset to the default server address.', 'success');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Server Connection</Text>
      </View>
      <View style={{ padding: 24, gap: 20 }}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Server size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Currently connected to</Text>
          </View>
          <Text style={styles.currentUrl} numberOfLines={2}>
            {getActiveApiBaseUrl()}
          </Text>
        </View>

        <Input
          label="API server address"
          placeholder="http://192.168.1.10:8080/api"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          value={url}
          onChangeText={setUrl}
        />
        <Text style={styles.hint}>
          Change this if the backend moved — a new Wi-Fi IP, a tunnel URL, or any other server address. &quot;Test
          Connection&quot; checks it before saving.
        </Text>

        <View style={{ gap: 12 }}>
          <Button label="Test Connection" variant="outline" loading={testing} onPress={() => testConnection(url)} />
          <Button label="Save" loading={testing} onPress={save} />
          {override ? <Button label="Reset to Default" variant="ghost" onPress={resetToDefault} /> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.textSecondary },
    currentUrl: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text },
    hint: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  });
}
