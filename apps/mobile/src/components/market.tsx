/**
 * Market presentation components.
 *
 * Hierarchy rules applied here (HIG · Typography + Layout):
 *  - the price is the loudest element on any surface (tabular figures)
 *  - the daily change is a semantic pill, colored only when the number is real
 *  - high/low/previous-close are secondary metadata, never equal weight
 *
 * Honesty rule: ArzMan never draws a fabricated price series. Where the old UI
 * showed a decorative "sparkline", we now render the currency's *real* daily
 * low→high range with the current price marked on it.
 */
import React, { useEffect, useRef } from "react";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ActivityIndicator, Animated, Pressable, View } from "react-native";
import { router } from "expo-router";
import { formatNumber, names, type Currency, type CurrencyQuote } from "@arzman/shared";
import { curve, radii, spacing } from "../design-system";
import { CurrencyBadge } from "../design-system/currency-icons";
import { useApp } from "../store";
import { IconButton } from "./controls";
import { AppIcon, Divider, Label } from "./primitives";
import { Surface } from "./surfaces";
import { useFeedback, usePressFeedback, useTheme } from "./theme";
import type { StyleProp, ViewStyle } from "react-native";

export { usePrice } from "./price";
import { QuoteHero } from "./quote-hero";
import { Sparkline } from "./sparkline";
import { Skeleton } from "./skeleton";
import { useHistory } from "../history";
import { usePrice } from "./price";

/**
 * Price with its unit caption.
 * `size="hero"` maps to Apple's display size used for the benchmark quote.
 */
