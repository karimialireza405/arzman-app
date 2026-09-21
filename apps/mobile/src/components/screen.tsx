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
import { curve, iconSizes, radii, spacing } from "../design-system";
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
}) {
  const t = useTheme();
  const app = useApp();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: t.background }}
    >
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
        <View
          style={{
            flexDirection: "row-reverse",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: spacing.xs,
            paddingTop: spacing.xxs,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            {eyebrow ? (
              <Label accent size={13} weight="600">
                {eyebrow}
              </Label>
            ) : null}
            <Label variant="largeTitle" numberOfLines={1}>
              {title}
            </Label>
          </View>
          {trailing}
        </View>

        {headerAccessory}

        {app.storageError ? (
          <Label red size={13}>
            {app.storageError}
          </Label>
        ) : null}

        {children}
      </ScrollView>
    </SafeAreaView>
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
 * Numeric amount field (converter, transaction, custom rate).
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
            fontSize: 24,
            lineHeight: 30,
            fontWeight: "600",
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
