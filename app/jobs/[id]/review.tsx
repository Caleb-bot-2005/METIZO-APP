import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { CheckCircle2, ImagePlus, Share2, Star, ThumbsUp, X } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { mockArtisans } from '@/constants/mockData';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function RateArtisanScreen() {
  const artisan = mockArtisans[0];
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [recommend, setRecommend] = useState(true);
  const [tip, setTip] = useState<number | null>(20);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  async function addImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) setImages((prev) => [...prev, result.assets[0].uri]);
  }

  function submit() {
    setSubmitted(true);
  }

  function share() {
    toast.show('Review link copied to share.', 'success');
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.successScreen}>
        <View style={styles.successCenter}>
          <Animated.View entering={ZoomIn.springify()} style={styles.successIcon}>
            <CheckCircle2 size={48} color={colors.success} />
          </Animated.View>
          <View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 24 }}>
            <Text style={styles.successTitle}>Thank you!</Text>
            <Text style={styles.successSubtitle}>Your review helps other customers find trusted artisans.</Text>
          </View>
          <AnimatedPressable onPress={share} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Share2 size={16} color={colors.primary} />
            <Text style={styles.shareLabel}>Share your review</Text>
          </AnimatedPressable>
        </View>
        <Button label="Back to History" size="lg" onPress={() => router.replace('/(tabs)/jobs')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Rate Your Artisan</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Image source={{ uri: artisan.avatarUrl }} style={{ width: 72, height: 72, borderRadius: 36 }} />
          <Text style={styles.artisanName}>{artisan.name}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <AnimatedPressable key={value} onPress={() => setRating(value)}>
                <Star size={32} color={colors.gold} fill={value <= rating ? colors.gold : 'transparent'} />
              </AnimatedPressable>
            ))}
          </View>
        </View>

        <View style={styles.commentBox}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share details about your experience..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text, minHeight: 100, textAlignVertical: 'top' }}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {images.map((uri) => (
            <View key={uri} style={{ width: 72, height: 72 }}>
              <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
              <AnimatedPressable onPress={() => setImages((prev) => prev.filter((i) => i !== uri))} style={styles.removeImage}>
                <X size={11} color="#FFFFFF" />
              </AnimatedPressable>
            </View>
          ))}
          <AnimatedPressable onPress={addImage} style={styles.addImage}>
            <ImagePlus size={20} color={colors.primary} />
          </AnimatedPressable>
        </View>

        <AnimatedPressable
          onPress={() => setRecommend((r) => !r)}
          style={[styles.recommendRow, { backgroundColor: recommend ? `${colors.success}1A` : colors.card }]}>
          <ThumbsUp size={18} color={recommend ? colors.success : colors.textSecondary} />
          <Text style={[styles.recommendLabel, { color: recommend ? colors.success : colors.textSecondary }]}>
            I recommend this artisan
          </Text>
        </AnimatedPressable>

        <View style={{ gap: 8 }}>
          <Text style={styles.tipTitle}>Add a tip (optional)</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[0, 10, 20, 50].map((amount) => (
              <AnimatedPressable
                key={amount}
                onPress={() => setTip(amount)}
                style={[styles.tipButton, { backgroundColor: tip === amount ? colors.primary : colors.card }]}>
                <Text style={[styles.tipLabel, { color: tip === amount ? '#FFFFFF' : colors.text }]}>
                  {amount === 0 ? 'No tip' : formatCurrency(amount)}
                </Text>
              </AnimatedPressable>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Button label="Submit Review" size="lg" onPress={submit} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    successScreen: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 40 },
    successCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
    successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: `${colors.success}1A`, alignItems: 'center', justifyContent: 'center' },
    successTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text, textAlign: 'center' },
    successSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    shareLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    artisanName: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    commentBox: { backgroundColor: colors.card, borderRadius: 16, padding: 16 },
    removeImage: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: colors.danger,
      borderRadius: 999,
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addImage: {
      width: 72,
      height: 72,
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: `${colors.primary}4D`,
    },
    recommendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16 },
    recommendLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
    tipTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    tipButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16 },
    tipLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  });
}
