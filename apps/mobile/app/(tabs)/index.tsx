import { View, Pressable } from "react-native";
import { router } from "expo-router";
import {
  calculatePortfolio,
  valuation,
  formatNumber,
} from "@arzman/shared";
import { useApp } from "../../src/store";
import {
  Screen,
  Label,
  CurrencyRow,
  Section,
  Card,
  Price,
  MarketHero,
  GlassButton,
  GlassIconButton,
  AppIcon,
  useTheme,
  radii,
} from "../../src/ui";

export default function Home() {
  const app = useApp();
  const t = useTheme();
  const quotes = app.snapshot?.quotes ?? [];
  const assets = calculatePortfolio(app.transactions);

  const values = assets.map((a) =>
    valuation(
      a,
      a.currency === "IRT"
        ? 1
        : (quotes.find((q) => q.currency === a.currency)?.priceToman ?? null),
    ),
  );

  const totalPortfolioValue = values.some((v) => v === null)
    ? null
    : values.reduce((s, v) => s + (v?.value ?? 0), 0);

  const majorCurrencies = (["EUR", "AED", "IQD"] as const);

  return (
    <Screen
      title="ارز من"
      eyebrow="نبض بازار آزاد، در دستان شما"
      refresh
      trailing={
        <GlassIconButton
          icon="search"
          accessibilityLabel="جستجو در بازار"
          size={38}
          onPress={() => router.push("/market")}
        />
      }
    >
      {/* 1. Hero Market Overview (Live USD Benchmark + Actions) */}
      <MarketHero />

      {/* 2. Portfolio Sneak-Peek (if user has holdings & privacy allows) */}
      {assets.length > 0 && !app.user.settings.privacy && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="مشاهده جزئیات دارایی"
          onPress={() => router.push("/portfolio")}
          style={({ pressed }) => ({
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Card
            elevated
            style={{
              padding: 18,
              gap: 12,
              backgroundColor: t.dark
                ? "rgba(18, 22, 30, 0.9)"
                : "rgba(255, 255, 255, 0.95)",
            }}
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
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: t.dark
                      ? "rgba(10, 132, 255, 0.18)"
                      : "rgba(0, 122, 255, 0.12)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <AppIcon name="wallet" size={16} color={t.accent} />
                </View>
                <Label size={15} weight="700">
                  برآورد ارزش دارایی من
                </Label>
              </View>

              <Label size={12} weight="600" accent>
                مدیریت دارایی ›
              </Label>
            </View>

            <View
              style={{
                flexDirection: "row-reverse",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <Price value={totalPortfolioValue} large />
              <Label secondary size={12}>
                {formatNumber(assets.length, app.user.settings.persian)} دارایی ثبت‌شده
              </Label>
            </View>
          </Card>
        </Pressable>
      )}

      {/* 3. Major Iranian Market Currencies */}
      <Section
        title="ارزهای شاخص بازار"
        subtitle="نرخ زنده با متادیتای صرافی آزاد"
        action={{
          title: "نمایش همه",
          onPress: () => router.push("/market"),
        }}
      >
        <View style={{ gap: 10 }}>
          {majorCurrencies.map((code) => (
            <CurrencyRow
              key={code}
              code={code}
              quote={quotes.find((q) => q.currency === code)}
            />
          ))}
        </View>
      </Section>

      {/* 4. Watchlist / Favorites */}
      <Section
        title="دنبال‌شده‌های من"
        subtitle={`${formatNumber(app.user.watchlist.length, app.user.settings.persian)} ارز در فهرست منتخب`}
        action={{
          title: "ویرایش فهرست",
          onPress: () => router.push("/market"),
        }}
      >
        {app.user.watchlist.length === 0 ? (
          <Card style={{ alignItems: "center", paddingVertical: 24, gap: 8 }}>
            <AppIcon name="star-outline" size={28} color={t.textTertiary} />
            <Label secondary size={13}>
              هنوز ارزی به دنبال‌شده‌ها اضافه نشده است
            </Label>
            <GlassButton
              title="انتخاب ارزها از بازار"
              size="small"
              onPress={() => router.push("/market")}
            />
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {app.user.watchlist.map((code) => (
              <CurrencyRow
                key={code}
                code={code}
                quote={quotes.find((q) => q.currency === code)}
              />
            ))}
          </View>
        )}
      </Section>

      {/* 5. Fast Converter Teaser Card */}
      <Card
        style={{
          padding: 18,
          gap: 14,
          backgroundColor: t.dark
            ? "rgba(18, 20, 26, 0.8)"
            : "rgba(255, 255, 255, 0.9)",
        }}
      >
        <View
          style={{
            flexDirection: "row-reverse",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ gap: 2 }}>
            <Label size={17} weight="700">
              تبدیل هوشمند نرخ ارز
            </Label>
            <Label secondary size={12}>
              محاسبه بدون کارمزد با دقیق‌ترین نرخ بازار آزاد
            </Label>
          </View>

          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.control,
              backgroundColor: t.dark
                ? "rgba(48, 209, 88, 0.16)"
                : "rgba(52, 199, 89, 0.12)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <AppIcon name="swap-horizontal" size={20} color={t.green} />
          </View>
        </View>

        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 8,
            backgroundColor: t.raised,
            padding: 10,
            borderRadius: radii.control,
          }}
        >
          <Label size={13} weight="600" style={{ flex: 1 }}>
            ۱۰۰ دلار آمریکا ={" "}
            {quotes.find((q) => q.currency === "USD")
              ? `${formatNumber(
                  (quotes.find((q) => q.currency === "USD")?.priceToman ?? 0) * 100,
                  app.user.settings.persian,
                  0,
                )} تومان`
              : "در حال دریافت…"}
          </Label>
        </View>

        <GlassButton
          title="باز کردن مبدل کامل"
          icon="swap-horizontal"
          variant="prominent"
          size="medium"
          onPress={() => router.push("/converter")}
        />
      </Card>

      {/* 6. Legal / Market Disclaimer */}
      <View style={{ paddingHorizontal: 6, gap: 4, marginTop: 4 }}>
        <Label tertiary size={11} style={{ textAlign: "center", lineHeight: 17 }}>
          اطلاعات از شبکه اطلاع‌رسانی طلا و ارز (TGJU) دریافت می‌شود. نرخ‌های اعلام‌شده
          صرفاً جهت اطلاع‌رسانی بازار آزاد است و ممکن است در ساعات مختلف یا میان صرافی‌ها
          دارای نوسان باشد.
        </Label>
      </View>
    </Screen>
  );
}
