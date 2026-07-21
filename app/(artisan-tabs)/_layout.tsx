import { Tabs } from 'expo-router';
import { AnimatedTabBar } from '@/components/ui/AnimatedTabBar';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function ArtisanTabLayout() {
  const colors = useThemeColors();

  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} accentColor={colors.artisan} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Job Feed' }} />
      <Tabs.Screen name="jobs" options={{ title: 'My Work' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
