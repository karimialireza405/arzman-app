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
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { IconButton } from "./controls";
import { Label } from "./primitives";
import { useTheme } from "./theme";

const SIDE = 40;

/** The mark: a violet squircle holding a rising line, echoing the hero card. */
function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Defs>
        <LinearGradient id="brandMark" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#8B6CFF" />
          <Stop offset="1" stopColor="#4530B8" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="30" height="30" rx="9" fill="url(#brandMark)" />
      <Path
        d="M7 19.5 L12 14.5 L16 17.5 L23 10"
        stroke="#FFFFFF"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M19 10 H23 V14" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <BrandMark />
          <View style={{ flexDirection: "row" }}>
            <Label size={30} weight="800" align="center" style={{ writingDirection: "ltr", letterSpacing: -0.6 }}>
              Arz
            </Label>
            <Label
              size={30}
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
