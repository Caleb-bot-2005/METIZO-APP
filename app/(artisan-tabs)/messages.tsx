import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useConversations } from '@/hooks/queries/useMessages';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function ArtisanMessagesScreen() {
  const { data: conversations } = useConversations();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, gap: 8 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MessageCircle size={40} color={colors.textSecondary} />
            <Text style={styles.emptyLabel}>No conversations yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <AnimatedPressable onPress={() => router.push(`/messages/${item.id}`)} style={styles.row}>
            <View>
              <Image source={{ uri: item.participantAvatarUrl }} style={{ width: 52, height: 52, borderRadius: 26 }} />
              {item.online ? <View style={styles.onlineDot} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.rowHeader}>
                <Text style={styles.name}>{item.participantName}</Text>
                <Text style={styles.time}>{item.lastMessageAt}</Text>
              </View>
              <Text style={styles.preview} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>
            {item.unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeLabel}>{item.unreadCount}</Text>
              </View>
            ) : null}
          </AnimatedPressable>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 24, paddingTop: 8 },
    title: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text },
    empty: { alignItems: 'center', gap: 12, marginTop: 64 },
    emptyLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 16 },
    onlineDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.success,
      borderWidth: 2,
      borderColor: colors.card,
    },
    rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    name: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    time: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    preview: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    badge: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.artisan, alignItems: 'center', justifyContent: 'center' },
    badgeLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#FFFFFF' },
  });
}
