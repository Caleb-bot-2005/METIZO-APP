import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, Plus } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { PaymentCard } from '@/components/features/PaymentCard';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { usePaymentStore } from '@/store/paymentStore';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function PaymentMethodsScreen() {
  const methods = usePaymentStore((s) => s.methods);
  const selectedMethodId = usePaymentStore((s) => s.selectedMethodId);
  const selectMethod = usePaymentStore((s) => s.selectMethod);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Payment Methods</Text>
      </View>
      <FlatList
        data={methods}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, gap: 10 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <CreditCard size={40} color={colors.textSecondary} />
            <Text style={styles.emptyLabel}>No payment methods yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PaymentCard method={item} selected={selectedMethodId === item.id} onPress={() => selectMethod(item.id)} />
        )}
        ListFooterComponent={
          <AnimatedPressable style={styles.addButton}>
            <Plus size={18} color={colors.primary} />
            <Text style={styles.addLabel}>Add Payment Method</Text>
          </AnimatedPressable>
        }
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
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: `${colors.primary}66`,
      borderRadius: 16,
      paddingVertical: 16,
      marginTop: 8,
    },
    addLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
  });
}
