import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTabTransitionStore } from '@/store/tabTransitionStore';

// WhatsApp-style tab switch: quick directional slide + fade, not a slow fade-rise.
// Returns raw shared values so callers (e.g. TabScreen) can combine this entrance
// motion with other transforms, such as a live swipe-drag offset, in one style.
export function useTabTransition(routeIndex: number) {
  const isFocused = useIsFocused();
  const progress = useSharedValue(1);
  const direction = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      const { activeIndex, previousIndex } = useTabTransitionStore.getState();
      direction.value = activeIndex >= previousIndex ? 1 : -1;
      progress.value = 0;
      progress.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
    }
  }, [isFocused, routeIndex]);

  return { progress, direction };
}
