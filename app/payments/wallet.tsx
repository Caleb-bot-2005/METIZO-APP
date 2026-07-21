import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PaymentCard } from '@/components/features/PaymentCard';
import { useToast } from '@/components/ui/Toast';
import { usePaymentStore } from '@/store/paymentStore';
import { formatCurrency } from '@/utils/format';
import { gradients, ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const topUpAmounts = [50, 100, 200, 500];

export default function WalletScreen() {
  const walletBalance = usePaymentStore((s) => s.walletBalance);
  const transactions = usePaymentStore((s) => s.transactions);
  const topUpWallet = usePaymentStore((s) => s.topUpWallet);
  const methods = usePaymentStore((s) => s.methods);
  const selectedMethodId = usePaymentStore((s) => s.selectedMethodId);
  const selectMethod = usePaymentStore((s) => s.selectMethod);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const fundingMethods = methods.filter((m) => m.type !== 'wallet');
  const selectedMethod = fundingMethods.find((m) => m.id === selectedMethodId) ?? fundingMethods[0];
  const amount = customAmount.trim() ? Number(customAmount) : selectedPreset ?? 0;
  const validAmount = amount > 0;

  function selectPreset(value: number) {
    setSelectedPreset(value);
    setCustomAmount('');
  }

  function onChangeCustomAmount(text: string) {
    setCustomAmount(text.replace(/[^0-9]/g, ''));
    setSelectedPreset(null);
  }

  function confirmTopUp() {
    if (!selectedMethod) {
      toast.show('Add a payment method first', 'error');
      return;
    }
    if (!validAmount) {
      toast.show('Enter an amount to top up', 'error');
      return;
    }
    topUpWallet(amount);
    setModalVisible(false);
    setCustomAmount('');
    toast.show(`${formatCurrency(amount)} added from ${selectedMethod.label}`, 'success');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Wallet</Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>{formatCurrency(walletBalance)}</Text>
          <Button label="Top Up Wallet" variant="gold" icon={<Plus size={16} color={colors.text} />} onPress={() => setModalVisible(true)} />
        </LinearGradient>
      </View>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 8 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: item.type === 'credit' ? `${colors.success}33` : `${colors.danger}33` }]}>
              {item.type === 'credit' ? (
                <ArrowDownLeft size={17} color={colors.success} />
              ) : (
                <ArrowUpRight size={17} color={colors.danger} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txLabel}>{item.label}</Text>
              <Text style={styles.txDate}>{item.date}</Text>
            </View>
            <Text style={[styles.txAmount, { color: item.type === 'credit' ? colors.success : colors.danger }]}>
              {item.type === 'credit' ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>
          </View>
        )}
      />

      <BottomSheet visible={modalVisible} onClose={() => setModalVisible(false)}>
        <Text style={styles.modalTitle}>Top Up Wallet</Text>
        <Text style={styles.modalSubtitle}>Choose an amount to add to your METIZO Wallet</Text>
        <View style={styles.amountGrid}>
          {topUpAmounts.map((preset) => (
            <AnimatedPressable
              key={preset}
              onPress={() => selectPreset(preset)}
              style={[styles.amountChip, { backgroundColor: selectedPreset === preset ? colors.primary : colors.background }]}>
              <Text style={[styles.amountLabel, { color: selectedPreset === preset ? '#FFFFFF' : colors.text }]}>
                {formatCurrency(preset)}
              </Text>
            </AnimatedPressable>
          ))}
        </View>

        <Text style={styles.sourceTitle}>Or enter a custom amount</Text>
        <View style={styles.customInputWrap}>
          <Text style={styles.currencyPrefix}>GH₵</Text>
          <TextInput
            value={customAmount}
            onChangeText={onChangeCustomAmount}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            style={styles.customInput}
          />
        </View>

        <Text style={styles.sourceTitle}>Top up from</Text>
        <View style={{ gap: 10 }}>
          {fundingMethods.map((method) => (
            <PaymentCard
              key={method.id}
              method={method}
              selected={selectedMethod?.id === method.id}
              onPress={() => selectMethod(method.id)}
            />
          ))}
        </View>

        <Button
          label={
            validAmount && selectedMethod
              ? `Add ${formatCurrency(amount)} from ${selectedMethod.label}`
              : 'Enter an amount'
          }
          size="lg"
          disabled={!validAmount || !selectedMethod}
          onPress={confirmTopUp}
        />
        <Button label="Cancel" variant="ghost" size="lg" onPress={() => setModalVisible(false)} />
      </BottomSheet>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    balanceCard: { borderRadius: 24, padding: 24, gap: 16 },
    balanceLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.7)' },
    balanceValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 36, color: '#FFFFFF' },
    sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 16 },
    iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    txLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    txDate: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    txAmount: { fontFamily: 'Inter_700Bold', fontSize: 14 },
    modalTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 20, color: colors.text, textAlign: 'center' },
    modalSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    amountChip: { borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, minWidth: '45%', alignItems: 'center' },
    amountLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
    sourceTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text },
    customInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.background,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    currencyPrefix: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.textSecondary },
    customInput: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text, padding: 0 },
  });
}
