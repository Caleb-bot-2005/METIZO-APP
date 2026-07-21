import React, { useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { useTabTransition } from '@/hooks/use-tab-transition';
import { useTabTransitionStore } from '@/store/tabTransitionStore';
import { tabIndicatorProgress } from '@/store/tabIndicatorProgress';

const { width: SCREEN_W } = Dimensions.get('window');
const SLIDE_OFFSET = SCREEN_W * 0.3;
const SWIPE_DISTANCE_THRESHOLD = SCREEN_W * 0.2;
const SWIPE_VELOCITY_THRESHOLD = 600;
const ROUTE_COUNT = 5;
const DURATION = 150;
const EASING = Easing.out(Easing.cubic);

const TAB_ROUTES = ['/(tabs)', '/(tabs)/categories', '/(tabs)/jobs', '/(tabs)/messages', '/(tabs)/profile'] as const;

function goToTab(index: number) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push(TAB_ROUTES[index] as any);
}

interface TabScreenProps {
  routeIndex: number;
  children: React.ReactNode;
}

// Wraps each bottom-tab screen with a WhatsApp-style horizontal swipe-between-tabs
// gesture, and keeps the bottom tab bar's indicator (tabIndicatorProgress) tracking
// the motion continuously — both for live drags and for taps on the tab bar itself
// (see the isFocused-loss branch below, which mirrors what the swipe path does).
export function TabScreen({ routeIndex, children }: TabScreenProps) {
  const isFocused = useIsFocused();
  const wasFocused = useRef(isFocused);
  const { progress, direction } = useTabTransition(routeIndex);
  const dragX = useSharedValue(0);

  useEffect(() => {
    if (isFocused) {
      dragX.value = 0;
    } else if (wasFocused.current) {
      const { activeIndex, previousIndex } = useTabTransitionStore.getState();
      if (previousIndex === routeIndex && activeIndex !== routeIndex) {
        const dir = activeIndex >= previousIndex ? 1 : -1;
        dragX.value = withTiming(-SLIDE_OFFSET * dir, { duration: DURATION, easing: EASING });
      }
    }
    wasFocused.current = isFocused;
  }, [isFocused]);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-8, 8])
    .onUpdate((e) => {
      let dx = e.translationX;
      const atStart = routeIndex === 0 && dx > 0;
      const atEnd = routeIndex === ROUTE_COUNT - 1 && dx < 0;
      if (atStart || atEnd) dx *= 0.35;
      dragX.value = dx;
      tabIndicatorProgress.value = routeIndex - dx / SCREEN_W;
    })
    .onEnd((e) => {
      const passedThreshold =
        Math.abs(e.translationX) > SWIPE_DISTANCE_THRESHOLD || Math.abs(e.velocityX) > SWIPE_VELOCITY_THRESHOLD;
      const goingLeft = e.translationX < 0 || e.velocityX < -SWIPE_VELOCITY_THRESHOLD;

      let targetIndex = routeIndex;
      if (passedThreshold && goingLeft && routeIndex < ROUTE_COUNT - 1) targetIndex = routeIndex + 1;
      else if (passedThreshold && !goingLeft && routeIndex > 0) targetIndex = routeIndex - 1;

      if (targetIndex !== routeIndex) {
        const exitTo = targetIndex > routeIndex ? -SLIDE_OFFSET : SLIDE_OFFSET;
        tabIndicatorProgress.value = withTiming(targetIndex, { duration: DURATION, easing: EASING });
        dragX.value = withTiming(exitTo, { duration: DURATION, easing: EASING }, (finished) => {
          if (finished) runOnJS(goToTab)(targetIndex);
        });
      } else {
        dragX.value = withSpring(0, { damping: 22, stiffness: 400 });
        tabIndicatorProgress.value = withSpring(routeIndex, { damping: 22, stiffness: 400 });
      }
    });

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: (1 - progress.value) * SLIDE_OFFSET * direction.value + dragX.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>
    </GestureDetector>
  );
}
