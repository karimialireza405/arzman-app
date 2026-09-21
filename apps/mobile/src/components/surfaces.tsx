/**
 * Surfaces — the material hierarchy.
 *
 * Apple HIG · Materials: "Liquid Glass forms a distinct functional layer for
 * controls and navigation elements" while "standard materials help with visual
 * differentiation within the content layer". ArzMan therefore spends glass on
 * chrome (tab bar, floating controls) and keeps market *content* opaque so
 * prices stay legible.
 */
import React from "react";
import { Animated, Platform, Pressable, StyleSheet, Switch, View } from "react-native";
import { BlurView } from "expo-blur";
import { GlassContainer as NativeGlassContainer, GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { curve, iconSizes, materials, radii, spacing } from "../design-system";
import { useFeedback, usePressFeedback, useTheme } from "./theme";
import { AppIcon, Divider, IconTile, Label } from "./primitives";
import type { StyleProp, ViewStyle } from "react-native";

export type GlassTone = "regular" | "clear" | "prominent";

/**
 * Liquid Glass surface.
 *
 * iOS 26+: the real system material (`expo-glass-effect`).
 * Web / Android: a blur approximation with an opaque-enough tint. We
 * deliberately do NOT try to fake the iOS specular rim on web — the honest
 * fallback keeps text contrast predictable (see docs/ui-audit.md).
 */
export function Glass({
  children,
  glassEffectStyle = "regular",
  interactive = false,
  tintColor,
  radius = radii.card,
  specular = false,
  style,
}: {
  children?: React.ReactNode;
  glassEffectStyle?: GlassTone | "none";
  interactive?: boolean;
  tintColor?: string;
  radius?: number;
  specular?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const native = Platform.OS === "ios" && isLiquidGlassAvailable();
  const rim = t.dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)";

  if (native) {
    // expo-glass-effect supports "regular" | "clear"; "prominent" falls back
    // to "regular" with a stronger tint below.
    const nativeStyle =
      glassEffectStyle === "none" || glassEffectStyle === "clear"
        ? "clear"
        : "regular";
    return (
      <GlassView
        glassEffectStyle={nativeStyle}
        isInteractive={interactive}
        tintColor={tintColor}
        colorScheme={t.dark ? "dark" : "light"}
        style={[
          {
            borderRadius: radius,
            borderCurve: curve.continuous,
            overflow: "hidden",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: rim,
          },
          style,
        ]}
      >
        {specular && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: spacing.md,
              right: spacing.md,
              height: materials.specularHeight,
              backgroundColor: t.dark ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.9)",
            }}
          />
        )}
        {children}
      </GlassView>
    );
  }

  const tint: "systemChromeMaterialDark" | "systemChromeMaterialLight" = t.dark
    ? "systemChromeMaterialDark"
    : "systemChromeMaterialLight";
  const intensity = t.dark
    ? materials.chrome.blurIntensityDark
    : materials.chrome.blurIntensityLight;
  const fallbackFill =
    glassEffectStyle === "clear"
      ? t.glassClear
      : glassEffectStyle === "prominent"
        ? t.glassProminent
        : Platform.OS === "web"
          ? t.dark
            ? "rgba(28,28,30,0.86)"
            : "rgba(255,255,255,0.92)"
          : t.glassRegular;

  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[
        {
          borderRadius: radius,
          borderCurve: curve.continuous,
          overflow: "hidden",
          backgroundColor: fallbackFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: rim,
        },
        style,
      ]}
    >
      {specular && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: spacing.md,
            right: spacing.md,
            height: materials.specularHeight,
            backgroundColor: t.dark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.9)",
          }}
        />
      )}
      {children}
    </BlurView>
  );
}

/**
 * Groups several glass controls so iOS can render them as one material blob
 * instead of stacking two translucent layers on top of each other.
 */
export function GlassContainer({
  children,
  spacing: gap = 8,
  style,
}: {
  children: React.ReactNode;
  spacing?: number;
  style?: StyleProp<ViewStyle>;
}) {
  if (Platform.OS === "ios" && isLiquidGlassAvailable()) {
    return (
      <NativeGlassContainer spacing={gap} style={style}>
        {children}
      </NativeGlassContainer>
    );
  }
  return <View style={style}>{children}</View>;
}

