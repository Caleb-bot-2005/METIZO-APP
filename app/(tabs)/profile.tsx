import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Crown,
  FileText,
  Heart,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
  Wallet,
} from 'lucide-react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { TabScreen } from '@/components/ui/TabScreen';
import { useAuthStore } from '@/store/authStore';
import { usePaymentStore } from '@/store/paymentStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { formatCurrency } from '@/utils/format';
import { gradients, ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const menuItems = [
  { icon: Heart, label: 'Saved Artisans', route: '/profile/saved-artisans' },
  { icon: MapPin, label: 'Saved Addresses', route: '/(location)/saved' },
  { icon: FileText, label: 'Invoices', route: '/payments/invoices' },
  { icon: ShoppingBag, label: 'Material Marketplace', route: '/marketplace' },
  { icon: Package, label: 'My Orders', route: '/marketplace/orders' },
  { icon: Bell, label: 'Notifications', route: '/notifications' },
  { icon: Settings, label: 'Settings', route: '/settings' },
] as const;

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const walletBalance = usePaymentStore((s) => s.walletBalance);
  const currentPlanId = useSubscriptionStore((s) => s.currentPlanId);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  function handleLogout() {
    logout();
    router.replace('/(auth)/welcome');
  }

  return (
    <TabScreen routeIndex={4}>
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.body}>
          <View style={styles.profileRow}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?img=68' }}
              style={{ width: 68, height: 68, borderRadius: 34 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user?.name ?? 'Metizo User'}</Text>
              <Text style={styles.email}>{user?.email ?? 'you@example.com'}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <AnimatedPressable onPress={() => router.push('/payments/wallet')} style={styles.walletCard}>
              <Wallet size={28} color="#0A84FF" />
              <Text style={styles.cardLabel}>Wallet</Text>
              <Text style={styles.cardValue}>{formatCurrency(walletBalance)}</Text>
            </AnimatedPressable>
            <AnimatedPressable onPress={() => router.push('/subscriptions')} style={{ flex: 1 }}>
              <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.planCard}>
                <Crown size={28} color="#FACC15" />
                <Text style={styles.planLabel}>Plan</Text>
                <Text style={styles.planValue} numberOfLines={1} adjustsFontSizeToFit>
                  {currentPlanId.replace('_', ' ')}
                </Text>
              </LinearGradient>
            </AnimatedPressable>
          </View>

          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <AnimatedPressable
                key={item.label}
                onPress={() => router.push(item.route as any)}
                style={[styles.menuRow, index !== menuItems.length - 1 ? styles.menuRowBorder : null]}>
                <View style={styles.menuIcon}>
                  <item.icon size={24} color="#0A84FF" />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <ChevronRight size={22} color="#CBD5E1" />
              </AnimatedPressable>
            ))}
          </View>

          <AnimatedPressable onPress={handleLogout} style={styles.logoutRow}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutLabel}>Log Out</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
    </TabScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    body: { paddingHorizontal: 24, paddingTop: 8, gap: 24 },
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    name: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    email: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    statsRow: { flexDirection: 'row', gap: 12 },
    walletCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 8 },
    cardLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    cardValue: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    planCard: { borderRadius: 16, overflow: 'hidden', padding: 16, gap: 8, flex: 1 },
    planLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.7)' },
    planValue: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#FFFFFF', textTransform: 'capitalize' },
    menuCard: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' },
    menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
    menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.background },
    menuIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
    menuLabel: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },
    logoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    logoutLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.danger },
  });
}
