import { Tabs } from 'expo-router';
import { AnimatedTabBar } from '@/components/ui/AnimatedTabBar';
import { useTranslation } from '@/hooks/use-translation';

export default function TabLayout() {
  const { t } = useTranslation();
  return (
    <Tabs tabBar={(props) => <AnimatedTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('tab_home') }} />
      <Tabs.Screen name="categories" options={{ title: t('tab_categories') }} />
      <Tabs.Screen name="jobs" options={{ title: t('tab_jobs') }} />
      <Tabs.Screen name="messages" options={{ title: t('tab_messages') }} />
      <Tabs.Screen name="profile" options={{ title: t('tab_profile') }} />
    </Tabs>
  );
}
