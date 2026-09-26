/**
 * Quote hero — the brand card at the top of Home and of each currency.
 *
 * Direction from the Dribbble research (Kites Design "Currency Exchange App UI",
 * the 2021 exchange-app shots): one saturated brand surface per screen, deep
 * indigo → violet with a soft highlight, white type, a real trend line, and
 * glassy secondary actions. Everything else on the screen stays calm so this
 * card carries the colour. The gradient is drawn with react-native-svg because
 * CSS gradients need a custom build and would not render in Expo Go.
 */
import { useState } from "react";
import { Animated, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { formatNumber, names, type Currency, type CurrencyQuote } from "@arzman/shared";
import { CurrencyBadge } from "../design-system/currency-icons";
import { curve, spacing } from "../design-system";
import { useHistory } from "../history";
import { useApp } from "../store";
import { AppIcon, Label } from "./primitives";
import { Skeleton } from "./skeleton";
import { Sparkline } from "./sparkline";
import { useFeedback, usePressFeedback } from "./theme";
import { usePrice } from "./price";

const ON_BRAND = "#FFFFFF";
const ON_BRAND_MUTED = "rgba(255, 255, 255, 0.78)";
const GLASS = "rgba(255, 255, 255, 0.14)";
const GLASS_STRONG = "rgba(255, 255, 255, 0.24)";
const GLASS_RIM = "rgba(255, 255, 255, 0.18)";
const RADIUS = 28;

function BrandBackground() {
  return (
    <Svg style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="heroBase" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6247E0" />
          <Stop offset="0.55" stopColor="#4530B8" />
          <Stop offset="1" stopColor="#24175E" />
        </LinearGradient>
        <RadialGradient id="heroGlow" cx="0.85" cy="0" rx="0.9" ry="0.75" fx="0.85" fy="0">
          <Stop offset="0" stopColor="#C4B5FD" stopOpacity={0.55} />
          <Stop offset="1" stopColor="#C4B5FD" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroBase)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGlow)" />
    </Svg>
  );
}

function BrandChange({ value }: { value: number | null | undefined }) {
  const { user } = useApp();
  const known = value != null && Number.isFinite(value);
  const up = known && value > 0;
  const down = known && value < 0;
  return (
    <View
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: GLASS,
        borderWidth: 1,
        borderColor: GLASS_RIM,
      }}
    >
      {up || down ? (
        <AppIcon name={up ? "trendUp" : "trendDown"} size={12} color={ON_BRAND} weight="bold" />
      ) : null}
      <Label size={13} weight="600" style={{ color: ON_BRAND, writingDirection: "ltr" }}>
        {known ? `${up ? "+" : ""}${formatNumber(value, user.settings.persian, 2, 2)}٪` : "—"}
      </Label>
    </View>
  );
}

function BrandRange({ quote }: { quote: CurrencyQuote }) {
  const fmt = usePrice();
  const { lowToman: low, highToman: high, priceToman: current } = quote;
  if (low == null || high == null || high <= low || current < low || current > high) return null;
  const fraction = (current - low) / (high - low);
  return (
    <View style={{ gap: 8 }}>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.18)" }}>
        {/* Right-to-left: the low end sits on the right, as the labels read. */}
        <View
          style={{
            position: "absolute",
            right: 0,
            width: `${fraction * 100}%`,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.55)",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: -4,
            right: `${fraction * 100}%`,
            marginRight: -6,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: ON_BRAND,
            borderWidth: 3,
            borderColor: "#5B3FD6",
          }}
        />
      </View>
      <View style={{ flexDirection: "row-reverse", justifyContent: "space-between" }}>
        <Label size={12} style={{ color: ON_BRAND_MUTED }}>پایین‌ترین {fmt(low)}</Label>
        <Label size={12} style={{ color: ON_BRAND_MUTED }}>بالاترین {fmt(high)}</Label>
      </View>
    </View>
  );
}

export interface HeroAction {
  title: string;
  icon: string;
  onPress: () => void;
  primary?: boolean;
}

