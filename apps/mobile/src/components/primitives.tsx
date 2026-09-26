/**
 * Text + icon primitives.
 *
 * Apple HIG · Typography: default 17pt, minimum 11pt, avoid light weights, and
 * use weight/size/color (not decoration) to express hierarchy.
 * Apple HIG · SF Symbols: prefer the platform symbol set so icons inherit the
 * right optical weight at every size.
 */
import React from "react";
import { Platform, Text, View, StyleSheet } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import { curve, iconSizes, persianText, radii, spacing } from "../design-system";
import { textStyle, useTheme } from "./theme";
import type {
  ColorValue,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import type { TextStyleName } from "../design-system";

/** Icon resolver: Apple SF Symbols on iOS, Ionicons everywhere else. */
export const iconMapping: Record<
  string,
  { sf: SFSymbol; ion: keyof typeof Ionicons.glyphMap }
> = {
  home: { sf: "house.fill", ion: "home" },
  "home-outline": { sf: "house", ion: "home-outline" },
  market: { sf: "chart.line.uptrend.xyaxis", ion: "stats-chart" },
  "stats-chart": { sf: "chart.line.uptrend.xyaxis", ion: "stats-chart" },
  "stats-chart-outline": { sf: "chart.xyaxis.line", ion: "stats-chart-outline" },
  swap: { sf: "arrow.left.arrow.right", ion: "swap-horizontal" },
  "swap-horizontal": { sf: "arrow.left.arrow.right", ion: "swap-horizontal" },
  "swap-vertical": { sf: "arrow.up.arrow.down", ion: "swap-vertical" },
  wallet: { sf: "wallet.pass.fill", ion: "wallet" },
  "wallet-outline": { sf: "wallet.pass", ion: "wallet-outline" },
  more: { sf: "ellipsis.circle.fill", ion: "ellipsis-horizontal-circle" },
  "ellipsis-horizontal-circle-outline": {
    sf: "ellipsis.circle",
    ion: "ellipsis-horizontal-circle-outline",
  },
  star: { sf: "star.fill", ion: "star" },
  "star-outline": { sf: "star", ion: "star-outline" },
  notifications: { sf: "bell.fill", ion: "notifications" },
  "notifications-outline": { sf: "bell", ion: "notifications-outline" },
  pricetag: { sf: "tag.fill", ion: "pricetag" },
  "pricetag-outline": { sf: "tag", ion: "pricetag-outline" },
  "lock-closed": { sf: "lock.fill", ion: "lock-closed" },
  "lock-closed-outline": { sf: "lock", ion: "lock-closed-outline" },
  add: { sf: "plus", ion: "add" },
  "copy-outline": { sf: "doc.on.doc", ion: "copy-outline" },
  refresh: { sf: "arrow.clockwise", ion: "refresh" },
  search: { sf: "magnifyingglass", ion: "search" },
  close: { sf: "xmark.circle.fill", ion: "close-circle" },
  "close-outline": { sf: "xmark", ion: "close" },
  check: { sf: "checkmark", ion: "checkmark" },
  chevron: { sf: "chevron.left", ion: "chevron-back" },
  "chevron-down": { sf: "chevron.down", ion: "chevron-down" },
  info: { sf: "info.circle", ion: "information-circle-outline" },
  sparkles: { sf: "sparkles", ion: "sparkles-outline" },
  trash: { sf: "trash", ion: "trash-outline" },
  shield: { sf: "lock.shield.fill", ion: "shield-checkmark" },
  trendUp: { sf: "arrow.up.right", ion: "trending-up" },
  trendDown: { sf: "arrow.down.right", ion: "trending-down" },
  chart: { sf: "chart.xyaxis.line", ion: "analytics-outline" },
  gauge: { sf: "gauge.with.dots.needle.50percent", ion: "speedometer-outline" },
};

export const gutters = { screen: spacing.sm, row: spacing.sm };

export function AppIcon({
  name,
  size = iconSizes.list,
  color,
  weight = "regular",
  style,
}: {
  name: string;
  size?: number;
  color?: ColorValue;
  weight?: "regular" | "medium" | "semibold" | "bold";
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const iconColor = color || t.text;
  const mapped = iconMapping[name];

  if (Platform.OS === "ios" && mapped?.sf) {
    return (
      <SymbolView
        name={mapped.sf}
        size={size}
        tintColor={iconColor}
        weight={weight}
        resizeMode="scaleAspectFit"
        style={[{ width: size, height: size }, style]}
      />
    );
  }

  const ionName =
    mapped?.ion ??
    (name in Ionicons.glyphMap
      ? (name as keyof typeof Ionicons.glyphMap)
      : "ellipse-outline");

  return (
    <View style={style}>
      <Ionicons name={ionName} size={size} color={iconColor} />
    </View>
  );
}

/**
 * Text primitive.
 *
 * Financial values must dominate their labels, so numbers use tabular figures
 * while labels stay in the secondary/tertiary vibrancy colors.
 */
export function Label({
  children,
  variant,
  muted = false,
  secondary = false,
  tertiary = false,
  size = 15,
  weight = "400",
  tabular = false,
  accent = false,
  green = false,
  red = false,
  amber = false,
  align,
  numberOfLines,
  allowFontScaling = true,
  style,
}: {
  children: React.ReactNode;
  variant?: TextStyleName;
  muted?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  size?: number;
  weight?: TextStyle["fontWeight"];
  tabular?: boolean;
  accent?: boolean;
  green?: boolean;
  red?: boolean;
  amber?: boolean;
  align?: "left" | "right" | "center";
  numberOfLines?: number;
  allowFontScaling?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const t = useTheme();

  let textColor: string = t.text;
  if (accent) textColor = t.accent;
  else if (green) textColor = t.green;
  else if (red) textColor = t.red;
  else if (amber) textColor = t.amber;
  else if (tertiary) textColor = t.textTertiary;
  else if (secondary || muted) textColor = t.textSecondary;

  const base: TextStyle = variant
    ? textStyle(variant)
    : {
        fontSize: size,
        lineHeight: Math.round(size * 1.35),
        fontWeight: weight,
      };

  // Every string in the app funnels through here, so Vazirmatn, the measured
  // Persian line height and the no-tracking rule are applied in one place.
  const resolved = persianText(
    StyleSheet.flatten([
      {
        color: textColor,
        textAlign: align ?? "right",
        writingDirection: "rtl",
        fontVariant: tabular ? ["tabular-nums"] : base.fontVariant,
      },
      base,
      style,
    ]) as TextStyle,
    children,
  );

  return (
    <Text
      numberOfLines={numberOfLines}
      allowFontScaling={allowFontScaling}
      style={resolved}
    >
      {children}
    </Text>
  );
}

/** Hairline separator. Apple insets list separators to align with row text. */
export function Divider({
  inset = 0,
  style,
}: {
  inset?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          height: StyleSheet.hairlineWidth,
          backgroundColor: t.separator,
          marginStart: inset,
        },
        style,
      ]}
    />
  );
}

/**
 * Small tinted square holding a symbol — the 28pt optical size Apple uses for
 * Settings rows, so lists read as native system lists rather than custom cards.
 */
export function IconTile({
  name,
  color,
  size = 28,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const t = useTheme();
  const tint = color ?? t.accent;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radii.controlSmall * (size / 28),
        borderCurve: curve.continuous,
        backgroundColor: tint + (t.dark ? "2E" : "1F"),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <AppIcon
        name={name}
        size={Math.round(size * 0.56)}
        color={tint}
        weight="medium"
      />
    </View>
  );
}
