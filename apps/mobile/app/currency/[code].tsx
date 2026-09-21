/**
 * Currency detail — «جزئیات ارز»
 *
 * Apple Stocks pattern: calm hero (name, live price, change), then the real
 * observation chart, then a grouped stats list, then a small set of actions.
 * One prominent action only (HIG · Buttons).
 */
import { useLocalSearchParams, router } from "expo-router";
import { View } from "react-native";
import { CurrencySchema, formatNumber, names } from "@arzman/shared";
import { useApp } from "../../src/store";
import { ChartCard } from "../../src/chart";
import {
  Button,
  ChangePill,
  CurrencyBadge,
  Divider,
  EmptyState,
  GroupedList,
  IconButton,
  Label,
  MarketStatus,
  Price,
  RangeMeter,
  Screen,
  Section,
  SettingsRow,
  Surface,
  radii,
  spacing,
  useTheme,
  usePrice,
} from "../../src/ui";

export default function Detail() {
  const params = useLocalSearchParams<{ code: string }>();
  const app = useApp();
  const t = useTheme();
  const fmt = usePrice();

  const result = CurrencySchema.safeParse(params.code);
  if (!result.success) {
    return (
      <Screen title="ارز نامعتبر">
        <EmptyState
          title="ارز پیدا نشد"
          description="کد ارز نامعتبر است. از فهرست بازار ارز مورد نظر را انتخاب کنید."
          icon="close-outline"
        />
      </Screen>
    );
  }

  const code = result.data;
  const q = app.snapshot?.quotes.find((item) => item.currency === code);
  const isFavorite = app.user.watchlist.includes(code);

  const toggleFavorite = () => {
    app.updateUser((u) => ({
      ...u,
      watchlist: isFavorite
        ? u.watchlist.filter((c) => c !== code)
        : [...u.watchlist, code],
    }));
  };


  return (
    <Screen
      title={names[code]}
      eyebrow={`${code} · بازار آزاد ایران`}
      refresh
      trailing={
        <IconButton
          icon={isFavorite ? "star" : "star-outline"}
          size={38}
          active={isFavorite}
          activeColor={t.amber}
          accessibilityLabel={isFavorite ? "حذف از دنبال‌شده‌ها" : "افزودن به دنبال‌شده‌ها"}
          onPress={toggleFavorite}
        />
      }
    >
      <MarketStatus />

      {/* Hero */}
      <Surface elevated radius={radii.cardLarge} style={{ gap: spacing.sm }}>
        <View
          style={{
            flexDirection: "row-reverse",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: spacing.xs }}>
            <CurrencyBadge code={code} size="lg" tone="filled" dark={t.dark} />
            <View style={{ gap: 2 }}>
              <Label size={17} weight="600">
                {names[code]}
              </Label>
              <Label tertiary size={11} allowFontScaling={false}>
                کد استاندارد {code}
              </Label>
            </View>
          </View>
          <ChangePill value={q?.changePercent} size="medium" />
        </View>

        <Price value={q?.priceToman} size="hero" align="flex-start" />

        {q ? (
          <RangeMeter current={q.priceToman} low={q.lowToman} high={q.highToman} />
        ) : null}

        <Divider />

        <View style={{ flexDirection: "row-reverse", justifyContent: "space-between" }}>
          <Label tertiary size={11} allowFontScaling={false}>
            زمان منبع: {q?.sourceTimeLabel || "نامشخص"}
          </Label>
          <Label tertiary size={11} allowFontScaling={false}>
            واحد منبع: {q?.rawUnit === "IRR" ? "ریال" : "تومان"} · هر{" "}
            {formatNumber(q?.quoteSize ?? 1, app.user.settings.persian, 0)} واحد
          </Label>
        </View>
      </Surface>

      {/* Observation chart (real data only) */}
      <ChartCard currency={code} />

      {/* Daily stats — grouped list, values dominate labels */}
      <Section title="آمار امروز">
        <GroupedList>
          <SettingsRow
            title="بالاترین نرخ روز"
            accessory="none"
            value={q && q.highToman != null ? `${fmt(q.highToman)} ${names[app.user.settings.unit]}` : "—"}
          />
          <SettingsRow
            title="پایین‌ترین نرخ روز"
            accessory="none"
            value={q && q.lowToman != null ? `${fmt(q.lowToman)} ${names[app.user.settings.unit]}` : "—"}
          />
          <SettingsRow
            title="نرخ روز گذشته"
            accessory="none"
            value={q?.previousToman != null ? `${fmt(q.previousToman)} ${names[app.user.settings.unit]}` : "—"}
          />
          <SettingsRow
            title="تغییر روزانه"
            accessory="none"
            value={
              q?.change != null
                ? `${q.change >= 0 ? "+" : ""}${fmt(q.change)} ${names[app.user.settings.unit]}`
                : "—"
            }
          />
        </GroupedList>
      </Section>

      {/* Actions — stacked full-width rounded buttons (HIG · Buttons · iOS) */}
      <View style={{ gap: spacing.xs }}>
        <Button
          title="تبدیل این ارز در مبدل"
          icon="swap-horizontal"
          variant="prominent"
          size="large"
          fullWidth
          onPress={() => router.push({ pathname: "/converter", params: { from: code } })}
        />
        <Button
          title="تنظیم هشدار قیمت"
          icon="notifications-outline"
          variant="tinted"
          size="medium"
          fullWidth
          onPress={() => router.push({ pathname: "/alerts", params: { currency: code } })}
        />
        <Button
          title={isFavorite ? "حذف از دنبال‌شده‌ها" : "افزودن به دنبال‌شده‌ها"}
          icon={isFavorite ? "star" : "star-outline"}
          variant="glass"
          size="medium"
          fullWidth
          onPress={toggleFavorite}
        />
        <Button
          title="ثبت تراکنش در دارایی من"
          icon="add"
          variant="glass"
          size="medium"
          fullWidth
          onPress={() => router.push("/transaction")}
        />
      </View>
    </Screen>
  );
}
