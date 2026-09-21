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
import React from "react";
import { ActivityIndicator, Animated, Pressable, View } from "react-native";
import { router } from "expo-router";
import { formatNumber, names, type Currency, type CurrencyQuote } from "@arzman/shared";
import { curve, radii, spacing } from "../design-system";
import { CurrencyBadge } from "../design-system/currency-icons";
import { useApp } from "../store";
import { Button, IconButton } from "./controls";
import { AppIcon, Divider, Label } from "./primitives";
import { Surface } from "./surfaces";
import { useFeedback, usePressFeedback, useTheme } from "./theme";
import type { StyleProp, ViewStyle } from "react-native";

/** Formats Toman values using the user's unit + digit preferences. */
export function usePrice() {
  const { user } = useApp();
  return (value: number | null | undefined, digits = 0) =>
    value == null
      ? "—"
      : formatNumber(
          value * (user.settings.unit === "IRR" ? 10 : 1),
          user.settings.persian,
          digits,
        );
}

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
  const lineHeight = { hero: 50, large: 34, medium: 28, small: 22 }[resolved];

  return (
    <View style={[{ gap: 2, alignItems: align }, style]}>
      <Label
        numberOfLines={1}
        allowFontScaling={false}
        style={{
          fontSize,
          lineHeight,
          fontWeight: resolved === "small" ? "600" : "700",
          letterSpacing: resolved === "hero" ? -0.6 : -0.2,
          fontVariant: ["tabular-nums"],
          writingDirection: "ltr",
          textAlign: align === "flex-end" ? "right" : "left",
          color: t.text,
        }}
      >
        {fmt(value, digits ?? 0)}
      </Label>
      <Label secondary size={11} style={{ textAlign: align === "flex-end" ? "right" : "left" }}>
        {unitLabel}
      </Label>
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
          ? `${positive ? "+" : ""}${formatNumber(value as number, user.settings.persian, 2)}٪`
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
            پایین‌ترین {fmt(low, 0)}
          </Label>
          <Label tertiary size={11}>
            بالاترین {fmt(high, 0)}
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
  const { user } = app;

  const statusColor = !app.online ? t.red : app.stale ? t.amber : t.green;
  const statusLabel = app.busy
    ? "در حال به‌روزرسانی نرخ‌ها…"
    : !app.online
      ? "آفلاین · نمایش نرخ‌های ذخیره‌شده"
      : app.stale
        ? "متصل · تازگی منبع تأیید نشده"
        : "متصل · نرخ زنده";

  return (
    <View style={{ gap: spacing.xxs }}>
      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.xs,
          minHeight: 28,
        }}
      >
        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: spacing.xxs,
            flex: 1,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: statusColor,
            }}
          />
          <Label size={13} weight="500" numberOfLines={1}>
            {statusLabel}
          </Label>
        </View>

        <View
          style={{ flexDirection: "row-reverse", alignItems: "center", gap: spacing.xs }}
        >
          {app.snapshot ? (
            <Label tertiary size={11} allowFontScaling={false}>
              {new Date(app.snapshot.fetchedAt).toLocaleTimeString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </Label>
          ) : null}
          {app.busy ? (
            <ActivityIndicator size="small" color={t.accent} />
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
      </View>

      {app.error ? (
        <Label red size={12}>
          {app.error}
        </Label>
      ) : null}

      <Label tertiary size={10} allowFontScaling={false}>
        منبع: TGJU · واحد پیش‌فرض: {names[user.settings.unit]}
      </Label>
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
  const t = useTheme();
  const usd = app.snapshot?.quotes.find((q) => q.currency === "USD");

  return (
    <Surface
      elevated
      radius={radii.cardLarge}
      style={[
        { padding: spacing.md, gap: spacing.sm, backgroundColor: t.surfaceElevated },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: spacing.xs }}>
          <CurrencyBadge code="USD" size="lg" tone="filled" dark={t.dark} />
          <View style={{ gap: 2 }}>
            <Label size={17} weight="600">
              {names.USD}
            </Label>
            <Label tertiary size={11} allowFontScaling={false}>
              شاخص اصلی بازار آزاد · USD
            </Label>
          </View>
        </View>

        <ChangePill value={usd?.changePercent} size="medium" />
      </View>

      <Price value={usd?.priceToman} size="hero" digits={0} align="flex-start" />

      {usd ? (
        <RangeMeter
          current={usd.priceToman}
          low={usd.lowToman}
          high={usd.highToman}
        />
      ) : (
        <Label secondary size={12}>
          در انتظار دریافت نخستین نرخ از سرویس بازار…
        </Label>
      )}

      <Divider />

      {/* Horizontal row of chrome actions → capsule shape (HIG · Buttons). */}
      <View style={{ flexDirection: "row-reverse", gap: spacing.xxs }}>
        <Button
          title="مبدل"
          icon="swap-horizontal"
          variant="tinted"
          size="small"
          shape="capsule"
          style={{ flex: 1 }}
          onPress={() => router.push("/converter")}
        />
        <Button
          title="هشدار"
          icon="notifications-outline"
          variant="glass"
          size="small"
          shape="capsule"
          style={{ flex: 1 }}
          onPress={() => router.push("/alerts")}
        />
        <Button
          title="نرخ من"
          icon="pricetag-outline"
          variant="glass"
          size="small"
          shape="capsule"
          style={{ flex: 1 }}
          onPress={() => router.push("/custom-rates")}
        />
      </View>
    </Surface>
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

  const toggleFavorite = () => {
    app.updateUser((u) => ({
      ...u,
      watchlist: isFavorite
        ? u.watchlist.filter((c) => c !== code)
        : [...u.watchlist, code],
    }));
  };

  const badgeSize = featured ? "lg" : "md";

  return (
    <Animated.View style={press.style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`جزئیات ${names[code]}`}
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
        style={({ pressed }) => [
          {
            backgroundColor: pressed ? t.pressedOverlay : "transparent",
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            gap: spacing.xxs,
          },
          style,
        ]}
      >
        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: spacing.xs,
          }}
        >
          <CurrencyBadge code={code} size={badgeSize} dark={t.dark} />

          <View style={{ flex: 1, gap: 1 }}>
            <View
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: spacing.xxs,
              }}
            >
              <Label size={17} weight="500" numberOfLines={1} style={{ lineHeight: 22 }}>
                {names[code]}
              </Label>
              {isFavorite ? (
                <AppIcon name="star" size={12} color={t.amber} />
              ) : null}
            </View>
            <Label tertiary size={12} numberOfLines={1} allowFontScaling={false}>
              {code} · بازار آزاد ایران
            </Label>
          </View>

          <View style={{ alignItems: "flex-start", gap: 4 }}>
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
              {fmt(quote?.priceToman, 0)}
            </Label>
            <ChangePill value={quote?.changePercent} size="small" />
          </View>

          {showFavorite ? (
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
          ) : null}
        </View>

        {quote && (quote.lowToman || quote.highToman) ? (
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
              paddingStart: featured ? 58 : 50,
            }}
          >
            <Label tertiary size={11} allowFontScaling={false}>
              بازه امروز {fmt(quote.lowToman, 0)} تا {fmt(quote.highToman, 0)}
            </Label>
            <Label tertiary size={11} allowFontScaling={false}>
              {quote.sourceTimeLabel}
            </Label>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
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
 * The separator is inset so it lines up with the row text (badge 38 + gap 12 +
 * list padding 16), exactly like a native iOS list.
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
          {index < items.length - 1 ? <Divider inset={66} /> : null}
        </React.Fragment>
      ))}
    </Surface>
  );
}