/**
 * Opaque content container.
 *
 * Apple's grouped list background in dark mode is the elevated surface — no
 * border, no glow. A hairline stroke is only used when a surface must sit on a
 * same-colored background (light mode inset groups).
 */
export function Surface({
  children,
  elevated = false,
  inset = false,
  padded = true,
  radius = radii.card,
  style,
}: {
  children: React.ReactNode;
  elevated?: boolean;
  /** Inset grouped look: lighter fill, used inside a lighter parent. */
  inset?: boolean;
  padded?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const background = elevated
    ? t.surfaceElevated
    : inset
      ? t.surfaceOverlay
      : t.surface;

  return (
    <View
      style={[
        {
          backgroundColor: background,
          borderRadius: radius,
          borderCurve: curve.continuous,
          padding: padded ? spacing.sm : 0,
          overflow: "hidden",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Back-compat alias: `Card` was the old name for a content surface. */
export function Card({
  children,
  elevated = false,
  style,
}: {
  children: React.ReactNode;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Surface elevated={elevated} style={[{ padding: spacing.md, gap: spacing.xs }, style]}>
      {children}
    </Surface>
  );
}

/**
 * Apple inset grouped list.
 *
 * Rows are separated by hairlines that are inset to the text, matching
 * HIG · Lists and tables ("use separator lines to show which elements are
 * related"). Rows inside a group are never individual cards.
 */
export function GroupedList({
  children,
  separatorInset = spacing.sm,
  style,
}: {
  children: React.ReactNode;
  separatorInset?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <Surface padded={false} style={style}>
      {items.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < items.length - 1 && <Divider inset={separatorInset} />}
        </React.Fragment>
      ))}
    </Surface>
  );
}

/**
 * iOS Settings-style row.
 *
 * HIG · Lists and tables: keep item text succinct, use a disclosure indicator
 * only when the row leads somewhere, and give clear selection feedback.
 */
export function SettingsRow({
  title,
  subtitle,
  icon,
  iconColor,
  value,
  onPress,
  trailing,
  accessory = "chevron",
  destructive = false,
  minHeight = 48,
  style,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  value?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  accessory?: "chevron" | "none" | "checkmark" | "spinner";
  destructive?: boolean;
  minHeight?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const feedback = useFeedback();
  const press = usePressFeedback(0.995);
  const interactive = typeof onPress === "function";

  const body = (
    <View
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: spacing.xs,
        minHeight,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
      }}
    >
      {icon ? <IconTile name={icon} color={iconColor ?? (destructive ? t.red : t.accent)} /> : null}

      <View style={{ flex: 1, gap: 2 }}>
        <Label
          size={17}
          weight="400"
          red={destructive}
          numberOfLines={1}
          style={{ lineHeight: 22 }}
        >
          {title}
        </Label>
        {subtitle ? (
          <Label secondary size={12} numberOfLines={2}>
            {subtitle}
          </Label>
        ) : null}
      </View>

      {value ? (
        <Label size={16} numberOfLines={1} style={{ color: t.textSecondary }}>
          {value}
        </Label>
      ) : null}

      {trailing}

      {accessory === "chevron" && interactive ? (
        <AppIcon name="chevron" size={iconSizes.inline} color={t.textTertiary} weight="semibold" />
      ) : null}
      {accessory === "checkmark" ? (
        <AppIcon name="check" size={iconSizes.inline} color={t.accent} weight="semibold" />
      ) : null}
    </View>
  );

  if (!interactive) {
    return <View style={style}>{body}</View>;
  }

  return (
    <Animated.View style={press.style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPressIn={() => {
          feedback.press();
          press.handlers.onPressIn();
        }}
        onPressOut={press.handlers.onPressOut}
        onPress={() => {
          feedback.tap();
          onPress?.();
        }}
        style={({ pressed }) => [
          { backgroundColor: pressed ? t.pressedOverlay : "transparent" },
          style,
        ]}
      >
        {body}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Native switch row (Apple: toggles carry their own row, never a custom pill).
 */
export function SwitchRow({
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  const feedback = useFeedback();
  return (
    <SettingsRow
      title={title}
      subtitle={subtitle}
      accessory="none"
      minHeight={52}
      trailing={
        <Switch
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            if (!disabled) feedback.tap();
          }}
          disabled={disabled}
          trackColor={{ false: t.fillPrimary, true: t.green }}
          ios_backgroundColor={t.fillPrimary}
        />
      }
    />
  );
}

