import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarClock, CalendarDays, Check, Sun } from 'lucide-react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { StepProgress } from '@/components/ui/StepProgress';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useJobStore } from '@/store/jobStore';
import { JobTiming } from '@/types/job';
import { ThemeColors } from '@/theme/colors';
import { useIsDark, useThemeColors } from '@/hooks/use-theme-colors';

function defaultScheduleDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

function formatScheduledAt(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const options: { key: JobTiming; label: string; description: string; icon: typeof Sun }[] = [
  {
    key: 'today',
    label: 'Today',
    description: 'Get help as soon as possible',
    icon: Sun,
  },
  {
    key: 'tomorrow',
    label: 'Tomorrow',
    description: 'Schedule for the next day',
    icon: CalendarDays,
  },
  {
    key: 'scheduled',
    label: 'Schedule',
    description: 'Pick a specific date and time',
    icon: CalendarClock,
  },
];

export default function JobTimingStep() {
  const draft = useJobStore((s) => s.draft);
  const updateDraft = useJobStore((s) => s.updateDraft);
  const selectedOption = options.find((o) => o.key === draft.timing);
  const colors = useThemeColors();
  const isDark = useIsDark();
  const styles = createStyles(colors);

  const [pendingDate, setPendingDate] = useState<Date>(() => (draft.scheduledAt ? new Date(draft.scheduledAt) : defaultScheduleDate()));
  const [sheetVisible, setSheetVisible] = useState(false);
  const [androidStage, setAndroidStage] = useState<'date' | 'time' | null>(null);

  function select(timing: JobTiming) {
    if (timing === 'scheduled') {
      openSchedulePicker();
      return;
    }
    updateDraft({ timing, scheduledAt: undefined });
  }

  function openSchedulePicker() {
    setPendingDate(draft.scheduledAt ? new Date(draft.scheduledAt) : defaultScheduleDate());
    if (Platform.OS === 'android') {
      setAndroidStage('date');
    } else {
      setSheetVisible(true);
    }
  }

  function confirmSchedule(date: Date) {
    updateDraft({ timing: 'scheduled', scheduledAt: date.toISOString() });
  }

  function onAndroidChange(event: DateTimePickerEvent, selected?: Date) {
    if (event.type !== 'set' || !selected) {
      setAndroidStage(null);
      return;
    }
    if (androidStage === 'date') {
      const combined = new Date(pendingDate);
      combined.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setPendingDate(combined);
      setAndroidStage('time');
    } else if (androidStage === 'time') {
      const combined = new Date(pendingDate);
      combined.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setAndroidStage(null);
      setPendingDate(combined);
      confirmSchedule(combined);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StepProgress step={6} total={7} title="When do you need this done?" />
      <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
        <Text style={styles.description}>
          Pick a timeframe and we&apos;ll match you with artisans who are free then.
        </Text>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 24, gap: 12 }}>
        {options.map((option) => {
          const selected = draft.timing === option.key;
          return (
            <AnimatedPressable
              key={option.key}
              onPress={() => select(option.key)}
              style={[
                styles.optionRow,
                selected ? { borderColor: colors.primary, backgroundColor: `${colors.primary}0D` } : { borderColor: 'transparent', backgroundColor: colors.card },
              ]}>
              <View style={styles.optionIcon}>
                <option.icon size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>
                  {option.key === 'scheduled' && selected && draft.scheduledAt ? formatScheduledAt(draft.scheduledAt) : option.description}
                </Text>
              </View>
              <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>
                {selected ? (
                  <Animated.View entering={ZoomIn.duration(200)}>
                    <Check size={13} color={colors.primary} strokeWidth={3} />
                  </Animated.View>
                ) : null}
              </View>
            </AnimatedPressable>
          );
        })}

        {selectedOption ? (
          <Animated.View key={`${selectedOption.key}-${draft.scheduledAt ?? ''}`} entering={FadeInDown.duration(250)} style={styles.confirmRow}>
            <Check size={16} color={colors.primary} />
            <Text style={styles.confirmText}>
              {selectedOption.key === 'today'
                ? "We'll match you with artisans available right now."
                : selectedOption.key === 'tomorrow'
                  ? "We'll line up an artisan for tomorrow."
                  : `We'll hold this slot for ${formatScheduledAt(draft.scheduledAt)}.`}
            </Text>
          </Animated.View>
        ) : null}

        {draft.timing === 'scheduled' ? (
          <AnimatedPressable onPress={openSchedulePicker} style={styles.changeTimeRow}>
            <CalendarClock size={14} color={colors.primary} />
            <Text style={styles.changeTimeLabel}>Change date &amp; time</Text>
          </AnimatedPressable>
        ) : null}
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Button label="Continue" size="lg" disabled={!draft.timing} onPress={() => router.push('/jobs/new/review')} />
      </View>

      {Platform.OS === 'android' && androidStage ? (
        <DateTimePicker
          value={pendingDate}
          mode={androidStage}
          display="default"
          minimumDate={new Date()}
          onChange={onAndroidChange}
        />
      ) : null}

      <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        <Text style={styles.pickerTitle}>Choose date &amp; time</Text>
        <DateTimePicker
          value={pendingDate}
          mode="datetime"
          display="spinner"
          minimumDate={new Date()}
          themeVariant={isDark ? 'dark' : 'light'}
          onChange={(_, selected) => selected && setPendingDate(selected)}
        />
        <Button
          label="Confirm"
          size="lg"
          onPress={() => {
            confirmSchedule(pendingDate);
            setSheetVisible(false);
          }}
        />
        <Button label="Cancel" variant="ghost" size="lg" onPress={() => setSheetVisible(false)} />
      </BottomSheet>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    description: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
    optionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 16, padding: 16, borderWidth: 2 },
    optionIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
    optionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text },
    optionDescription: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: `${colors.primary}1A`, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
    confirmText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.primary, flex: 1 },
    changeTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
    changeTimeLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary },
    pickerTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text, textAlign: 'center' },
  });
}
