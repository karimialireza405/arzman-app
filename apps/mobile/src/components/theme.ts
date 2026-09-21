/**
 * Theme + native feedback helpers.
 *
 * Part of the ArzMan UI kit. `src/ui.tsx` re-exports everything so screens keep
 * importing from a single path.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Platform, useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import { useApp } from "../store";
import {
  colors as systemColors,
  springs,
  typography,
  type TextStyleName,
} from "../design-system";
import type { TextStyle, ViewStyle } from "react-native";

export type Theme = (typeof systemColors)["dark"] & { dark: boolean };

export function useTheme(): Theme {
  const { user } = useApp();
  const system = useColorScheme();
  const dark =
    user.settings.appearance === "dark" ||
    (user.settings.appearance === "system" && system !== "light");
  const current = dark ? systemColors.dark : systemColors.light;
  return { ...current, dark };
}

/**
 * Reduce Motion — read the *system* switch (Settings → Accessibility → Motion)
 * so a user who disabled motion device-wide gets instant, non-animated controls.
 */
export function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        if (mounted) setReduced(value);
      },
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

/**
 * Native feedback helper.
 *
 * Apple: "Always include a press state for a custom button." Haptics are the iOS
 * half of that contract, so every interactive component in this kit routes
 * through here and respects the user's Haptics setting.
 */
export function useFeedback() {
  const app = useApp();
  const enabled = app.user.settings.haptics && Platform.OS !== "web";
  return {
    /** Selection tick used when a value changes. */
    tap: () => app.haptic(),
    /** Light impact used on press-in of a control. */
    press: () => {
      if (!enabled) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    },
    /** Success notification used when data is persisted. */
    success: () => {
      if (!enabled) return;
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => undefined);
    },
    /** Warning notification for destructive confirmations. */
    warning: () => {
      if (!enabled) return;
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      ).catch(() => undefined);
    },
  };
}

/**
 * Spring press feedback for custom controls.
 *
 * Apple's press states are a subtle scale plus a spring return — not a bounce.
 * Reduce Motion is honored: the scale is skipped instead of animated.
 */
export function usePressFeedback(to = 0.97) {
  const value = useRef(new Animated.Value(1)).current;
  const reduced = useReduceMotion();

  const animate = useCallback(
    (target: number) => {
      if (reduced) {
        value.setValue(1);
        return;
      }
      Animated.spring(value, {
        toValue: target,
        useNativeDriver: true,
        damping: springs.press.damping,
        stiffness: springs.press.stiffness,
        mass: springs.press.mass,
      }).start();
    },
    [reduced, value],
  );

  return {
    style: { transform: [{ scale: value }] } as ViewStyle,
    handlers: {
      onPressIn: () => animate(to),
      onPressOut: () => animate(1),
    },
  };
}

/** Resolve an Apple text style name into a React Native text style. */
export function textStyle(name: TextStyleName): TextStyle {
  const style = typography[name] as TextStyle;
  return { ...style, fontFamily: undefined };
}
