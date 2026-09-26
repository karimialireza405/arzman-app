/**
 * Screen scaffold, form field and empty state.
 *
 * Safe-area contract (HIG · Layout):
 *  - the scroll view accounts for the top inset (Dynamic Island) via
 *    SafeAreaView, and
 *  - reserves exactly the floating tab bar's height + home-indicator inset at
 *    the bottom, so no content is ever hidden behind chrome.
 * Sheet screens pass `floatingTabBar={false}` because they have no tab bar.
 */
import React, { useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import Reanimated, { FadeInDown } from "react-native-reanimated";
import { curve, fontFamilies, iconSizes, radii, spacing } from "../design-system";
import { useApp } from "../store";
import { AppIcon, Label } from "./primitives";
import { Button } from "./controls";
import { useTheme } from "./theme";
import type { StyleProp, ViewStyle } from "react-native";

/**
 * Floating tab bar metrics (iOS 26 Liquid Glass floating tab bar).
 * Screens import this so the scroll inset and the bar geometry can never drift.
 */
export const TAB_BAR = {
  height: 58,
  radius: radii.tabBar,
  sideInset: spacing.sm,
  bottomGap: spacing.xxs,
  clearance: (insetBottom: number) =>
    TAB_BAR.height +
    Math.max(insetBottom, TAB_BAR.sideInset) +
    TAB_BAR.bottomGap +
    spacing.sm,
};

export function Screen({
  title,
  eyebrow,
  children,
  refresh = false,
  trailing,
  floatingTabBar = true,
  contentStyle,
  headerAccessory,
  largeTitle = true,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  refresh?: boolean;
  trailing?: React.ReactNode;
  /** Set false on modal sheets that are not presented over the tab bar. */
  floatingTabBar?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  headerAccessory?: React.ReactNode;
  /** False on pushed screens whose navigation bar already shows the title. */
  largeTitle?: boolean;
}) {
  const t = useTheme();
  const app = useApp();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: t.background }}
    >
      <AmbientGlow />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          {
            paddingHorizontal: spacing.sm,
            paddingTop: spacing.xxs,
            paddingBottom: floatingTabBar
              ? TAB_BAR.clearance(insets.bottom)
              : spacing.xl,
            gap: spacing.lg,
            maxWidth: 720,
            width: "100%",
            alignSelf: "center",
          },
          contentStyle,
        ]}
        refreshControl={
          refresh ? (
            <RefreshControl
              refreshing={app.busy}
              onRefresh={() => void app.refresh(true)}
              tintColor={t.textSecondary}
            />
          ) : undefined
        }
      >
        {largeTitle ? (
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: spacing.xs,
              paddingTop: spacing.xxs,
            }}
          >
            {/* iOS large-title idiom: the title leads, context follows it in a
                secondary tone. A tinted line *above* the title competed with it. */}
            <View style={{ flex: 1, gap: 2 }}>
              <Label variant="largeTitle" numberOfLines={1}>
                {title}
              </Label>
              {eyebrow ? (
                <Label secondary size={15} numberOfLines={1}>
                  {eyebrow}
                </Label>
              ) : null}
            </View>
            {trailing}
          </View>
        ) : null}

        {headerAccessory}

        {app.storageError ? (
          <Label red size={13}>
            {app.storageError}
          </Label>
        ) : null}

        {/* Sections arrive in order, 60 ms apart — once, on first mount (tabs
            stay mounted, so switching tabs does not replay it). Reanimated
            skips layout animations when the system Reduce Motion is on. */}
        {React.Children.toArray(children).map((child, index) => (
          <Reanimated.View
            key={index}
            entering={FadeInDown.duration(420).delay(Math.min(index, 6) * 60)}
          >
            {child}
          </Reanimated.View>
        ))}
      </ScrollView>
      {floatingTabBar ? <ScrollEdgeFade height={TAB_BAR.clearance(insets.bottom)} /> : null}
    </SafeAreaView>
  );
}

/**
 * Soft brand light behind the top of every screen — the depth cue the dark
 * fintech references use instead of flat black. Decorative and non-interactive.
 */
function AmbientGlow() {
  const t = useTheme();
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420 }}
    >
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="ambient" cx="0.9" cy="0" rx="0.9" ry="0.8" fx="0.9" fy="0">
            <Stop offset="0" stopColor={t.dark ? "#6247E0" : "#8B5CF6"} stopOpacity={t.dark ? 0.32 : 0.14} />
            <Stop offset="1" stopColor={t.dark ? "#6247E0" : "#8B5CF6"} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambient)" />
      </Svg>
    </View>
  );
}

