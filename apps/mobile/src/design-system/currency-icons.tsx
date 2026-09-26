/**
 * ArzMan Currency Badge System
 *
 * The user-visible problem this solves: before this file, every currency was
 * rendered as a bare text glyph inside an ad-hoc circle with hand-written
 * colors, so USD/EUR/AED/IQD never looked like one icon family.
 *
 * Design rules:
 * - Currencies are identified by a round country flag, the convention of
 *   Wise, Revolut and every bank app a user already reads fluently. (The
 *   earlier rule "never flags" was overruled by the owner after on-device use:
 *   glyph squircles read as placeholders, not as currencies.)
 * - Flags are vector (react-native-svg, included in Expo Go), drawn from a set
 *   made for square crops, and never mirrored by the RTL layout.
 * - A hairline inner ring keeps white-heavy flags (US, IQ, IR) from dissolving
 *   into a light background.
 * - USDT has no country, so it keeps a glyph disc in Tether green.
 * - `tone` is still accepted so existing call sites compile; flags ignore it
 *   except `neutral`, which dims them for metadata contexts.
 */
import { useMemo } from "react";
import { Text, View, useColorScheme, type StyleProp, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import { flagSvg, type FlagCode } from "./flags";
import { colors } from "./tokens";

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

/** Which flag stands for which currency. Both Iranian units share Iran's. */
export const currencyFlags: Partial<Record<BadgeCurrency, FlagCode>> = {
  USD: "US",
  EUR: "EU",
  AED: "AE",
  IQD: "IQ",
  IRT: "IR",
  IRR: "IR",
};

/** Tether's own green, so USDT is recognisable without a flag. */
const TETHER_GREEN = "#26A17B";

export function currencyTint(
  code: string,
  dark: boolean,
): string | undefined {
  const entry = currencyGlyphs[code as BadgeCurrency];
  return entry ? entry.tint[dark ? "dark" : "light"] : undefined;
}

/**
 * A single, consistent currency avatar: a round country flag.
 *
 * Every currency renders at the same edge size and with the same ring, so a
 * column of them lines up like a native list.
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
  const flag = currencyFlags[code as BadgeCurrency];
  const ring = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)";
  const xml = useMemo(() => (flag ? flagSvg[flag] : null), [flag]);

  const frame: StyleProp<ViewStyle> = [
    {
      width: edge,
      height: edge,
      borderRadius: edge / 2,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
      opacity: tone === "neutral" ? 0.55 : 1,
    },
    style,
  ];

  if (xml) {
    return (
      <View accessibilityRole="image" accessibilityLabel={code} style={frame}>
        <SvgXml
          xml={xml}
          width={edge}
          height={edge}
          preserveAspectRatio="xMidYMid slice"
        />
        {/* The ring sits above the artwork so every flag gets the same edge. */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: edge / 2,
            borderWidth: 1,
            borderColor: ring,
          }}
        />
      </View>
    );
  }

  // No country behind this currency (USDT) or an unknown code: a glyph disc.
  const entry = currencyGlyphs[code as BadgeCurrency];
  const background =
    code === "USDT"
      ? TETHER_GREEN
      : entry
        ? entry.tint[isDark ? "dark" : "light"]
        : isDark
          ? colors.dark.accent
          : colors.light.accent;
  const glyph = entry?.glyph ?? code.slice(0, 2).toUpperCase();
  const scale = entry?.scale ?? 0.6;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={code}
      style={[frame, { backgroundColor: background }]}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          color: "#FFFFFF",
          fontSize: Math.max(11, Math.round(edge * 0.5 * scale + edge * 0.06)),
          fontWeight: "700",
          textAlign: "center",
          writingDirection: entry?.direction ?? "ltr",
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
