import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Clock, Siren, Zap } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ArtisanCard } from '@/components/features/ArtisanCard';
import { serviceCategories } from '@/constants/categories';
import { mockArtisans } from '@/constants/mockData';
import { gradients, ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const emergencyCategories = serviceCategories.filter((c) => c.emergencyAvailable);

export default function EmergencyModeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [dispatched, setDispatched] = useState(false);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const selectedCategoryData = emergencyCategories.find((c) => c.id === selectedCategory);

  function selectCategory(categoryId: string) {
    setSelectedCategory(categoryId);
    setConfirmVisible(true);
  }

  function dispatch() {
    setConfirmVisible(false);
    setDispatched(true);
    setCountdown(8);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient colors={gradients.emergency} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <BackButton onPress={() => router.back()} />
        </View>
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 16 }}>
          <View style={styles.iconWrap}>
            <Siren size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>Emergency Service</Text>
          <Text style={styles.heroSubtitle}>Priority artisans dispatched immediately for urgent issues</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {!dispatched ? (
          <>
            <Text style={styles.sectionTitle}>What&apos;s the emergency?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {emergencyCategories.map((category) => (
                <Text
                  key={category.id}
                  onPress={() => selectCategory(category.id)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: selectedCategory === category.id ? colors.danger : colors.card,
                      color: selectedCategory === category.id ? '#FFFFFF' : colors.text,
                    },
                  ]}>
                  {category.name}
                </Text>
              ))}
            </View>
            <Button label="Dispatch Emergency Artisan" variant="danger" size="lg" disabled={!selectedCategory} onPress={dispatch} icon={<Zap size={18} color="#FFFFFF" />} />
          </>
        ) : (
          <>
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 16 }}>
              <Text style={styles.countdown}>{countdown}s</Text>
              <Text style={styles.dispatching}>Dispatching nearest available artisan...</Text>
            </View>
            <Text style={styles.sectionTitle}>Available Now</Text>
            <FlatList
              data={mockArtisans.filter((a) => a.isOnline)}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <ArtisanCard artisan={item} onPress={() => router.push(`/artisans/${item.id}`)} />
              )}
            />
          </>
        )}
      </View>

      <BottomSheet visible={confirmVisible} onClose={() => setConfirmVisible(false)}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <View style={styles.modalIcon}>
            <Siren size={26} color="#EF4444" />
          </View>
          <Text style={styles.modalTitle}>Confirm {selectedCategoryData?.name} Emergency</Text>
          <Text style={styles.modalSubtitle}>
            We&apos;ll immediately notify nearby {selectedCategoryData?.name.toLowerCase()}s and dispatch the fastest available artisan to you.
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Clock size={16} color={colors.primary} />
          <Text style={styles.infoText}>Average emergency response time is under 15 minutes</Text>
        </View>
        <View style={{ gap: 12 }}>
          <Button label="Confirm & Dispatch" variant="danger" size="lg" onPress={dispatch} icon={<Zap size={18} color="#FFFFFF" />} />
          <Button
            label="Cancel"
            variant="ghost"
            size="lg"
            onPress={() => {
              setConfirmVisible(false);
              setSelectedCategory(null);
            }}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // Deliberately always dark (matches the red/black "emergency" gradient), not a theme artifact.
    screen: { flex: 1, backgroundColor: '#0B1220' },
    hero: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 16 },
    iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    heroTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: '#FFFFFF' },
    heroSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', paddingHorizontal: 24 },
    body: { flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, paddingHorizontal: 24, paddingTop: 24, gap: 20 },
    sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    categoryChip: { fontFamily: 'Inter_600SemiBold', fontSize: 14, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
    countdown: { fontFamily: 'Inter_800ExtraBold', fontSize: 36, color: colors.danger },
    dispatching: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.textSecondary },
    modalIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${colors.danger}1A`, alignItems: 'center', justifyContent: 'center' },
    modalTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 18, color: colors.text, textAlign: 'center' },
    modalSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.background, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
    infoText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary, flex: 1 },
  });
}
