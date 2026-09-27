/**
 * Brand header — the centred "ArzMan" wordmark on Home.
 *
 * Built like a logo lockup rather than a page title: a small brand mark, a
 * two-tone Latin wordmark ("Arz" in the text colour, "Man" in the brand
 * violet) and the Persian tagline under it, all on the screen's centre line.
 * A mirrored spacer balances the search button so the lockup is optically
 * centred, not merely centred in the space the button leaves over.
 */
import { View } from "react-native";
import Svg, { Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { IconButton } from "./controls";
import { Label } from "./primitives";
import { useTheme } from "./theme";
import { capCenterFromTop } from "../design-system";

const SIDE = 40;
const WORDMARK_SIZE = 30;
const MARK_SIZE = 34;

/**
 * The mark: a jewel-like indigo tile with a glass sheen and a fine gold rim,
 * holding a gold "A" monogram whose crossbar rises like a market line, and a
 * small gold sparkle. Chosen over a coin-ring variant (too busy at 34 pt) and
 * an arrow-A (read as "N" at small sizes) after rendering all three side by
 * side at real size on dark and light backgrounds.
 */
function BrandMark({ size = 34 }: { size?: number }) {
  const monogram = "M17 48 L32 15 L47 48";
  const crossbar = "M23.5 38.5 L40.5 32.5";
  const sparkle = "M50 12 Q50.6 15.4 54 16 Q50.6 16.6 50 20 Q49.4 16.6 46 16 Q49.4 15.4 50 12 Z";
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="arzMarkTile" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3A2598" />
          <Stop offset="0.55" stopColor="#23166A" />
          <Stop offset="1" stopColor="#120C38" />
        </LinearGradient>
        <RadialGradient id="arzMarkSheen" cx="0.28" cy="0.1" r="0.75" fx="0.28" fy="0.1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.3} />
          <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="arzMarkGold" x1="0" y1="0" x2="0.9" y2="1">
          <Stop offset="0" stopColor="#FFF1C2" />
          <Stop offset="0.45" stopColor="#F2C45A" />
          <Stop offset="1" stopColor="#B7822A" />
        </LinearGradient>
        <LinearGradient id="arzMarkRim" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFE7A3" stopOpacity={0.9} />
          <Stop offset="0.5" stopColor="#E9B949" stopOpacity={0.25} />
          <Stop offset="1" stopColor="#FFE7A3" stopOpacity={0.7} />
        </LinearGradient>
      </Defs>

      <Rect x="0" y="0" width="64" height="64" rx="17" fill="url(#arzMarkTile)" />
      <Rect x="0" y="0" width="64" height="64" rx="17" fill="url(#arzMarkSheen)" />
      <Rect
        x="1.25"
        y="1.25"
        width="61.5"
        height="61.5"
        rx="15.8"
        fill="none"
        stroke="url(#arzMarkRim)"
        strokeWidth={1.5}
      />

      {/* Soft shadow under the metal, so the gold reads as raised, not painted. */}
      <G transform="translate(0 1.4)" opacity={0.45}>
        <Path d={monogram} fill="none" stroke="#0A0620" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <Path d={crossbar} fill="none" stroke="#0A0620" strokeWidth={4.5} strokeLinecap="round" />
      </G>

      <Path d={monogram} fill="none" stroke="url(#arzMarkGold)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={crossbar} fill="none" stroke="url(#arzMarkGold)" strokeWidth={4.5} strokeLinecap="round" />
      <Path d={sparkle} fill="url(#arzMarkGold)" />
    </Svg>
  );
}

export function BrandHeader({
  tagline,
  onSearch,
}: {
  tagline?: string;
  onSearch?: () => void;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 4 }}>
      {/* Balances the search button so the lockup sits on the true centre. */}
      <View style={{ width: SIDE }}>
        {onSearch ? (
          <IconButton icon="search" size={SIDE} accessibilityLabel="جستجو در بازار" onPress={onSearch} />
        ) : null}
      </View>

      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel="ارز من"
        style={{ flex: 1, alignItems: "center", gap: 2 }}
      >
        {/* The mark is centred on the capitals of "ArzMan", not on the text's
            line box: Persian line boxes are tall, so the box centre sits
            4.7 pt below the letters and a centred icon looked low. */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 9 }}>
          <View style={{ marginTop: capCenterFromTop(WORDMARK_SIZE) - MARK_SIZE / 2 }}>
            <BrandMark size={MARK_SIZE} />
          </View>
          <View style={{ flexDirection: "row" }}>
            <Label size={WORDMARK_SIZE} weight="800" align="center" style={{ writingDirection: "ltr", letterSpacing: -0.6 }}>
              Arz
            </Label>
            <Label
              size={WORDMARK_SIZE}
              weight="800"
              align="center"
              style={{ writingDirection: "ltr", letterSpacing: -0.6, color: t.accent }}
            >
              Man
            </Label>
          </View>
        </View>
        {tagline ? (
          <Label secondary size={13} align="center">
            {tagline}
          </Label>
        ) : null}
      </View>

      <View style={{ width: SIDE }} />
    </View>
  );
}
