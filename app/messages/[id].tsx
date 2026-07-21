import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { Camera, MapPin, Mic, Pause, Play, Send, Trash2 } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { BackButton } from '@/components/ui/BackButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { MessageBubble } from '@/components/features/MessageBubble';
import { useToast } from '@/components/ui/Toast';
import { useConversationMessages, useConversations } from '@/hooks/queries/useMessages';
import { useMessageStore } from '@/store/messageStore';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const quickReplies = ["I'm on my way", 'Running 5 mins late', "What's the ETA?", 'Thank you!'];

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: initialMessages } = useConversationMessages(id);
  const { data: conversations } = useConversations();
  const messagesById = useMessageStore((s) => s.messages);
  const messages = useMemo(() => messagesById[id] ?? [], [messagesById, id]);
  const setMessages = useMessageStore((s) => s.setMessages);
  const sendMessage = useMessageStore((s) => s.sendMessage);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const conversation = conversations?.find((c) => c.id === id);

  useEffect(() => {
    if (initialMessages && messages.length === 0) setMessages(id, initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }).catch(() => {});
  }, []);

  async function sendImage(uri: string) {
    sendMessage({ id: `m-${Date.now()}`, conversationId: id, sender: 'me', kind: 'image', content: uri, createdAt: 'Now', read: true });
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      toast.show('Camera permission is required to take a photo', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) sendImage(result.assets[0].uri);
  }

  async function pickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.show('Photo library permission is required', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) sendImage(result.assets[0].uri);
  }

  function openCameraOptions() {
    Alert.alert('Send a photo', undefined, [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleSend(content: string) {
    if (!content.trim()) return;
    sendMessage({ id: `m-${Date.now()}`, conversationId: id, sender: 'me', kind: 'text', content, createdAt: 'Now', read: true });
    setText('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      sendMessage({
        id: `m-${Date.now() + 1}`,
        conversationId: id,
        sender: 'them',
        kind: 'text',
        content: 'Got it, thanks for letting me know!',
        createdAt: 'Now',
        read: false,
      });
    }, 1800);
  }

  // Recording
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 100);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const dotPulse = useSharedValue(1);

  useEffect(() => {
    if (isRecording && !isPaused) {
      dotPulse.value = withRepeat(withTiming(0.3, { duration: 500 }), -1, true);
    } else {
      dotPulse.value = 1;
    }
  }, [isRecording, isPaused]);

  async function beginRecording() {
    if (isRecording) return;
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    if (!granted) {
      toast.show('Microphone permission is required to record voice messages', 'error');
      return;
    }
    setIsPaused(false);
    setIsRecording(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      setIsRecording(false);
      toast.show('Could not start recording', 'error');
    }
  }

  function togglePause() {
    if (isPaused) {
      recorder.record();
      setIsPaused(false);
    } else {
      recorder.pause();
      setIsPaused(true);
    }
  }

  async function finishRecording(cancelled: boolean) {
    if (!isRecording) return;
    const durationSeconds = Math.max(1, Math.round(recorderState.durationMillis / 1000));
    setIsRecording(false);
    setIsPaused(false);
    try {
      await recorder.stop();
    } catch {
      toast.show('Could not save recording', 'error');
      return;
    }
    if (cancelled) return;
    const uri = recorder.uri;
    if (!uri) {
      toast.show('Could not save recording', 'error');
      return;
    }
    sendMessage({ id: `m-${Date.now()}`, conversationId: id, sender: 'me', kind: 'voice', content: uri, durationSeconds, createdAt: 'Now', read: true });
  }

  const dotStyle = useAnimatedStyle(() => ({ opacity: dotPulse.value }));

  const elapsedSeconds = Math.floor(recorderState.durationMillis / 1000);

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <BackButton />
          <Image source={{ uri: conversation?.participantAvatarUrl }} style={{ width: 38, height: 38, borderRadius: 19 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.participantName}>{conversation?.participantName}</Text>
            <Text style={styles.status}>
              {typing ? 'Typing...' : conversation?.online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item }) => <MessageBubble message={item} />}
          inverted={false}
        />

        {!isRecording ? (
          <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={quickReplies}
              keyExtractor={(item) => item}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <AnimatedPressable onPress={() => handleSend(item)} style={styles.quickReply}>
                  <Text style={styles.quickReplyLabel}>{item}</Text>
                </AnimatedPressable>
              )}
            />
          </View>
        ) : null}

        <View style={[styles.inputRow, { position: 'relative' }]}>
          {!isRecording ? (
            <>
              <AnimatedPressable scaleTo={0.85} onPress={openCameraOptions} style={styles.roundButton}>
                <Camera size={22} color={colors.textSecondary} />
              </AnimatedPressable>
              <AnimatedPressable
                scaleTo={0.85}
                onPress={() =>
                  sendMessage({ id: `m-${Date.now()}`, conversationId: id, sender: 'me', kind: 'location', content: '', createdAt: 'Now', read: true })
                }
                style={styles.roundButton}>
                <MapPin size={22} color={colors.textSecondary} />
              </AnimatedPressable>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Type a message..."
                placeholderTextColor={colors.textSecondary}
                style={styles.textInput}
              />
              <AnimatedPressable
                scaleTo={0.8}
                disabled={!text.trim()}
                onPress={() => handleSend(text)}
                style={[styles.sendButton, { opacity: text.trim() ? 1 : 0.4 }]}>
                <Send size={19} color="#FFFFFF" />
              </AnimatedPressable>
            </>
          ) : (
            <>
              <View style={styles.lockedBar}>
                <AnimatedPressable onPress={() => finishRecording(true)} style={styles.deleteButton}>
                  <Trash2 size={16} color={colors.danger} />
                </AnimatedPressable>
                <Animated.View style={[styles.recordDot, dotStyle]} />
                <Text style={[styles.durationLabel, { minWidth: 36 }]}>{formatDuration(elapsedSeconds)}</Text>
                <View style={{ flex: 1 }} />
                <AnimatedPressable onPress={togglePause} style={styles.pauseButton}>
                  {isPaused ? <Play size={16} color={colors.primary} fill={colors.primary} /> : <Pause size={16} color={colors.primary} fill={colors.primary} />}
                </AnimatedPressable>
              </View>
              <AnimatedPressable onPress={() => finishRecording(false)} style={styles.sendButton}>
                <Send size={19} color="#FFFFFF" />
              </AnimatedPressable>
            </>
          )}

          {!isRecording ? (
            <AnimatedPressable onPress={beginRecording} style={styles.micButton}>
              <Mic size={20} color={colors.textSecondary} />
            </AnimatedPressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
    participantName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    status: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    quickReply: { backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    quickReplyLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
    roundButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    textInput: { flex: 1, backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },
    sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    lockedBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
    deleteButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${colors.danger}1A`, alignItems: 'center', justifyContent: 'center' },
    pauseButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
    recordDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
    durationLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.danger },
    micButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  });
}