export function Price({
  value,
  large = false,
  size,
  digits,
  align = "flex-start",
  style,
}: {
  value: number | null | undefined;
  large?: boolean;
  size?: "hero" | "large" | "medium" | "small";
  digits?: number;
  align?: "flex-start" | "flex-end";
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const fmt = usePrice();
  const { user } = useApp();
  const unitLabel = names[user.settings.unit];

  const resolved = size ?? (large ? "hero" : "medium");
  const fontSize = { hero: 44, large: 28, medium: 22, small: 17 }[resolved];
  const lineHeight = { hero: 52, large: 34, medium: 28, small: 22 }[resolved];
  const unitSize = { hero: 17, large: 15, medium: 13, small: 12 }[resolved];

  // Number and unit share one baseline and read as a single phrase
  // ("۲۳۴٬۶۱۵ تومان"); a unit stacked on its own line reads as a caption.
  return (
    <View style={[{ alignItems: align }, style]}>
      <View style={{ flexDirection: "row-reverse", alignItems: "baseline", gap: 6 }}>
        <Label
          numberOfLines={1}
          allowFontScaling={false}
          style={{
            fontSize,
            lineHeight,
            fontWeight: resolved === "small" ? "600" : "700",
            letterSpacing: resolved === "hero" ? -0.8 : -0.2,
            fontVariant: ["tabular-nums"],
            writingDirection: "ltr",
            color: t.text,
          }}
        >
          {fmt(value, digits ?? 2)}
        </Label>
        <Label
          secondary
          allowFontScaling={false}
          style={{ fontSize: unitSize, fontWeight: "500" }}
        >
          {unitLabel}
        </Label>
      </View>
    </View>
  );
}

/**
 * Daily change pill ("+۰٫۴۳٪").
 *
 * Apple Stocks uses a filled green/red badge. We only tint when the change is a
 * real number from the source — a null change renders as neutral, never as 0%.
 */
export function ChangePill({
  value,
  size = "medium",
  style,
}: {
  value: number | null | undefined;
  size?: "small" | "medium" | "large";
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const { user } = useApp();

  const known = value !== null && value !== undefined && Number.isFinite(value);
  const positive = known && (value as number) > 0;
  const negative = known && (value as number) < 0;

  const background = positive ? t.greenFill : negative ? t.redFill : t.fillTertiary;
  const color = positive ? t.greenText : negative ? t.redText : t.textSecondary;

  const metrics = {
    small: { fontSize: 12, paddingH: spacing.xxs, paddingV: 2, icon: 10 },
    medium: { fontSize: 13, paddingH: spacing.xs, paddingV: 3, icon: 11 },
    large: { fontSize: 15, paddingH: spacing.xs, paddingV: 5, icon: 13 },
  }[size];

  return (
    <View
      style={[
        {
          flexDirection: "row-reverse",
          alignItems: "center",
          gap: 3,
          backgroundColor: background,
          paddingHorizontal: metrics.paddingH,
          paddingVertical: metrics.paddingV,
          borderRadius: radii.pill,
          borderCurve: curve.continuous,
        },
        style,
      ]}
    >
      {positive || negative ? (
        <AppIcon
          name={positive ? "trendUp" : "trendDown"}
          size={metrics.icon}
          color={color}
          weight="bold"
        />
      ) : null}
      <Label
        allowFontScaling={false}
        style={{
          color,
          fontSize: metrics.fontSize,
          fontWeight: "600",
          fontVariant: ["tabular-nums"],
          writingDirection: "ltr",
        }}
      >
        {known
          ? `${positive ? "+" : ""}${formatNumber(value as number, user.settings.persian, 2, 2)}٪`
          : "—"}
      </Label>
    </View>
  );
}

/** Legacy aliases. */
export const MarketChangeBadge = ChangePill;
export const ChangeBadge = ChangePill;

/**
 * Daily range meter — the honest replacement for the previous decorative
 * sparkline: it plots the *reported* low, the current price and the *reported*
 * high, so nothing on screen is invented.
 */
export function RangeMeter({
  current,
  low,
  high,
  label = true,
  style,
}: {
  current?: number | null;
  low?: number | null;
  high?: number | null;
  label?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const fmt = usePrice();

  if (
    current == null ||
    low == null ||
    high == null ||
    high <= low ||
    current < low ||
    current > high
  ) {
    return null;
  }

  const fraction = Math.max(0, Math.min(1, (current - low) / (high - low)));

  return (
    <View style={[{ gap: spacing.xxs, width: "100%" }, style]}>
      {label ? (
        <View
          style={{
            flexDirection: "row-reverse",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Label tertiary size={11}>
            پایین‌ترین {fmt(low)}
          </Label>
          <Label tertiary size={11}>
            بالاترین {fmt(high)}
          </Label>
        </View>
      ) : null}
      <View
        style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: t.fillTertiary,
          overflow: "hidden",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            right: 0,
            width: `${Math.round(fraction * 100)}%`,
            height: "100%",
            backgroundColor: t.textSecondary,
            opacity: 0.5,
          }}
        />
      </View>
      <View
        style={{
          position: "absolute",
          top: label ? 18 : 0,
          right: `${Math.round(fraction * 100)}%`,
          marginRight: -3,
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: t.accent,
        }}
      />
    </View>
  );
}

/** Legacy alias — same component, older name. */
export const SpreadBar = RangeMeter;

/**
 * Connection + source-freshness strip.
 *
 * Kept intentionally quiet: it is system metadata, not content, so it sits on
 * one line instead of the previous glass card.
 */
export function MarketStatus() {
  const app = useApp();
  const t = useTheme();

  // What the app can truthfully say is *when it received* the rates. TGJU
  // publishes no trade timestamp, so that caveat lives on the currency card
  // ("زمان منبع"), not in an amber warning on every screen.
  const fetchedAt = app.snapshot ? Date.parse(app.snapshot.fetchedAt) : null;
  const ageMs = fetchedAt === null ? null : app.clock - fetchedAt;
  const fresh = ageMs !== null && ageMs <= 3 * 60_000;
  const time =
    fetchedAt === null
      ? null
      : new Date(fetchedAt).toLocaleTimeString(app.user.settings.persian ? "fa-IR" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

  const statusColor = !app.online ? t.red : fresh ? t.green : t.amber;
  const statusLabel = app.busy
    ? "در حال به‌روزرسانی…"
    : !app.online
      ? time
        ? `آفلاین · آخرین نرخ ${time}`
        : "اتصال برقرار نیست"
      : fresh
        ? `به‌روز · ${time}`
        : time
          ? `آخرین به‌روزرسانی ${time}`
          : "در انتظار نرخ";

  return (
    <View style={{ gap: spacing.xxxs }}>
      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          gap: spacing.xxs,
          minHeight: 32,
        }}
      >
        <View
          accessible
          accessibilityLabel={`${statusLabel}، منبع TGJU`}
          style={{ flex: 1, flexDirection: "row-reverse", alignItems: "center", gap: spacing.xxs }}
        >
          <View
            style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: statusColor }}
          />
          <Label secondary size={13} numberOfLines={1} style={{ flex: 1 }}>
            {statusLabel} · TGJU
          </Label>
        </View>
        {app.busy ? (
          <ActivityIndicator size="small" color={t.textSecondary} />
        ) : (
          <IconButton
            icon="refresh"
            size={32}
            variant="plain"
            color={t.textSecondary}
            accessibilityLabel="تازه‌سازی نرخ‌ها"
            onPress={() => void app.refresh(true)}
          />
        )}
      </View>

      {/* With cached rates on screen the status line already says "offline";
          the error text only earns its place when there is nothing to show. */}
      {app.error && !app.snapshot ? (
        <Label red size={12}>
          {app.error}
        </Label>
      ) : null}
    </View>
  );
}

