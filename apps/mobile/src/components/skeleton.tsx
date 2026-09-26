/**
 * Skeleton — a placeholder shaped like the content that is on its way.
 *
 * Shown only while a first value is genuinely loading; callers fall back to
 * "—" once a request has failed, so a placeholder never pulses indefinitely.
 * The pulse is a Reanimated timing loop, which the system Reduce Motion
 * setting turns into a static block.
 */
import { useEffect } from "react";
import type { DimensionValue, StyleProp, ViewStyle } from "react-native";
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "./theme";

export function Skeleton({
  width,
  height,
  radius = 6,
  color,
  style,
}: {
  width: DimensionValue;
  height: number;
  radius?: number;
  /** Override for surfaces with their own palette (the brand hero). */
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const pulse = useSharedValue(0.55);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Reanimated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: radius, backgroundColor: color ?? t.fillTertiary },
        animated,
        style,
      ]}
    />
  );
}
