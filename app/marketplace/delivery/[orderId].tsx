import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Package, Truck } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { TimelineCard } from '@/components/features/TimelineCard';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { formatCurrency } from '@/utils/format';
import { OrderStatus } from '@/types/marketplace';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const statusOrder: OrderStatus[] = ['preparing', 'out_for_delivery', 'delivered'];

export default function DeliveryTrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const order = useMarketplaceStore((s) => s.orders.find((o) => o.id === orderId));
  const colors = useThemeColors();
  const styles = createStyles(colors);

  if (!order) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Delivery Tracking</Text>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>We couldn&apos;t find this order.</Text>
          <Button label="Back to Marketplace" variant="outline" onPress={() => router.replace('/marketplace')} />
        </View>
      </SafeAreaView>
    );
  }

  const currentIndex = statusOrder.indexOf(order.status);
  const steps = [
    { key: 'requested' as const, label: 'Order confirmed', done: currentIndex >= 0 },
    { key: 'accepted' as const, label: 'Preparing your items', done: currentIndex >= 0 },
    { key: 'traveling' as const, label: 'Out for delivery', done: currentIndex >= 1 },
    { key: 'completed' as const, label: 'Delivered', done: currentIndex >= 2 },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Delivery Tracking</Text>
      </View>
      <FlatList
        data={order.items}
        keyExtractor={(item) => item.material.id}
        contentContainerStyle={{ padding: 24, gap: 20 }}
        ListHeaderComponent={
          <View style={{ gap: 20, marginBottom: 20 }}>
            <View style={styles.summaryCard}>
              <View style={styles.iconWrap}>
                <Truck size={26} color={colors.primary} />
              </View>
              <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
              <Text style={styles.eta}>
                {order.status === 'delivered' ? 'Delivered' : 'Arriving in approximately 45 minutes'}
              </Text>
            </View>
            <TimelineCard steps={steps} />
            <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Image source={{ uri: item.material.imageUrl }} style={{ width: 48, height: 48, borderRadius: 12 }} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.itemName}>{item.material.name}</Text>
              <Text style={styles.itemQuantity}>Qty {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>{formatCurrency(item.material.price * item.quantity)}</Text>
          </View>
        )}
        ListFooterComponent={
          <View style={{ gap: 20, marginTop: 20 }}>
            <View style={styles.summaryCard}>
              <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
              <Row label="Delivery" value={formatCurrency(order.delivery)} />
              <View style={styles.divider} />
              <Row label="Total" value={formatCurrency(order.total)} bold />
            </View>
            <Button label="Back to Marketplace" variant="outline" icon={<Package size={16} color={colors.primary} />} onPress={() => router.replace('/marketplace')} />
          </View>
        }
      />
    </SafeAreaView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={bold ? styles.rowValueBold : styles.rowValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },
    notFoundText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    summaryCard: {
      backgroundColor: `${colors.primary}0D`,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: `${colors.primary}1A`,
    },
    iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
    orderId: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    eta: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 12 },
    itemName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    itemQuantity: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    itemPrice: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primary },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    rowValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    rowValueBold: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    divider: { height: 1, backgroundColor: colors.background, marginVertical: 4 },
  });
}
