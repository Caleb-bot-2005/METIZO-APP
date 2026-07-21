import { useSettingsStore } from '@/store/settingsStore';
import { LanguageName, translations } from '@/i18n/translations';

export function useTranslation() {
  const language = useSettingsStore((s) => s.language) as LanguageName;
  const dict = translations[language] ?? translations.English;

  function t(key: keyof typeof translations['English']): string {
    return dict[key] ?? translations.English[key] ?? key;
  }

  return { t, language };
}
