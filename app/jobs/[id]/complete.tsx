import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, CheckCircle2, ImagePlus } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { useJobs, useUpdateJobProgress } from '@/hooks/queries/useJobs';
import { useUploadWorkPhoto, useWorkPhotos } from '@/hooks/queries/useWorkPhotos';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

// Artisan-facing: the last step before a job can be marked DONE. Requires at
// least one AFTER photo — the backend enforces the same rule when the
// customer later tries to confirm & release escrow (ServiceRequestService
// .confirmCompletion), so this screen is what makes that requirement
// satisfiable rather than just a wall the customer hits.
export default function MarkJobCompleteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: jobs } = useJobs();
  const job = jobs?.find((j) => j.id === id);
  const { data: photos } = useWorkPhotos(id);
  const uploadPhoto = useUploadWorkPhoto(id);
  const updateProgress = useUpdateJobProgress();
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const afterPhotos = (photos ?? []).filter((p) => p.type === 'after');

  async function submitPhoto(uri: string) {
    try {
      await uploadPhoto.mutateAsync({ type: 'after', uri });
      toast.show('Completion photo added', 'success');
    } catch {
      toast.show('Could not upload photo. Please try again.', 'error');
    }
  }

  async function uploadFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) await submitPhoto(result.assets[0].uri);
  }

  async function uploadFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) await submitPhoto(result.assets[0].uri);
  }

  async function handleMarkComplete() {
    try {
      await updateProgress.mutateAsync({ id, stage: 'done' });
      toast.show('Job marked complete — waiting on the customer to confirm.', 'success');
      router.back();
    } catch (error: any) {
      toast.show(error?.response?.data?.message ?? 'Could not mark this job complete. Please try again.', 'error');
    }
  }

  if (!job) {
    return (
      <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.notFound}>Job not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Mark Job Complete</Text>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8, gap: 16 }}>
        <Card>
          <Text style={styles.jobTitle}>{job.categoryName}</Text>
          <Text style={styles.jobDescription} numberOfLines={2}>
            {job.description}
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Completion photos</Text>
        <Text style={styles.sectionHint}>
          Add at least one photo of the finished work — the customer sees these before releasing your payment.
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <AnimatedPressable onPress={uploadFromCamera} style={styles.pickerButton} disabled={uploadPhoto.isPending}>
            <Camera size={20} color={colors.artisan} />
            <Text style={styles.pickerButtonLabel}>Camera</Text>
          </AnimatedPressable>
          <AnimatedPressable onPress={uploadFromGallery} style={styles.pickerButton} disabled={uploadPhoto.isPending}>
            <ImagePlus size={20} color={colors.artisan} />
            <Text style={styles.pickerButtonLabel}>Gallery</Text>
          </AnimatedPressable>
        </View>

        {afterPhotos.length > 0 ? (
          <FlatList
            data={afterPhotos}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={{ gap: 8 }}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <View style={{ width: '31%', aspectRatio: 1 }}>
                <Image source={{ uri: item.url }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
              </View>
            )}
          />
        ) : (
          <Text style={styles.emptyLabel}>No completion photos yet.</Text>
        )}
      </View>
      <View style={{ padding: 24 }}>
        <Button
          label="Mark Job Complete"
          size="lg"
          icon={<CheckCircle2 size={16} color="#FFFFFF" />}
          loading={updateProgress.isPending}
          disabled={afterPhotos.length === 0}
          onPress={handleMarkComplete}
          style={{ backgroundColor: colors.artisan }}
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    notFound: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    jobTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    jobDescription: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    sectionHint: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textSecondary, marginTop: -8 },
    pickerButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 18,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: `${colors.artisan}4D`,
    },
    pickerButtonLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.artisan },
    emptyLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSecondary },
  });
}
