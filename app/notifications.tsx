import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell, Briefcase, CreditCard, Gavel, Megaphone, Siren } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/hooks/queries/useNotifications';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { AppNotification, NotificationCategory } from '@/types/notification';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function NotificationsScreen() {
  const { data } = useNotifications();
  const notifications = useNotificationStore((s) => s.notifications);
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const markAllReadLocally = useNotificationStore((s) => s.markAllRead);
  const markOneReadLocally = useNotificationStore((s) => s.markOneRead);
  const markAllRead = useMarkAllNotificationsRead();
  const markOneRead = useMarkNotificationRead();
  const role = useAuthStore((s) => s.user?.role);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  function handleMarkAllRead() {
    markAllReadLocally();
    markAllRead.mutate();
  }

  function handlePress(item: AppNotification) {
    if (!item.read) {
      markOneReadLocally(item.id);
      markOneRead.mutate(item.id);
    }
    if (item.relatedRequestId && item.category === 'job' && role === 'artisan') {
      router.push({ pathname: '/artisan/jobs/[id]', params: { id: item.relatedRequestId } });
    }
  }
  const categoryMeta: Record<NotificationCategory, { icon: typeof Bell; color: string }> = {
    bid: { icon: Gavel, color: colors.primary },
    arrival: { icon: Briefcase, color: colors.primary },
    payment: { icon: CreditCard, color: colors.success },
    job: { icon: Briefcase, color: colors.primary },
    emergency: { icon: Siren, color: colors.danger },
    promotion: { icon: Megaphone, color: colors.primary },
  };

  useEffect(() => {
    if (data) setNotifications(data);
  }, [data]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.markAllLabel} onPress={handleMarkAllRead}>
          Mark all read
        </Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, gap: 10 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Bell size={40} color={colors.textSecondary} />
            <Text style={styles.emptyLabel}>No notifications yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = categoryMeta[item.category];
          return (
            <AnimatedPressable
              onPress={() => handlePress(item)}
              style={[
                styles.row,
                item.read ? { backgroundColor: colors.card } : { backgroundColor: `${colors.primary}0D`, borderWidth: 1, borderColor: `${colors.primary}1A` },
              ]}>
              <View style={[styles.iconWrap, { backgroundColor: `${meta.color}1A` }]}>
                <meta.icon size={18} color={meta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{item.createdAt}</Text>
              </View>
              {!item.read ? <View style={styles.unreadDot} /> : null}
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
    headerTitle: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    markAllLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
    empty: { alignItems: 'center', gap: 12, marginTop: 64 },
    emptyLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, padding: 16 },
    iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    body: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    time: { fontFamily: 'Inter_500Medium', fontSize: 10, color: colors.textSecondary, marginTop: 6 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  });
}
