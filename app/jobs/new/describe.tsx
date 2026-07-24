import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { Mic, Sparkles, Square } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { StepProgress } from '@/components/ui/StepProgress';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { useJobStore } from '@/store/jobStore';
import { apiClient } from '@/services/api/client';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const suggestionsByCategory: Record<string, string[]> = {
  plumber: ['Leaking pipe under sink', 'Blocked drain', 'No hot water', 'Toilet not flushing'],
  electrician: ['Power outlet not working', 'Frequent tripping', 'Install new lights', 'Rewiring needed'],
  default: ['Needs urgent repair', 'Routine maintenance', 'Installation required', 'Not sure, need inspection'],
};

export default function JobDescribeStep() {
  const params = useLocalSearchParams<{ categoryId?: string; categoryName?: string }>();
  const draft = useJobStore((s) => s.draft);
  const updateDraft = useJobStore((s) => s.updateDraft);
  const [description, setDescription] = useState(draft.description ?? '');
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const baseDescription = useRef('');
  const toast = useToast();
  const pulse = useSharedValue(1);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  // expo-speech-recognition needs a custom dev-client build and can't run in Expo
  // Go, so voice input instead records with expo-audio (Expo Go-compatible) and
  // sends the clip to the backend, which proxies it to OpenAI Whisper for a
  // transcript (keeps the OpenAI API key server-side, out of the app bundle).
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    if (params.categoryId && !draft.categoryId) {
      updateDraft({ categoryId: params.categoryId, categoryName: params.categoryName });
    }
  }, [params.categoryId]);

  useEffect(() => {
    if (isListening) {
      pulse.value = withRepeat(withTiming(1.25, { duration: 500 }), -1, true);
    } else {
      pulse.value = withTiming(1, { duration: 150 });
    }
  }, [isListening]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const categoryId = draft.categoryId ?? params.categoryId ?? 'default';
  const suggestions = suggestionsByCategory[categoryId] ?? suggestionsByCategory.default;

  async function toggleVoiceInput() {
    if (isTranscribing) return;
    if (isListening) {
      setIsListening(false);
      try {
        await recorder.stop();
        await setAudioModeAsync({ allowsRecording: false });
      } catch {
        toast.show('Could not save recording', 'error');
        return;
      }
      const uri = recorder.uri;
      if (!uri) {
        toast.show('Could not save recording', 'error');
        return;
      }
      setIsTranscribing(true);
      try {
        const form = new FormData();
        form.append('file', { uri, name: 'recording.m4a', type: 'audio/m4a' } as any);
        const { data } = await apiClient.post<{ text: string }>('/speech/transcribe', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const transcript = data.text?.trim();
        if (transcript) {
          setDescription(((baseDescription.current ? `${baseDescription.current} ` : '') + transcript).slice(0, 500));
        } else {
          toast.show("Didn't catch that, try again", 'error');
        }
      } catch (error: any) {
        if (!error?.response) {
          toast.show("Can't reach the server. Check your connection and try again.", 'error');
        } else {
          toast.show(error.response.data?.message ?? 'Voice input failed, please try again', 'error');
        }
      } finally {
        setIsTranscribing(false);
      }
      return;
    }
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    if (!granted) {
      toast.show('Microphone permission is required for voice input', 'error');
      return;
    }
    baseDescription.current = description.trim();
    try {
      // Recording is disallowed by default (especially on iOS, where
      // allowsRecording defaults to false) until the audio session is
      // explicitly switched into a mode that permits it — without this,
      // prepareToRecordAsync()/record() reject and this whole block never
      // gets past "Could not start recording."
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsListening(true);
    } catch {
      toast.show('Could not start recording', 'error');
    }
  }

  function handleNext() {
    updateDraft({ description });
    router.push('/jobs/new/photos');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <StepProgress step={2} total={7} title="Describe the problem" />
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
          <View style={styles.textBox}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="E.g. My kitchen sink pipe is leaking and water is pooling on the floor..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
              style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text, minHeight: 140, textAlignVertical: 'top' }}
            />
            <View style={styles.voiceRow}>
              <AnimatedPressable
                onPress={toggleVoiceInput}
                disabled={isTranscribing}
                style={[styles.voiceButton, { backgroundColor: isListening ? colors.danger : `${colors.primary}1A`, opacity: isTranscribing ? 0.6 : 1 }]}>
                <Animated.View style={pulseStyle}>
                  {isListening ? <Square size={13} color="#FFFFFF" fill="#FFFFFF" /> : <Mic size={15} color={colors.primary} />}
                </Animated.View>
                <Text style={[styles.voiceLabel, { color: isListening ? '#FFFFFF' : colors.primary }]}>
                  {isTranscribing ? 'Transcribing...' : isListening ? 'Tap to stop' : 'Voice input'}
                </Text>
              </AnimatedPressable>
              <Text style={styles.charCount}>{description.length}/500</Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color={colors.primary} />
              <Text style={styles.suggestionsTitle}>AI Suggestions</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {suggestions.map((suggestion) => (
                <AnimatedPressable key={suggestion} onPress={() => setDescription(suggestion)} style={styles.suggestionChip}>
                  <Text style={styles.suggestionLabel}>{suggestion}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </View>
        </ScrollView>
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <Button label="Continue" size="lg" disabled={description.trim().length < 5} onPress={handleNext} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    textBox: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 12 },
    voiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    voiceButton: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
    voiceLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    charCount: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    suggestionsTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    suggestionChip: { backgroundColor: colors.card, borderWidth: 1, borderColor: `${colors.primary}33`, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
    suggestionLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text },
  });
}
