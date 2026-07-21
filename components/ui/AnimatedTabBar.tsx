import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grid2x2, House, MessageCircle, User, Wrench } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTabTransitionStore } from '@/store/tabTransitionStore';
import { tabIndicatorProgress } from '@/store/tabIndicatorProgress';

const icons: Record<string, typeof House> = {
  index: House,
  categories: Grid2x2,
  jobs: Wrench,
  messages: MessageCircle,
  profile: User,
};

const DOT_WIDTH = 24;

type TabBarStyles = ReturnType<typeof createStyles>;

interface TabBarButtonProps {
  focused: boolean;
  label: string;
  routeName: string;
  onPress: () => void;
  onLongPress: () => void;
  colors: ThemeColors;
  styles: TabBarStyles;
  accentColor: string;
}

function TabBarButton({ focused, label, routeName, onPress, onLongPress, colors, styles, accentColor }: TabBarButtonProps) {
  const scale = useSharedValue(1);
  const Icon = icons[routeName] ?? House;
  const tint = focused ? accentColor : colors.textSecondary;

  React.useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.15, { damping: 10, stiffness: 500 }, () => {
        scale.value = withSpring(1, { damping: 12, stiffness: 450 });
      });
    }
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Pressable onPress={handlePress} onLongPress={onLongPress} style={styles.button}>
      <Animated.View style={iconStyle}>
        <Icon color={tint} size={25} strokeWidth={2} fill={focused ? tint : 'transparent'} />
      </Animated.View>
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

interface AnimatedTabBarProps extends BottomTabBarProps {
  // Lets a nested navigator (e.g. the artisan tabs) tint the bar with its own
  // brand accent instead of the default customer blue.
  accentColor?: string;
}

export function AnimatedTabBar({ state, descriptors, navigation, accentColor }: AnimatedTabBarProps) {
  const insets = useSafeAreaInsets();
  const barWidth = useSharedValue(0);
  const routeCount = state.routes.length;
  const colors = useThemeColors();
  const tint = accentColor ?? colors.primary;
  const styles = createStyles(colors, tint);

  function moveIndicatorTo(index: number) {
    tabIndicatorProgress.value = withTiming(index, { duration: 150 });
  }

  // Covers navigation triggered from outside the tab bar (e.g. router.push to a tab route)
  // and keeps this store in sync so TabScreen knows which direction to slide.
  React.useEffect(() => {
    moveIndicatorTo(state.index);
    useTabTransitionStore.getState().setActiveIndex(state.index);
  }, [state.index]);

  // tabIndicatorProgress is a continuous fractional index (also driven live by
  // TabScreen's swipe gesture), so the pill tracks drags in real time, not just taps.
  const indicatorStyle = useAnimatedStyle(() => {
    const segment = barWidth.value / routeCount;
    const x = tabIndicatorProgress.value * segment + (segment - DOT_WIDTH) / 2;
    return {
      transform: [{ translateX: x }],
      width: DOT_WIDTH,
      opacity: barWidth.value > 0 ? 1 : 0,
    };
  });

  return (
    <View
      style={[styles.bar, { height: 64 + insets.bottom, paddingBottom: insets.bottom + 8 }]}
      onLayout={(e) => {
        barWidth.value = e.nativeEvent.layout.width;
      }}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = (options.title ?? route.name) as string;
        const focused = state.index === index;

        function onPress() {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
          moveIndicatorTo(index);
        }

        function onLongPress() {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        }

        return (
          <TabBarButton
            key={route.key}
            focused={focused}
            label={label}
            routeName={route.name}
            onPress={onPress}
            onLongPress={onLongPress}
            colors={colors}
            styles={styles}
            accentColor={tint}
          />
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors, accentColor: string) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    indicator: {
      position: 'absolute',
      top: 0,
      height: 3,
      borderRadius: 999,
      backgroundColor: accentColor,
    },
    button: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
    label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 2 },
  });
}