export { MarketStatus as MarketStatusBar };

/**
 * Home hero: the benchmark quote.
 *
 * Apple Stocks keeps the headline quote large and calm, with the day range as
 * the single supporting graphic. We do the same and never render an invented
 * "trend line" behind the number.
 */
export function MarketHero({ style }: { style?: StyleProp<ViewStyle> }) {
  const app = useApp();
  const usd = app.snapshot?.quotes.find((q) => q.currency === "USD");
  return (
    <QuoteHero
      code="USD"
      quote={usd}
      subtitle="شاخص اصلی بازار آزاد · USD"
      style={style}
      actions={[
        { title: "مبدل", icon: "swap-horizontal", primary: true, onPress: () => router.push("/converter") },
        { title: "هشدار", icon: "notifications-outline", onPress: () => router.push("/alerts") },
        { title: "نرخ من", icon: "pricetag-outline", onPress: () => router.push("/custom-rates") },
      ]}
    />
  );
}

export { MarketHero as HeroQuote };

/**
 * A single market row — badge, name, price, change, then secondary metadata.
 *
 * Rows belong *inside* a GroupedList (Apple inset grouped list): they never
 * draw their own card, which is what made the previous UI look like a web
 * dashboard full of equal-weight boxes.
 */
/**
 * A brief green/red wash behind a price when it actually changes, the cue
 * trading apps use for "this just moved". Nothing happens on first render or
 * when the value is unchanged. Reanimated honours the system Reduce Motion
 * setting for withTiming by default.
 */
function usePriceTick(value: number | null | undefined) {
  const t = useTheme();
  const previous = useRef(value);
  const flash = useSharedValue(0);
  const direction = useSharedValue(0);
  useEffect(() => {
    const before = previous.current;
    previous.current = value;
    if (before == null || value == null || before === value) return;
    direction.value = value > before ? 1 : -1;
    flash.value = withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 900 }));
  }, [value, flash, direction]);
  const up = t.green;
  const down = t.red;
  return useAnimatedStyle(() => ({
    backgroundColor: direction.value >= 0 ? up : down,
    opacity: flash.value * 0.22,
  }));
}