/**
 * Scroll-edge effect under the floating tab bar.
 *
 * The system tab bar on iOS 26 softens the content scrolling beneath it; a
 * custom floating bar gets no such treatment, so rows showed through the glass
 * crisp enough to collide with the tab labels. This fades the content into the
 * background behind the bar. It never takes touches.
 */
function ScrollEdgeFade({ height }: { height: number }) {
  const t = useTheme();
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: 0, right: 0, bottom: 0, height }}
    >
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="scrollEdge" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.background} stopOpacity={0} />
            <Stop offset="0.45" stopColor={t.background} stopOpacity={0.82} />
            <Stop offset="1" stopColor={t.background} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#scrollEdge)" />
      </Svg>
    </View>
  );
}

/** Section heading + optional trailing action, above a grouped surface. */
export function Section({
  title,
  subtitle,
  action,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  action?: { title: string; onPress: () => void };
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View style={[{ gap: spacing.xxs }, style]}>
      <View
        style={{
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: spacing.xs,
          paddingHorizontal: spacing.xxs,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Label size={20} weight="600" style={{ lineHeight: 25 }}>
            {title}
          </Label>
          {subtitle ? (
            <Label secondary size={12}>
              {subtitle}
            </Label>
          ) : null}
        </View>
        {action ? (
          <Button
            title={action.title}
            variant="plain"
            size="small"
            onPress={action.onPress}
            textStyle={{ color: t.accent }}
          />
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** Empty state. Apple explains *why* a section is empty instead of hiding it. */
export function EmptyState({
  title,
  description,
  icon = "chart",
  action,
}: {
  title: string;
  description: string;
  icon?: string;
  action?: { title: string; onPress: () => void };
}) {
  const t = useTheme();
  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.md,
        gap: spacing.xs,
      }}
    >
      <AppIcon name={icon} size={iconSizes.fab} color={t.textTertiary} />
      <Label size={17} weight="600" align="center">
        {title}
      </Label>
      <Label secondary size={13} align="center" style={{ maxWidth: 300, lineHeight: 20 }}>
        {description}
      </Label>
      {action ? (
        <Button
          title={action.title}
          variant="tinted"
          size="medium"
          style={{ marginTop: spacing.xxs }}
          onPress={action.onPress}
        />
      ) : null}
    </View>
  );
}

/**
 * Numeric amount field (converter, custom rate, alerts).
 *
 * Apple guidance for numeric entry: big, right-aligned tabular digits, a quiet
 * unit caption, and a clear control instead of a "delete" key dance. Keyboard
 * insets are handled by `Screen` (automaticallyAdjustKeyboardInsets on iOS).
 */
export function AmountInput({
  label,
  value,
  onChangeText,
  placeholder = "۰",
  unit,
  keyboardType = "decimal-pad",
  autoFocus = false,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  unit?: string;
  keyboardType?: "decimal-pad" | "number-pad";
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ gap: spacing.xxs }, style]}>
      <View
        style={{
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "center",
          gap: spacing.xxs,
        }}
      >
        <Label secondary size={13} weight="600">
          {label}
        </Label>
        {unit ? (
          <Label tertiary size={11} allowFontScaling={false}>
            {unit}
          </Label>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          gap: spacing.xxs,
          minHeight: 52,
          paddingHorizontal: spacing.sm,
          borderRadius: radii.controlSmall + 2,
          borderCurve: curve.continuous,
          backgroundColor: t.fillQuaternary,
          borderWidth: 1,
          borderColor: focused ? t.accent : "transparent",
        }}
      >
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.textTertiary}
          keyboardType={keyboardType}
          inputMode="decimal"
          returnKeyType="done"
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={() => Keyboard.dismiss()}
          allowFontScaling={false}
          style={{
            flex: 1,
            color: t.text,
            fontFamily: fontFamilies.semibold,
            fontSize: 24,
            lineHeight: 38,
            fontVariant: ["tabular-nums"],
            textAlign: "right",
            writingDirection: "rtl",
            paddingVertical: Platform.OS === "ios" ? 8 : 6,
          }}
        />
        {value.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="پاک کردن مقدار"
            hitSlop={10}
            onPress={() => onChangeText("")}
          >
            <AppIcon name="close" size={17} color={t.textTertiary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
