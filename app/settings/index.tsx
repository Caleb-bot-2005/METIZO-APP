import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import {
  Bell,
  ChevronRight,
  FileText,
  Fingerprint,
  Globe,
  Info,
  Lock,
  Moon,
  Server,
  Trash2,
} from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, ThemeMode } from '@/store/themeStore';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslation } from '@/hooks/use-translation';
import { ThemeColors } from '@/theme/colors';

export default function SettingsScreen() {
  const {
    language,
    notificationsEnabled,
    setNotificationsEnabled,
    biometricsEnabled,
    setBiometricsEnabled,
    setBiometricEmail,
    setBiometricUser,
  } = useSettingsStore();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();

  const themeModes: { key: ThemeMode; label: string }[] = [
    { key: 'light', label: t('settings_theme_light') },
    { key: 'dark', label: t('settings_theme_dark') },
    { key: 'system', label: t('settings_theme_system') },
  ];

  async function toggleBiometrics(value: boolean) {
    if (!value) {
      setBiometricsEnabled(false);
      setBiometricEmail(null);
      setBiometricUser(null);
      await SecureStore.deleteItemAsync('metizo-biometric-token');
      return;
    }
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      toast.show('This device does not support biometric authentication', 'error');
      return;
    }
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      toast.show('No fingerprint or face ID is set up on this device', 'error');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirm to enable biometric login' });
    if (!result.success) {
      toast.show('Biometric verification failed', 'error');
      return;
    }
    // Snapshot the currently-active session so biometric unlock can restore it
    // later without a network call (the backend has no passwordless login).
    const activeToken = await SecureStore.getItemAsync('metizo-access-token');
    if (!activeToken || !user) {
      toast.show('Could not enable biometric login right now. Please try again.', 'error');
      return;
    }
    await SecureStore.setItemAsync('metizo-biometric-token', activeToken);
    setBiometricUser(user);
    setBiometricsEnabled(true);
    setBiometricEmail(user.email);
    toast.show('Biometric login enabled', 'success');
  }

  function confirmDelete() {
    Alert.alert('Delete Account', 'This will permanently delete your account and all data. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>{t('settings_title')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
        <Section title={t('settings_preferences')} styles={styles}>
          <Row icon={Bell} label={t('settings_push_notifications')} styles={styles} colors={colors}>
            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ true: '#0A84FF' }} />
          </Row>
          <RowLink icon={Globe} label={t('settings_language')} value={language} onPress={() => router.push('/settings/language')} styles={styles} colors={colors} />
          <Row icon={Moon} label={t('settings_appearance')} styles={styles} colors={colors}>
            <View style={styles.themeSwitcher}>
              {themeModes.map((m) => (
                <AnimatedPressable
                  key={m.key}
                  onPress={() => setThemeMode(m.key)}
                  style={[styles.themeChip, themeMode === m.key ? styles.themeChipActive : null]}>
                  <Text style={[styles.themeChipLabel, themeMode === m.key ? styles.themeChipLabelActive : null]}>{m.label}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </Row>
        </Section>

        <Section title={t('settings_privacy_security')} styles={styles}>
          <Row icon={Fingerprint} label={t('settings_biometric_login')} styles={styles} colors={colors}>
            <Switch value={biometricsEnabled} onValueChange={toggleBiometrics} trackColor={{ true: '#0A84FF' }} />
          </Row>
          <RowLink icon={Lock} label={t('settings_change_password')} onPress={() => router.push('/(auth)/forgot-password')} styles={styles} colors={colors} />
        </Section>

        <Section title="Connection" styles={styles}>
          <RowLink icon={Server} label="Server Connection" onPress={() => router.push('/settings/server')} styles={styles} colors={colors} />
        </Section>

        <Section title={t('settings_about_section')} styles={styles}>
          <RowLink icon={Info} label={t('settings_about_metizo')} onPress={() => router.push('/settings/about')} styles={styles} colors={colors} />
          <RowLink icon={FileText} label={t('settings_terms')} onPress={() => router.push('/settings/about')} styles={styles} colors={colors} />
        </Section>

        <AnimatedPressable onPress={confirmDelete} style={styles.deleteRow}>
          <Trash2 size={17} color="#EF4444" />
          <Text style={styles.deleteLabel}>{t('settings_delete_account')}</Text>
        </AnimatedPressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type SettingsStyles = ReturnType<typeof createStyles>;

function Section({ title, children, styles }: { title: string; children: React.ReactNode; styles: SettingsStyles }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  icon: Icon,
  label,
  children,
  styles,
  colors,
}: {
  icon: typeof Bell;
  label: string;
  children: React.ReactNode;
  styles: SettingsStyles;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Icon size={16} color={colors.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function RowLink({
  icon: Icon,
  label,
  value,
  onPress,
  styles,
  colors,
}: {
  icon: typeof Bell;
  label: string;
  value?: string;
  onPress: () => void;
  styles: SettingsStyles;
  colors: ThemeColors;
}) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.row}>
      <View style={styles.iconWrap}>
        <Icon size={16} color={colors.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <ChevronRight size={16} color={colors.textSecondary} />
    </AnimatedPressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 4 },
    sectionBody: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.background },
    iconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },
    rowValue: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    deleteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: `${colors.danger}1A`, borderRadius: 16, padding: 16 },
    deleteLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.danger },
    themeSwitcher: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 999, padding: 3, gap: 2 },
    themeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    themeChipActive: { backgroundColor: colors.primary },
    themeChipLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.textSecondary },
    themeChipLabelActive: { color: '#FFFFFF' },
  });
}
