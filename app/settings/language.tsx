import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useSettingsStore } from '@/store/settingsStore';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslation } from '@/hooks/use-translation';
import { languages } from '@/i18n/translations';
import { ThemeColors } from '@/theme/colors';

export default function LanguageScreen() {
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>{t('settings_language')}</Text>
      </View>
      <FlatList
        data={languages}
        keyExtractor={(item) => item}
        contentContainerStyle={{ padding: 24, gap: 8 }}
        renderItem={({ item }) => (
          <AnimatedPressable
            onPress={() => {
              setLanguage(item);
              router.back();
            }}
            style={styles.row}>
            <Text style={styles.label}>{item}</Text>
            {language === item ? <Check size={18} color={colors.primary} /> : null}
          </AnimatedPressable>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: 16, padding: 16 },
    label: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },
  });
}
