/**
 * Portfolio — «دارایی من»
 *
 * All financial math is unchanged (calculatePortfolio / valuation). Only the
 * presentation moved to the new UI kit: a quiet hero, grouped holdings rows,
 * and an inset transaction ledger with confirmation-based deletion.
 */
import { useCallback, useEffect, useState } from "react";
import { Alert, AppState, Platform, Pressable, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import {
  calculatePortfolio,
  valuation,
  names,
  formatNumber,
  type Asset,
  type PortfolioAsset,
} from "@arzman/shared";
import { useApp } from "../../src/store";
import {
  AppIcon,
  Button,
  ChangePill,
  CurrencyBadge,
  Divider,
  EmptyState,
  GroupedList,
  Label,
  MarketStatus,
  Screen,
  Section,
  Surface,
  radii,
  spacing,
  useFeedback,
  useTheme,
} from "../../src/ui";

export const assetColors: Record<Asset, string> = {
  USD: "#0A84FF",
  EUR: "#5E5CE6",
  AED: "#30D158",
  IQD: "#FF9F0A",
  USDT: "#40C8E0",
  IRT: "#BF5AF2",
};

/** Slim multi-asset allocation bar with its legend. */
function AllocationBar({
  allocation,
  total,
}: {
  allocation: { asset: PortfolioAsset; value: number }[];
  total: number;
}) {
  const app = useApp();
  return (
    <View style={{ gap: spacing.xxs }}>
      <Divider />
      <View
        style={{
          flexDirection: "row-reverse",
          height: 8,
          borderRadius: 4,
          borderCurve: "continuous",
          overflow: "hidden",
          gap: 2,
        }}
      >
        {allocation.map(({ asset, value }) => (
          <View
            key={asset.currency}
            style={{
              flex: Math.max(value, 0.0001),
              backgroundColor: assetColors[asset.currency],
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: spacing.xs }}>
        {allocation.map(({ asset, value }) => (
          <View
            key={asset.currency}
            style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: assetColors[asset.currency],
              }}
            />
            <Label tertiary size={11} allowFontScaling={false}>
              {names[asset.currency]}{" "}
              {formatNumber((value / Math.max(total, 1)) * 100, app.user.settings.persian, 1)}٪
            </Label>
          </View>
        ))}
      </View>
    </View>
  );
}

/** One quiet stat column used in the hero (label + value, no box). */
function StatColumn({
  title,
  value,
  tone = "neutral",
  pill,
}: {
  title: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
  pill?: number | null;
}) {
  const t = useTheme();
  const color =
    tone === "positive" ? t.greenText : tone === "negative" ? t.redText : t.text;
  return (
    <View style={{ gap: 2, flex: 1 }}>
      <Label tertiary size={11}>
        {title}
      </Label>
      <View style={{ flexDirection: "row-reverse", gap: spacing.xxs, alignItems: "center" }}>
        <Label
          allowFontScaling={false}
          style={{
            fontSize: 17,
            fontWeight: "600",
            fontVariant: ["tabular-nums"],
            writingDirection: "ltr",
            color,
          }}
        >
          {value}
        </Label>
        {pill !== undefined && pill !== null ? <ChangePill value={pill} size="small" /> : null}
      </View>
    </View>
  );
}

export default function Portfolio() {
  const app = useApp();
  const t = useTheme();
  const feedback = useFeedback();
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState("");

  useFocusEffect(useCallback(() => () => setUnlocked(false), []));

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active") setUnlocked(false);
    });
    return () => sub.remove();
  }, []);

  const unlock = async () => {
    if (Platform.OS === "web") {
      setAuthError("قفل دستگاه فقط روی آیفون قابل استفاده است");
      return;
    }
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "باز کردن دارایی من",
        cancelLabel: "انصراف",
        disableDeviceFallback: false,
      });
      setUnlocked(result.success);
      if (!result.success) setAuthError("احراز هویت انجام نشد");
    } catch {
      setAuthError("احراز هویت دستگاه در دسترس نیست");
    }
  };

  const confirmRemove = (id: string, label: string) => {
    feedback.warning();
    Alert.alert(
      "حذف تراکنش",
      `آیا از حذف «${label}» اطمینان دارید؟ میانگین بهای خرید مجدداً محاسبه خواهد شد.`,
      [
        { text: "انصراف", style: "cancel" },
        {
          text: "حذف تراکنش",
          style: "destructive",
          onPress: () => {
            app.removeTransaction(id).catch((err) => {
              Alert.alert(
                "خطا در حذف",
                err instanceof Error ? err.message : "حذف تراکنش ناموفق بود",
              );
            });
          },
        },
      ],
    );
  };

  // Biometric privacy gate — behavior unchanged, presentation updated.
  if (app.user.settings.privacy && !unlocked) {
    return (
      <Screen title="دارایی من" eyebrow="محافظت‌شده با قفل دستگاه">
        <EmptyState
          title="دارایی خصوصی شما"
          description="برای مشاهدهٔ دارایی و تراکنش‌ها، هویت خود را با Face ID یا رمز دستگاه تأیید کنید."
          icon="lock-closed-outline"
        />
        <Button
          title="تأیید هویت و ورود"
          variant="prominent"
          size="large"
          fullWidth
          onPress={() => void unlock()}
        />
        {!!authError && (
          <Label red size={13} align="center">
            {authError}
          </Label>
        )}
      </Screen>
    );
  }

  const assets = calculatePortfolio(app.transactions);

  const rows = assets.map((asset) => {
    const quote = app.snapshot?.quotes.find((q) => q.currency === asset.currency);
    const custom = app.user.customRates.find((r) => r.currency === asset.currency);
    const price =
      asset.currency === "IRT"
        ? 1
        : (quote?.priceToman ??
          (asset.currency === "USDT" ? custom?.priceToman : null) ??
          null);
    return {
      asset,
      value: valuation(asset, price),
      quote,
      manual: asset.currency === "USDT" && !!custom,
    };
  });

  const totalValue = rows.reduce((s, r) => s + (r.value?.value ?? 0), 0);
  const totalCostBasis = rows.reduce((s, r) => s + r.asset.costBasis, 0);
  const unrealized = totalValue - totalCostBasis;
  const unrealizedPercent =
    totalCostBasis > 0 ? (unrealized / totalCostBasis) * 100 : null;
  const realized = rows.reduce((s, r) => s + r.asset.realizedPnl, 0);

  const dailyChange = rows.every(
    (r) => r.asset.currency === "IRT" || r.quote?.change != null,
  )
    ? rows.reduce((s, r) => s + r.asset.quantity * (r.quote?.change ?? 0), 0)
    : null;

  const allocation = rows
    .filter((r) => (r.value?.value ?? 0) > 0)
    .map((r) => ({ asset: r.asset, value: r.value!.value }));

  const persian = app.user.settings.persian;

  return (
    <Screen
      title="دارایی من"
      eyebrow="کاملاً محلی و رمزگذاری‌شده در دستگاه"
      refresh
    >
      <MarketStatus />

      {assets.length === 0 ? (
        <EmptyState
          title="هنوز دارایی ثبت نکرده‌اید"
          description="تراکنش‌های خرید و فروش ارز یا تتر را وارد کنید تا ارزش لحظه‌ای، سود/زیان و میانگین قیمت را مشاهده نمایید."
          icon="wallet-outline"
          action={{
            title: "ثبت اولین تراکنش",
            onPress: () => router.push("/transaction"),
          }}
        />
      ) : (
        <Surface elevated radius={radii.cardLarge} style={{ gap: spacing.sm }}>
          <View style={{ gap: 2 }}>
            <Label tertiary size={12}>
              ارزش برآوردی کل
            </Label>
            <Label
              allowFontScaling={false}
              style={{
                fontSize: 36,
                lineHeight: 44,
                fontWeight: "700",
                letterSpacing: -0.4,
                fontVariant: ["tabular-nums"],
                writingDirection: "ltr",
              }}
            >
              {formatNumber(totalValue, persian, 0)}
            </Label>
            <Label tertiary size={11} allowFontScaling={false}>
              تومان
            </Label>
          </View>

          <View
            style={{ flexDirection: "row-reverse", gap: spacing.md, alignItems: "center" }}
          >
            <StatColumn
              title="سود/زیان باز"
              value={formatNumber(unrealized, persian, 0)}
              tone={unrealized >= 0 ? "positive" : "negative"}
              pill={unrealizedPercent}
            />
            <StatColumn
              title="تحقق‌یافته"
              value={formatNumber(realized, persian, 0)}
              tone={realized >= 0 ? "neutral" : "negative"}
            />
            {dailyChange !== null ? (
              <StatColumn
                title="تغییر امروز"
                value={formatNumber(dailyChange, persian, 0)}
                tone={dailyChange >= 0 ? "positive" : "negative"}
              />
            ) : null}
          </View>

          {allocation.length > 1 ? (
            <AllocationBar allocation={allocation} total={totalValue} />
          ) : null}
        </Surface>
      )}

      {/* Holdings — grouped rows, never dashboard cards */}
      {rows.length > 0 ? (
        <Section title="دارایی‌های شما" subtitle="ارزش لحظه‌ای بر اساس نرخ بازار">
          <GroupedList separatorInset={66}>
            {rows.map(({ asset, value, quote, manual }) => {
              const pnlPercent = value?.pnlPercent ?? null;
              return (
                <Pressable
                  key={asset.currency}
                  accessibilityRole="button"
                  accessibilityLabel={`${names[asset.currency]}، ${formatNumber(asset.quantity, persian)} واحد`}
                  onPress={() => feedback.tap()}
                  style={({ pressed }) => [
                    {
                      backgroundColor: pressed ? t.pressedOverlay : "transparent",
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      gap: spacing.xxs,
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      gap: spacing.xs,
                    }}
                  >
                    <CurrencyBadge code={asset.currency} size="md" dark={t.dark} />

                    <View style={{ flex: 1, gap: 1 }}>
                      <Label size={17} weight="500" numberOfLines={1}>
                        {names[asset.currency]}
                      </Label>
                      <Label tertiary size={12} allowFontScaling={false}>
                        {formatNumber(asset.quantity, persian)} واحد
                        {manual ? " · نرخ دستی" : ""}
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
                        }}
                      >
                        {value ? formatNumber(value.value, persian, 0) : "—"}
                      </Label>
                      <ChangePill value={pnlPercent} size="small" />
                    </View>
                  </View>

                  {quote || manual ? (
                    <View
                      style={{
                        flexDirection: "row-reverse",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingStart: 50,
                      }}
                    >
                      <Label tertiary size={11} allowFontScaling={false}>
                        میانگین خرید {formatNumber(asset.averageCost, persian, 0)}
                      </Label>
                      {manual ? (
                        <Label amber size={11} allowFontScaling={false}>
                          محاسبه با نرخ دستی شما
                        </Label>
                      ) : (
                        <Label tertiary size={11} allowFontScaling={false}>
                          {quote?.sourceTimeLabel}
                        </Label>
                      )}
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </GroupedList>
        </Section>
      ) : null}

      {/* Primary actions — one prominent CTA per view (HIG · Buttons) */}
      <View style={{ gap: spacing.xs }}>
        <Button
          title="ثبت تراکنش جدید"
          icon="add"
          variant="prominent"
          size="medium"
          fullWidth
          onPress={() => router.push("/transaction")}
        />
        <Button
          title="تنظیم نرخ دستی (تتر و ارزها)"
          icon="pricetag-outline"
          variant="tinted"
          size="medium"
          fullWidth
          onPress={() => router.push("/custom-rates")}
        />
      </View>

      {/* Recent transactions — inset ledger, tap-to-delete with confirmation */}
      {app.transactions.length > 0 ? (
        <Section title="تراکنش‌های اخیر" subtitle="لمس هر ردیف برای حذف با تأیید">
          <GroupedList>
            {app.transactions
              .slice(-10)
              .reverse()
              .map((tx) => {
                const typeText = { buy: "خرید", sell: "فروش", adjustment: "اصلاح" }[
                  tx.type
                ];
                const typeColor =
                  tx.type === "buy" ? t.green : tx.type === "sell" ? t.red : t.accent;
                const summary = `${typeText} · ${formatNumber(tx.quantity, persian)} ${names[tx.currency]}`;
                return (
                  <Pressable
                    key={tx.id}
                    accessibilityRole="button"
                    accessibilityLabel={`حذف تراکنش ${summary}`}
                    onPress={() => confirmRemove(tx.id, summary)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? t.pressedOverlay : "transparent",
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      gap: 4,
                    })}
                  >
                    <View
                      style={{
                        flexDirection: "row-reverse",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{ flexDirection: "row-reverse", alignItems: "center", gap: spacing.xxs }}
                      >
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: radii.pill,
                            backgroundColor: typeColor + "22",
                          }}
                        >
                          <Label size={11} weight="700" style={{ color: typeColor }}>
                            {typeText}
                          </Label>
                        </View>
                        <Label size={15} weight="500">
                          {formatNumber(tx.quantity, persian)} {names[tx.currency]}
                        </Label>
                      </View>
                      <Label
                        size={15}
                        weight="600"
                        allowFontScaling={false}
                        style={{ fontVariant: ["tabular-nums"], writingDirection: "ltr" }}
                      >
                        {formatNumber(tx.costToman, persian)} تومان
                      </Label>
                    </View>
                    <View
                      style={{
                        flexDirection: "row-reverse",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Label tertiary size={11} allowFontScaling={false}>
                        {new Date(tx.timestamp).toLocaleString(
                          persian ? "fa-IR" : "en-US",
                        )}
                      </Label>
                      <AppIcon name="trash" size={13} color={t.textTertiary} />
                    </View>
                  </Pressable>
                );
              })}
          </GroupedList>
        </Section>
      ) : null}

      <View style={{ paddingHorizontal: spacing.xxs }}>
        <Label tertiary size={11} align="center" style={{ lineHeight: 17 }}>
          اطلاعات دارایی شما منحصراً روی حافظهٔ دستگاه (Keychain در آیفون) ذخیره
          می‌شود و هیچ تبادلی با سرور انجام نمی‌گیرد.
        </Label>
      </View>
    </Screen>
  );
}
