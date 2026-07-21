import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Package, PackageCheck, Truck } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { formatCurrency } from '@/utils/format';
import { Order, OrderStatus } from '@/types/marketplace';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function OrdersScreen() {
  const orders = useMarketplaceStore((s) => s.orders);
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const statusMeta: Record<OrderStatus, { label: string; color: string; Icon: typeof Package }> = {
    preparing: { label: 'Preparing', color: colors.warning, Icon: Package },
    out_for_delivery: { label: 'Out for delivery', color: colors.primary, Icon: Truck },
    delivered: { label: 'Delivered', color: colors.success, Icon: PackageCheck },
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, gap: 12 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Package size={40} color={colors.textSecondary} />
            <Text style={styles.emptyLabel}>No orders yet</Text>
          </View>
        }
        renderItem={({ item }: { item: Order }) => {
          const meta = statusMeta[item.status];
          const itemCount = item.items.reduce((sum, i) => sum + i.quantity, 0);
          return (
            <AnimatedPressable onPress={() => router.push(`/marketplace/delivery/${item.id}`)} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
                <View style={[styles.statusPill, { backgroundColor: `${meta.color}1A` }]}>
                  <meta.Icon size={12} color={meta.color} />
                  <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </View>
              <Text style={styles.itemsLabel}>
                {itemCount} item{itemCount === 1 ? '' : 's'} · {formatDate(item.createdAt)}
              </Text>
              <View style={styles.cardFooter}>
                <Text numberOfLines={1} style={styles.itemNames}>
                  {item.items.map((i) => i.material.name).join(', ')}
                </Text>
                <Text style={styles.total}>{formatCurrency(item.total)}</Text>
              </View>
            </AnimatedPressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    empty: { alignItems: 'center', gap: 12, marginTop: 64 },
    emptyLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 6 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    orderId: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    statusLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    itemsLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 },
    itemNames: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary },
    total: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primary },
  });
}
