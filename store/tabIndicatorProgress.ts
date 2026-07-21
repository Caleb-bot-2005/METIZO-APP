import { makeMutable } from 'react-native-reanimated';

// A single UI-thread shared value representing the bottom tab bar's continuous,
// fractional "active tab position" (e.g. 1.4 while 40% of the way from tab 1 to 2).
// Both the swipe gesture (TabScreen) and tap handling (AnimatedTabBar) write to it
// so the indicator pill always tracks the real transition in real time, WhatsApp-style,
// instead of jumping only after navigation settles.
export const tabIndicatorProgress = makeMutable(0);
