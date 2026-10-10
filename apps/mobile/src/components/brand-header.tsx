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
import { SvgXml } from "react-native-svg";
import { BRAND_MARK_SVG } from "../design-system/brand-mark";
import { IconButton } from "./controls";
import { Label } from "./primitives";
import { useTheme } from "./theme";
import { capCenterFromTop } from "../design-system";

const SIDE = 40;
const WORDMARK_SIZE = 30;
const MARK_SIZE = 34;

function BrandMark({ size = 34 }: { size?: number }) {
  return <SvgXml xml={BRAND_MARK_SVG} width={size} height={size} />;
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
          <IconButton
            icon="search"
            size={SIDE}
            accessibilityLabel="جستجو در بازار"
            onPress={onSearch}
          />
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
        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 9 }}
        >
          <View
            style={{
              marginTop: capCenterFromTop(WORDMARK_SIZE) - MARK_SIZE / 2,
            }}
          >
            <BrandMark size={MARK_SIZE} />
          </View>
          <View style={{ flexDirection: "row" }}>
            <Label
              size={WORDMARK_SIZE}
              weight="800"
              align="center"
              style={{ writingDirection: "ltr", letterSpacing: -0.6 }}
            >
              Arz
            </Label>
            <Label
              size={WORDMARK_SIZE}
              weight="800"
              align="center"
              style={{
                writingDirection: "ltr",
                letterSpacing: -0.6,
                color: t.accent,
              }}
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
