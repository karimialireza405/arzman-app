/**
 * Persian typography: Vazirmatn.
 *
 * Vazirmatn (OFL, by Saber Rastikerdar) is the standard open Persian UI face:
 * even colour at small sizes, Persian digits drawn for UI, and a Latin set
 * that sits comfortably beside it (USD, TGJU).
 *
 * Two rules here fix bugs the system font setup produced on device:
 *
 * 1. Line height. Measured from the font files (hhea: ascender 2100, descender
 *    -1100, unitsPerEm 2048), every Vazirmatn weight needs 1.5625 × its size of
 *    vertical room. The old scale gave text 1.2–1.35×, so Persian glyphs spilled
 *    out of their boxes and collided with neighbours — "ارز من" overflowing its
 *    frame. `persianText` never lets a line be shorter than that.
 *
 * 2. Letter spacing. Tracking a cursive script inserts gaps between letters
 *    that must join, so it is dropped for any text containing Persian letters.
 *    Numbers keep their tracking.
 *
 * Custom fonts do not synthesise weights, so each weight is its own family;
 * `fontWeight` is resolved to a family and then removed.
 */
import type { TextStyle } from "react-native";

export const fontFamilies = {
  light: "Vazirmatn_300Light",
  regular: "Vazirmatn_400Regular",
  medium: "Vazirmatn_500Medium",
  semibold: "Vazirmatn_600SemiBold",
  bold: "Vazirmatn_700Bold",
  heavy: "Vazirmatn_800ExtraBold",
} as const;

/** (ascender − descender) / unitsPerEm, measured from the shipped .ttf files. */
export const PERSIAN_LINE_HEIGHT = 1.5625;

export function fontFamilyFor(weight: TextStyle["fontWeight"]): string {
  const w =
    weight === "bold" ? 700 : weight === "normal" || weight == null ? 400 : Number(weight);
  if (!Number.isFinite(w)) return fontFamilies.regular;
  if (w <= 350) return fontFamilies.light;
  if (w < 450) return fontFamilies.regular;
  if (w < 550) return fontFamilies.medium;
  if (w < 650) return fontFamilies.semibold;
  if (w < 750) return fontFamilies.bold;
  return fontFamilies.heavy;
}

/** Arabic-script letters, excluding Persian digits and number separators. */
const PERSIAN_LETTER = /[؀-ٟٮ-ۯۺ-ۿﭐ-﷿ﹰ-﻿]/;

export function hasPersianLetters(content: unknown): boolean {
  if (typeof content === "string") return PERSIAN_LETTER.test(content);
  if (typeof content === "number") return false;
  if (Array.isArray(content)) return content.some(hasPersianLetters);
  // Nested elements: assume prose, the safe side for letter spacing.
  return content != null && typeof content === "object";
}

/** Resolve a flattened text style for Vazirmatn. Pure; unit-tested. */
export function persianText(style: TextStyle, content?: unknown): TextStyle {
  const fontSize = style.fontSize ?? 15;
  const minimum = Math.ceil(fontSize * PERSIAN_LINE_HEIGHT);
  const next: TextStyle = {
    ...style,
    fontFamily: fontFamilyFor(style.fontWeight),
    fontWeight: undefined,
    lineHeight: Math.max(style.lineHeight ?? 0, minimum),
  };
  if (next.letterSpacing && hasPersianLetters(content)) next.letterSpacing = undefined;
  return next;
}
