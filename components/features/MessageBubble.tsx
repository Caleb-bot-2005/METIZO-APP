import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin, Pause, Play } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { ChatMessage } from '@/types/message';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.max(0, Math.round(totalSeconds % 60));
  return `${m}:${String(s).padStart(2, '0')}`;
}

const waveformBars = [6, 10, 14, 8, 12, 6, 9, 11, 7, 13, 5, 10];

function VoiceMessageContent({ message, isMe }: { message: ChatMessage; isMe: boolean }) {
  const colors = useThemeColors();
  const hasAudio = !!message.content;
  const player = useAudioPlayer(hasAudio ? message.content : null);
  const status = useAudioPlayerStatus(player);

  const activeColor = isMe ? '#FFFFFF' : '#0A84FF';
  const dimColor = isMe ? 'rgba(255,255,255,0.35)' : 'rgba(10,132,255,0.25)';

  const totalSeconds = message.durationSeconds ?? Math.round(status.duration || 0);
  const displaySeconds = status.playing ? Math.round(status.currentTime) : totalSeconds;
  const progress = status.duration > 0 ? Math.min(status.currentTime / status.duration, 1) : 0;
  const filledCount = Math.round(progress * waveformBars.length);

  function toggle() {
    if (!hasAudio) return;
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.duration > 0 && status.currentTime >= status.duration - 0.05) {
      player.seekTo(0);
    }
    player.play();
  }

  return (
    <Pressable onPress={toggle} disabled={!hasAudio} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {status.playing ? (
        <Pause size={16} color={activeColor} fill={activeColor} />
      ) : (
        <Play size={16} color={activeColor} fill={activeColor} />
      )}
      <View style={{ flexDirection: 'row', gap: 2, alignItems: 'flex-end', height: 16 }}>
        {waveformBars.map((h, i) => (
          <View
            key={i}
            style={{ width: 2.5, height: h, borderRadius: 2, backgroundColor: i < filledCount ? activeColor : dimColor }}
          />
        ))}
      </View>
      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: isMe ? '#FFFFFF' : colors.text }}>
        {formatDuration(displaySeconds)}
      </Text>
    </Pressable>
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const isMe = message.sender === 'me';

  return (
    <View style={{ flexDirection: 'row', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
      <View
        style={[
          styles.bubble,
          isMe ? { backgroundColor: colors.primary, borderBottomRightRadius: 6 } : { backgroundColor: colors.card, borderBottomLeftRadius: 6 },
        ]}>
        {message.kind === 'text' ? (
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: isMe ? '#FFFFFF' : colors.text }}>{message.content}</Text>
        ) : null}
        {message.kind === 'voice' ? <VoiceMessageContent message={message} isMe={isMe} /> : null}
        {message.kind === 'location' ? (
          <View style={{ gap: 4 }}>
            <View style={styles.locationPreview}>
              <MapPin size={20} color="#0A84FF" />
            </View>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: isMe ? '#FFFFFF' : colors.text }}>Shared location</Text>
          </View>
        ) : null}
        {message.kind === 'image' ? (
          <Image source={{ uri: message.content }} style={{ width: 180, height: 130, borderRadius: 14 }} />
        ) : null}
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 4, color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary }}>
          {message.createdAt}
        </Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
    locationPreview: { width: 160, height: 96, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  });
}
