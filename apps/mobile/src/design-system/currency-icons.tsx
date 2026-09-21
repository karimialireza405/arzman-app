/**
 * ArzMan Currency Badge System
 *
 * The user-visible problem this solves: before this file, every currency was
 * rendered as a bare text glyph inside an ad-hoc circle with hand-written
 * colors, so USD/EUR/AED/IQD never looked like one icon family.
 *
 * Design rules (documented in docs/apple-references/apple-ui-findings.md):
 * - One badge family: continuous-corner squircle, identical metrics per size.
 * - Subtle semantic tint per currency, derived from the currencies' glyphs —
 *   never flags, never emoji, never a "logo wall".
 * - Text is set at a consistent visual weight (SF Semibold/Bold at a fixed
 *   optical size) instead of "huge currency letters".
 * - The glyph direction is explicit per currency so Persian glyphs
 *   (د.إ · ع.د) lay out right-to-left while $ / € / ₮ stay left-to-right.
 */
import { Text, View, useColorScheme, type StyleProp, type ViewStyle } from "react-native";
import { colors, curve, radii } from "./tokens";

/** The currencies ArzMan can display, plus the two Iranian denominations. */
export type BadgeCurrency =
  | "USD"
  | "EUR"
  | "AED"
  | "IQD"
  | "USDT"
  | "IRT"
  | "IRR";

interface CurrencyGlyph {
  /** The symbol drawn inside the badge. */
  glyph: string;
  /** Font size multiplier relative to the badge's optical size. */
  scale: number;
  /** Base writing direction of the glyph itself. */
  direction: "ltr" | "rtl";
  /** Semantic tint — restrained, Apple system palette. */
  tint: { dark: string; light: string };
}

/**
 * Glyph + tint table. Tints are Apple system colors so a badge always reads as
 * "a system control", not as a brand logo.
 */
export const currencyGlyphs: Record<BadgeCurrency, CurrencyGlyph> = {
  USD: {
    glyph: "$",
    scale: 1,
    direction: "ltr",
    tint: { dark: "#0A84FF", light: "#007AFF" }, // iOS Blue
  },
  EUR: {
    glyph: "€",
    scale: 1,
    direction: "ltr",
    tint: { dark: "#5E5CE6", light: "#5856D6" }, // iOS Indigo
  },
  AED: {
    glyph: "د.إ",
    scale: 0.62,
    direction: "rtl",
    tint: { dark: "#30D158", light: "#248A3D" }, // iOS Green
  },
  IQD: {
    glyph: "ع.د",
    scale: 0.62,
    direction: "rtl",
    tint: { dark: "#FF9F0A", light: "#C93400" }, // iOS Orange
  },
  USDT: {
    glyph: "₮",
    scale: 1,
    direction: "ltr",
    tint: { dark: "#40C8E0", light: "#0E7C92" }, // Teal
  },
  IRT: {
    glyph: "ت",
    scale: 0.85,
    direction: "rtl",
    tint: { dark: "#BF5AF2", light: "#8944AB" }, // iOS Purple
  },
  IRR: {
    glyph: "ر",
    scale: 0.85,
    direction: "rtl",
    tint: { dark: "#BF5AF2", light: "#8944AB" },
  },
};

/** Badge edge sizes on the 4pt grid — one family, four steps. */
export const badgeSizes = {
  xs: 24,
  sm: 30,
  md: 38,
  lg: 46,
  xl: 56,
} as const;

export type BadgeSize = keyof typeof badgeSizes;

export function currencyTint(
  code: string,
  dark: boolean,
): string | undefined {
  const entry = currencyGlyphs[code as BadgeCurrency];
  return entry ? entry.tint[dark ? "dark" : "light"] : undefined;
}

/**
 * A single, consistent currency badge.
 *
 * - `tone="tint"`    translucent tint behind a tinted glyph (default, list rows)
 * - `tone="filled"`  solid tint with a white glyph (hero / detail screens)
 * - `tone="neutral"` neutral fill, secondary glyph (metadata contexts)
 */
export function CurrencyBadge({
  code,
  size = "md",
  tone = "tint",
  dark,
  style,
}: {
  code: string;
  size?: BadgeSize | number;
  tone?: "tint" | "filled" | "neutral";
  /** Pass the app's resolved appearance; defaults to the system scheme. */
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const scheme = useColorScheme();
  const isDark = dark ?? scheme !== "light";

  const edge = typeof size === "number" ? size : badgeSizes[size];
  const entry = currencyGlyphs[code as BadgeCurrency];
  const tint = entry ? entry.tint[isDark ? "dark" : "light"] : (isDark ? colors.dark.accent : colors.light.accent);
  const glyph = entry?.glyph ?? code.slice(0, 2).toUpperCase();
  const scale = entry?.scale ?? 0.6;
  const direction = entry?.direction ?? "ltr";

  const glyphSize = Math.max(11, Math.round(edge * 0.46 * scale + edge * 0.06));

  let background: string;
  let borderColor: string;
  let glyphColor: string;

  if (tone === "filled") {
    background = tint;
    borderColor = "transparent";
    glyphColor = "#FFFFFF";
  } else if (tone === "neutral") {
    background = isDark ? colors.dark.fillTertiary : colors.light.fillTertiary;
    borderColor = isDark ? colors.dark.glassRim : colors.light.glassRim;
    glyphColor = isDark ? colors.dark.textSecondary : colors.light.textSecondary;
  } else {
    background = tint + (isDark ? "2E" : "1F");
    borderColor = tint + (isDark ? "4D" : "33");
    glyphColor = tint;
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={code}
      style={[
        {
          width: edge,
          height: edge,
          borderRadius: radii.currencyBadge * (edge / badgeSizes.md),
          borderCurve: curve.continuous,
          backgroundColor: background,
          borderWidth: 0.5,
          borderColor,
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          color: glyphColor,
          fontSize: glyphSize,
          fontWeight: "700",
          textAlign: "center",
          writingDirection: direction,
          includeFontPadding: false,
        }}
      >
        {glyph}
      </Text>
    </View>
  );
}

/** Semantic alias — same component, either name reads naturally. */
export const CurrencyIcon = CurrencyBadge;
