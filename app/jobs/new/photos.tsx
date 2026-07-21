import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, ImagePlus, X } from 'lucide-react-native';
import { StepProgress } from '@/components/ui/StepProgress';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useJobStore } from '@/store/jobStore';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function JobPhotosStep() {
  const draft = useJobStore((s) => s.draft);
  const updateDraft = useJobStore((s) => s.updateDraft);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const photos = result.assets.map((asset) => ({ id: asset.assetId ?? asset.uri, uri: asset.uri }));
      updateDraft({ photos: [...draft.photos, ...photos] });
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      const photos = result.assets.map((asset) => ({ id: asset.assetId ?? asset.uri, uri: asset.uri }));
      updateDraft({ photos: [...draft.photos, ...photos] });
    }
  }

  function removePhoto(id: string) {
    updateDraft({ photos: draft.photos.filter((p) => p.id !== id) });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StepProgress step={3} total={7} title="Add photos (optional)" />
      <View style={{ flex: 1, paddingHorizontal: 24, gap: 16 }}>
        <Text style={styles.description}>Photos help artisans understand the issue and quote accurately.</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <AnimatedPressable onPress={takePhoto} style={styles.pickerButton}>
            <Camera size={22} color="#0A84FF" />
            <Text style={styles.pickerLabel}>Camera</Text>
          </AnimatedPressable>
          <AnimatedPressable onPress={pickFromGallery} style={styles.pickerButton}>
            <ImagePlus size={22} color="#0A84FF" />
            <Text style={styles.pickerLabel}>Gallery</Text>
          </AnimatedPressable>
        </View>
        <FlatList
          data={draft.photos}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={{ gap: 8 }}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <View style={{ width: '31%', aspectRatio: 1 }}>
              <Image source={{ uri: item.uri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
              <AnimatedPressable onPress={() => removePhoto(item.id)} style={styles.removeButton}>
                <X size={13} color="#FFFFFF" />
              </AnimatedPressable>
            </View>
          )}
        />
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Button label="Continue" size="lg" onPress={() => router.push('/jobs/new/location')} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    description: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
    pickerButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingVertical: 24,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: `${colors.primary}4D`,
    },
    pickerLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.primary },
    removeButton: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: colors.danger,
      borderRadius: 999,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
