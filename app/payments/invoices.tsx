import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { CheckCircle2, Download, FileText, ShieldCheck } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';
import { usePaymentStore } from '@/store/paymentStore';
import { formatCurrency } from '@/utils/format';
import { Invoice } from '@/types/payment';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

function receiptHtml(invoice: Invoice) {
  return `
    <html>
      <body style="font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 32px; color: #0F172A;">
        <h1 style="color: #0A84FF; margin-bottom: 4px;">METIZO</h1>
        <p style="color: #64748B; margin-top: 0;">Payment Receipt</p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #64748B;">Invoice ID</td><td style="padding: 6px 0; text-align: right;">${invoice.id}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748B;">Artisan</td><td style="padding: 6px 0; text-align: right;">${invoice.artisanName}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748B;">Date</td><td style="padding: 6px 0; text-align: right;">${invoice.date}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748B;">Status</td><td style="padding: 6px 0; text-align: right; text-transform: capitalize;">${invoice.status}</td></tr>
        </table>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
        <h2 style="text-align: right;">Total: ${formatCurrency(invoice.amount)}</h2>
      </body>
    </html>
  `;
}

export default function InvoicesScreen() {
  const invoices = usePaymentStore((s) => s.invoices);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  async function handleDownload(invoice: Invoice) {
    setDownloadingId(invoice.id);
    try {
      const { uri } = await Print.printToFileAsync({ html: receiptHtml(invoice) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Receipt - ${invoice.artisanName}` });
      } else {
        toast.show('Sharing is not available on this device', 'error');
      }
    } catch {
      toast.show('Could not generate receipt. Please try again.', 'error');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Invoices & Receipts</Text>
      </View>
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, gap: 10 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FileText size={40} color={colors.textSecondary} />
            <Text style={styles.emptyLabel}>No invoices yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <AnimatedPressable onPress={() => setViewingInvoice(item)} style={styles.rowMain}>
              <View style={styles.iconWrap}>
                <FileText size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.artisanName}>{item.artisanName}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
              <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => handleDownload(item)}
              disabled={downloadingId === item.id}
              hitSlop={8}
              style={styles.downloadButton}>
              {downloadingId === item.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Download size={16} color={colors.textSecondary} />
              )}
            </AnimatedPressable>
          </View>
        )}
      />

      <BottomSheet visible={!!viewingInvoice} onClose={() => setViewingInvoice(null)}>
        {viewingInvoice ? (
          <>
            <View style={styles.receiptIconWrap}>
              <CheckCircle2 size={28} color={colors.success} />
            </View>
            <Text style={styles.receiptTitle}>Payment {viewingInvoice.status === 'paid' ? 'Successful' : 'Refunded'}</Text>
            <Text style={styles.receiptAmount}>{formatCurrency(viewingInvoice.amount)}</Text>

            <View style={styles.receiptCard}>
              <ReceiptRow label="Invoice ID" value={viewingInvoice.id} />
              <ReceiptRow label="Artisan" value={viewingInvoice.artisanName} />
              <ReceiptRow label="Date" value={viewingInvoice.date} />
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Status</Text>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: viewingInvoice.status === 'paid' ? `${colors.success}1A` : `${colors.warning}1A` },
                  ]}>
                  <Text
                    style={[
                      styles.statusLabel,
                      { color: viewingInvoice.status === 'paid' ? colors.success : colors.warning },
                    ]}>
                    {viewingInvoice.status === 'paid' ? 'Paid' : 'Refunded'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoRow}>
              <ShieldCheck size={16} color={colors.primary} />
              <Text style={styles.infoText}>Paid securely through METIZO Escrow</Text>
            </View>

            <Button
              label="Download / Share PDF"
              size="lg"
              loading={downloadingId === viewingInvoice.id}
              icon={<Download size={16} color="#FFFFFF" />}
              onPress={() => handleDownload(viewingInvoice)}
            />
            <Button label="Close" variant="ghost" size="lg" onPress={() => setViewingInvoice(null)} />
          </>
        ) : null}
      </BottomSheet>
    </SafeAreaView>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text style={styles.receiptValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    empty: { alignItems: 'center', gap: 12, marginTop: 64 },
    emptyLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 16 },
    rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
    artisanName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    date: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    amount: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text, marginRight: 8 },
    downloadButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    receiptIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: `${colors.success}1A`,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    receiptTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text, textAlign: 'center' },
    receiptAmount: { fontFamily: 'Inter_800ExtraBold', fontSize: 34, color: colors.text, textAlign: 'center', marginBottom: 4 },
    receiptCard: { backgroundColor: colors.background, borderRadius: 16, padding: 16, gap: 12 },
    receiptRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    receiptLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSecondary },
    receiptValue: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.text, flexShrink: 1, marginLeft: 12 },
    statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    statusLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
    infoText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
  });
}