export function CurrencyRow({
  code,
  quote,
  featured = false,
  showFavorite = false,
  onPress,
  style,
}: {
  code: Currency;
  quote?: CurrencyQuote;
  featured?: boolean;
  showFavorite?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const app = useApp();
  const feedback = useFeedback();
  const press = usePressFeedback(0.985);
  const fmt = usePrice();
  const isFavorite = app.user.watchlist.includes(code);
  const history = useHistory(code, "1D");
  const tick = usePriceTick(quote?.priceToman);
  const waiting = !quote && (app.busy || !app.error);

  const toggleFavorite = () => {
    app.updateUser((u) => ({
      ...u,
      watchlist: isFavorite
        ? u.watchlist.filter((c) => c !== code)
        : [...u.watchlist, code],
    }));
  };

  // The favourite toggle is a *sibling* of the row's tap target, never a child:
  // a button nested in a button is invalid on the web and ambiguous to VoiceOver.
  return (
    <View style={[{ flexDirection: "row-reverse", alignItems: "center" }, style]}>
      <Animated.View style={[press.style, { flex: 1 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${names[code]}، ${fmt(quote?.priceToman, 2)} ${names[app.user.settings.unit]}`}
          onPressIn={() => {
            feedback.press();
            press.handlers.onPressIn();
          }}
          onPressOut={press.handlers.onPressOut}
          onPress={() => {
            feedback.tap();
            if (onPress) onPress();
            else router.push(`/currency/${code}`);
          }}
          style={({ pressed }) => ({
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: spacing.xs,
            minHeight: featured ? 72 : 64,
            paddingRight: spacing.sm,
            paddingLeft: showFavorite ? spacing.xxxs : spacing.sm,
            paddingVertical: spacing.xxs + 2,
            backgroundColor: pressed ? t.pressedOverlay : "transparent",
          })}
        >
          <CurrencyBadge code={code} size={featured ? "lg" : 40} dark={t.dark} />

          {/* Leading column: what it is. */}
          <View style={{ flex: 1, gap: 2 }}>
            <Label size={17} weight="600" numberOfLines={1} style={{ lineHeight: 22 }}>
              {names[code]}
            </Label>
            <Label secondary size={13} numberOfLines={1} allowFontScaling={false}>
              {code}
            </Label>
          </View>

          {/* Rows that also carry a favourite star get a narrower trend so the
              currency name ("درهم امارات") is never truncated. */}
          <Sparkline
            values={history ? history.map((p) => p.priceToman) : null}
            width={showFavorite ? 40 : 58}
          />

          {/* Trailing column: what it costs. One number, one delta. */}
          <View style={{ alignItems: "flex-start", gap: 4, minWidth: showFavorite ? 74 : 84 }}>
            {waiting ? (
              <>
                <Skeleton width={78} height={18} />
                <Skeleton width={52} height={18} radius={9} />
              </>
            ) : (
              <>
                <View>
                  <Reanimated.View
                    pointerEvents="none"
                    style={[
                      { position: "absolute", top: 0, bottom: 0, left: -6, right: -6, borderRadius: 8 },
                      tick,
                    ]}
                  />
                  <Label
                  numberOfLines={1}
                  allowFontScaling={false}
                  style={{
                    fontSize: 17,
                    lineHeight: 22,
                    fontWeight: "600",
                    fontVariant: ["tabular-nums"],
                    writingDirection: "ltr",
                    color: t.text,
                  }}
                >
                  {fmt(quote?.priceToman)}
                  </Label>
                </View>
                <ChangePill value={quote?.changePercent} size="small" />
              </>
            )}
          </View>
        </Pressable>
      </Animated.View>

      {showFavorite ? (
        <View style={{ paddingLeft: spacing.xs }}>
          <IconButton
            icon={isFavorite ? "star" : "star-outline"}
            size={30}
            variant="plain"
            active={isFavorite}
            activeColor={t.amber}
            color={t.textTertiary}
            accessibilityLabel={
              isFavorite ? `حذف ${names[code]} از دنبال‌شده‌ها` : `افزودن ${names[code]} به دنبال‌شده‌ها`
            }
            onPress={toggleFavorite}
          />
        </View>
      ) : null}
    </View>
  );
}

/** Legacy alias — the detail hero now lives on the currency screen. */
export function CurrencyCard(props: {
  code: Currency;
  quote?: CurrencyQuote;
  showFavorite?: boolean;
}) {
  return <CurrencyRow {...props} featured />;
}

/**
 * Inset grouped list of currencies.
 *
 * The separator is inset so it lines up with the row text (avatar 40 + gap 12
 * + list padding 16), exactly like a native iOS list.
 */
export function CurrencyList({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <Surface padded={false} style={style}>
      {items.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < items.length - 1 ? <Divider inset={68} /> : null}
        </React.Fragment>
      ))}
    </Surface>
  );
}
