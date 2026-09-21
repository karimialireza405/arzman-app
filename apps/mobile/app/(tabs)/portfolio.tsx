import { useEffect, useState, useCallback } from "react";
import { Alert, AppState, Platform, Pressable, View, StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import {
  calculatePortfolio,
  valuation,
  names,
  formatNumber,
  type Asset,
} from "@arzman/shared";
import { useApp } from "../../src/store";
import {
  Screen,
  Card,
  Label,
  Price,
  GlassButton,
  EmptyState,
  MarketChangeBadge,
  MarketStatus,
  AppIcon,
  useTheme,
  radii,
  concentricRadius,
} from "../../src/ui";

const assetColors: Record<Asset, string> = {
  USD: "#0A84FF",
  EUR: "#5E5CE6",
  AED: "#30D158",
  IQD: "#FF9F0A",
  USDT: "#26A17B",
  IRT: "#BF5AF2",
};

export default function Portfolio() {
  const app = useApp();
  const t = useTheme();
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

  // Biometric Privacy Gate
  if (app.user.settings.privacy && !unlocked) {
    return (
      <Screen title="دارایی من" eyebrow="محافظت‌شده با قفل دستگاه">
        <EmptyState
          title="دارایی خصوصی شما"
          description="برای مشاهدهٔ دارایی و تراکنش‌ها، هویت خود را با Face ID یا رمز دستگاه تأیید کنید."
          icon="lock-closed-outline"
        />
        <GlassButton
          title="تأیید هویت و ورود"
          variant="prominent"
          size="large"
          onPress={() => void unlock()}
        />
        {!!authError && (
          <Label red size={13} style={{ textAlign: "center" }}>
            {authError}
          </Label>
        )}
      </Screen>
    );
  }

  const assets = calculatePortfolio(app.transactions);

  const rows = assets.map((asset) => {
    const quote = app.snapshot?.quotes.find(
      (q) => q.currency === asset.currency,
    );
    const custom = app.user.customRates.find(
      (r) => r.currency === asset.currency,
    );
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
  const totalUnrealizedPnl = totalValue - totalCostBasis;
  const totalUnrealizedPnlPercent =
    totalCostBasis > 0 ? (totalUnrealizedPnl / totalCostBasis) * 100 : null;

  const totalRealizedPnl = rows.reduce((s, r) => s + r.asset.realizedPnl, 0);

  const dailyChange = rows.every(
    (r) => r.asset.currency === "IRT" || r.quote?.change != null,
  )
    ? rows.reduce((s, r) => s + r.asset.quantity * (r.quote?.change ?? 0), 0)
    : null;

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
        />
      ) : (
        <>
          {/* 1. Portfolio Overview Header Card */}
          <Card elevated style={{ padding: 20, gap: 16 }}>
            <View
              style={{
                flexDirection: "row-reverse",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ gap: 2 }}>
                <Label size={12} weight="700" accent>
                  ارزش برآوردی کل پورتفوی
                </Label>
                <Price value={totalValue} large />
              </View>

              {dailyChange !== null && (
                <View style={{ alignItems: "flex-start", gap: 4 }}>
                  <Label secondary size={11}>
                    تغییر روزانه:
                  </Label>
                  <Price value={dailyChange} />
                </View>
              )}
            </View>

            {/* P&L metrics pills */}
            <View
              style={{
                flexDirection: "row-reverse",
                gap: 8,
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: t.raised,
                  padding: 10,
                  borderRadius: radii.control,
                  gap: 3,
                }}
              >
                <Label secondary size={11}>
                  سود/زیان تحقق‌نیافته
                </Label>
                <Price value={totalUnrealizedPnl} />
                <MarketChangeBadge value={totalUnrealizedPnlPercent} size="small" />
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: t.raised,
                  padding: 10,
                  borderRadius: radii.control,
                  gap: 3,
                }}
              >
                <Label secondary size={11}>
                  سود/زیان تحقق‌یافته
                </Label>
                <Price value={totalRealizedPnl} />
                <Label tertiary size={10}>
                  از فروش‌های قطعی
                </Label>
              </View>
            </View>

            {/* Multi-asset Allocation Bar */}
            {totalValue > 0 && (
              <View style={{ gap: 8, paddingTop: 4 }}>
                <Label secondary size={12}>
                  ترکیب دارایی‌ها
                </Label>
                <View
                  style={{
                    height: 8,
                    borderRadius: 4,
                    flexDirection: "row-reverse",
                    overflow: "hidden",
                    backgroundColor: t.raised,
                  }}
                >
                  {rows.map(({ asset, value }) => {
                    const pct = value?.value ? (value.value / totalValue) * 100 : 0;
                    if (pct <= 0) return null;
                    return (
                      <View
                        key={asset.currency}
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          backgroundColor: assetColors[asset.currency] || t.accent,
                        }}
                      />
                    );
                  })}
                </View>

                {/* Allocation labels */}
                <View
                  style={{
                    flexDirection: "row-reverse",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  {rows.map(({ asset, value }) => {
                    const pct = value?.value ? (value.value / totalValue) * 100 : 0;
                    if (pct <= 0) return null;
                    return (
                      <View
                        key={asset.currency}
                        style={{
                          flexDirection: "row-reverse",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: assetColors[asset.currency] || t.accent,
                          }}
                        />
                        <Label secondary size={11}>
                          {names[asset.currency]}: {formatNumber(pct, app.user.settings.persian, 1)}٪
                        </Label>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </Card>

          {/* 2. Holdings Breakdown Cards */}
          {rows.map(({ asset, value, manual }) => (
            <Card key={asset.currency} style={{ padding: 18, gap: 12 }}>
              <View
                style={{
                  flexDirection: "row-reverse",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: concentricRadius(radii.card, 18, 10),
                      backgroundColor: assetColors[asset.currency] + "26",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Label size={15} weight="700" style={{ color: assetColors[asset.currency] }}>
                      {asset.currency === "IRT" ? "ت" : asset.currency.slice(0, 3)}
                    </Label>
                  </View>
                  <View style={{ gap: 2 }}>
                    <Label size={17} weight="700">
                      {names[asset.currency]}
                    </Label>
                    <Label secondary size={12}>
                      موجودی: {formatNumber(asset.quantity, app.user.settings.persian, 4)}{" "}
                      {asset.currency}
                    </Label>
                  </View>
                </View>

                <Price value={value?.value} />
              </View>

              {manual && (
                <View
                  style={{
                    backgroundColor: t.dark
                      ? "rgba(255, 214, 10, 0.15)"
                      : "rgba(255, 149, 0, 0.12)",
                    padding: 6,
                    borderRadius: radii.controlSmall,
                  }}
                >
                  <Label size={11} amber style={{ textAlign: "center" }}>
                    محاسبه بر اساس نرخ دستی تعیین‌شده توسط شما
                  </Label>
                </View>
              )}

              {/* Metrics Grid */}
              <View
                style={{
                  flexDirection: "row-reverse",
                  gap: 8,
                  paddingTop: 4,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: t.raised,
                    padding: 8,
                    borderRadius: radii.controlSmall,
                    gap: 2,
                  }}
                >
                  <Label secondary size={10}>
                    میانگین بهای خرید
                  </Label>
                  <Price value={asset.averageCost} />
                </View>

                <View
                  style={{
                    flex: 1,
                    backgroundColor: t.raised,
                    padding: 8,
                    borderRadius: radii.controlSmall,
                    gap: 2,
                  }}
                >
                  <Label secondary size={10}>
                    سود/زیان باز
                  </Label>
                  <Price value={value?.pnl} />
                  <MarketChangeBadge value={value?.pnlPercent} size="small" />
                </View>
              </View>
            </Card>
          ))}
        </>
      )}

      {/* 3. Action Buttons */}
      <View style={{ gap: 10 }}>
        <GlassButton
          title="ثبت تراکنش جدید"
          icon="add"
          variant="prominent"
          size="medium"
          onPress={() => router.push("/transaction")}
        />

        <GlassButton
          title="تنظیم نرخ دستی (تتر و ارزها)"
          icon="pricetag-outline"
          variant="regular"
          size="medium"
          onPress={() => router.push("/custom-rates")}
        />
      </View>

      {/* 4. Recent Transactions Ledger */}
      {app.transactions.length > 0 && (
        <Card style={{ padding: 18, gap: 12 }}>
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Label size={16} weight="700">
              تاریخچه تراکنش‌های اخیر
            </Label>
            <Label secondary size={11}>
              لمس برای حذف
            </Label>
          </View>

          <View style={{ gap: 8 }}>
            {app.transactions
              .slice(-10)
              .reverse()
              .map((tx) => {
                const typeText = {
                  buy: "خرید",
                  sell: "فروش",
                  adjustment: "اصلاح",
                }[tx.type];

                const typeColor =
                  tx.type === "buy"
                    ? t.green
                    : tx.type === "sell"
                      ? t.red
                      : t.accent;

                const summary = `${typeText} · ${formatNumber(tx.quantity, app.user.settings.persian)} ${names[tx.currency]}`;

                return (
                  <Pressable
                    key={tx.id}
                    accessibilityRole="button"
                    accessibilityLabel={`حذف تراکنش ${summary}`}
                    onPress={() => confirmRemove(tx.id, summary)}
                    style={({ pressed }) => ({
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor: pressed ? t.surfaceHover : t.raised,
                      borderRadius: radii.control,
                      gap: 4,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: t.line,
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
                        style={{
                          flexDirection: "row-reverse",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: radii.pill,
                            backgroundColor: typeColor + "20",
                          }}
                        >
                          <Label size={11} weight="700" style={{ color: typeColor }}>
                            {typeText}
                          </Label>
                        </View>
                        <Label size={13} weight="600">
                          {formatNumber(tx.quantity, app.user.settings.persian)}{" "}
                          {names[tx.currency]}
                        </Label>
                      </View>

                      <Label size={13} weight="600" tabular>
                        {formatNumber(tx.costToman, app.user.settings.persian)} تومان
                      </Label>
                    </View>

                    <View
                      style={{
                        flexDirection: "row-reverse",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Label tertiary size={10}>
                        {new Date(tx.timestamp).toLocaleString(
                          app.user.settings.persian ? "fa-IR" : "en-US",
                        )}
                      </Label>
                      <AppIcon name="close" size={14} color={t.textTertiary} />
                    </View>
                  </Pressable>
                );
              })}
          </View>
        </Card>
      )}

      {/* 5. Privacy Assurance Notice */}
      <View style={{ paddingHorizontal: 6, gap: 4, marginTop: 4 }}>
        <Label tertiary size={11} style={{ textAlign: "center", lineHeight: 17 }}>
          اطلاعات دارایی شما منحصراً روی حافظهٔ دستگاه (Keychain در آیفون) ذخیره می‌شود
          و هیچ‌گونه تبادل پورتفوی با سرورهای ارز من یا منابع واسطه انجام نمی‌شود.
        </Label>
      </View>
    </Screen>
  );
}