function ActionChip({ action }: { action: HeroAction }) {
  const feedback = useFeedback();
  const press = usePressFeedback(0.96);
  return (
    <Animated.View style={[press.style, { flex: 1 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.title}
        onPressIn={() => {
          feedback.press();
          press.handlers.onPressIn();
        }}
        onPressOut={press.handlers.onPressOut}
        onPress={action.onPress}
        style={({ pressed }) => ({
          height: 46,
          borderRadius: 16,
          borderCurve: curve.continuous,
          flexDirection: "row-reverse",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          backgroundColor: pressed ? GLASS_STRONG : action.primary ? GLASS_STRONG : GLASS,
          borderWidth: 1,
          borderColor: GLASS_RIM,
        })}
      >
        <AppIcon name={action.icon} size={16} color={ON_BRAND} />
        <Label size={14} weight="600" style={{ color: ON_BRAND }}>
          {action.title}
        </Label>
      </Pressable>
    </Animated.View>
  );
}

export function QuoteHero({
  code,
  quote,
  subtitle,
  actions,
  footer,
  trend = true,
  style,
}: {
  code: Currency;
  quote?: CurrencyQuote;
  subtitle?: string;
  actions?: HeroAction[];
  /** Small print under the card body (source unit, time). */
  footer?: string;
  /** Today's trend line. Off where a full chart follows (currency detail). */
  trend?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fmt = usePrice();
  const app = useApp();
  const { user } = app;
  const history = useHistory(code, "1D", trend);
  // Loading until a request has actually failed; then honest dashes instead.
  const waiting = !quote && (app.busy || !app.error);
  const [chartWidth, setChartWidth] = useState(0);

  return (
    <View
      style={[
        {
          borderRadius: RADIUS,
          borderCurve: curve.continuous,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.14)",
          boxShadow: "0 16px 36px rgba(69, 48, 184, 0.35)",
        },
        style,
      ]}
    >
      <BrandBackground />
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: spacing.xs }}>
          <CurrencyBadge code={code} size={46} dark />
          <View style={{ flex: 1 }}>
            <Label size={18} weight="700" numberOfLines={1} style={{ color: ON_BRAND }}>
              {names[code]}
            </Label>
            <Label size={12} numberOfLines={1} style={{ color: ON_BRAND_MUTED }}>
              {subtitle ?? `${code} · بازار آزاد ایران`}
            </Label>
          </View>
          <BrandChange value={quote?.changePercent} />
        </View>

        <View
          accessible
          accessibilityLabel={quote ? `${fmt(quote.priceToman, 2)} ${names[user.settings.unit]}` : "در انتظار نرخ"}
          style={{ flexDirection: "row-reverse", alignItems: "baseline", gap: 8 }}
        >
          {waiting ? (
            <Skeleton width={190} height={46} radius={12} color={GLASS_STRONG} style={{ marginVertical: 12 }} />
          ) : (
            <Label
              size={46}
              weight="700"
              numberOfLines={1}
              allowFontScaling={false}
              style={{ color: ON_BRAND, writingDirection: "ltr", letterSpacing: -1 }}
            >
              {fmt(quote?.priceToman)}
            </Label>
          )}
          <Label size={17} weight="500" style={{ color: ON_BRAND_MUTED }}>
            {names[user.settings.unit]}
          </Label>
        </View>

        {/* Today's real observations, not a decoration. */}
        {trend ? (
          <View onLayout={(e) => setChartWidth(Math.floor(e.nativeEvent.layout.width))} style={{ height: 52 }}>
            {chartWidth > 0 ? (
              <Sparkline
                values={history ? history.map((p) => p.priceToman) : null}
                width={chartWidth}
                height={52}
                color={ON_BRAND}
              />
            ) : null}
          </View>
        ) : null}

        {quote ? (
          <BrandRange quote={quote} />
        ) : waiting ? (
          <Skeleton width="100%" height={10} radius={5} color={GLASS} />
        ) : (
          <Label size={13} style={{ color: ON_BRAND_MUTED }}>
            نرخ در دسترس نیست؛ اتصال را بررسی کنید.
          </Label>
        )}

        {footer ? (
          <Label size={11} style={{ color: ON_BRAND_MUTED }}>
            {footer}
          </Label>
        ) : null}

        {actions?.length ? (
          <View style={{ flexDirection: "row-reverse", gap: spacing.xxs, marginTop: 2 }}>
            {actions.map((action) => (
              <ActionChip key={action.title} action={action} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
