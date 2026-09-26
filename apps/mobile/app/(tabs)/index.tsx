/**
 * Home — «خانه»
 *
 * Layout follows Apple's priority order: the single benchmark quote first,
 * then the user's own money, then the rest of the market. Secondary markets
 * sit in one inset grouped list instead of four equal-weight cards.
 */
import { View } from "react-native";
import { router } from "expo-router";
import { calculatePortfolio, names, valuation, totalValuation } from "@arzman/shared";
import { useApp } from "../../src/store";
import {
  CurrencyList,
  GroupedList,
  CurrencyRow,
  IconButton,
  Label,
  MarketHero,
  MarketStatus,
  Screen,
  Section,
  SettingsRow,
  spacing,
  usePrice,
  useTheme,
} from "../../src/ui";

const majorCurrencies = ["EUR", "AED", "IQD"] as const;

export default function Home() {
  const app = useApp();
  const t = useTheme();
  const fmt = usePrice();
  const unit = names[app.user.settings.unit];
  const quotes = app.snapshot?.quotes ?? [];
  const assets = calculatePortfolio(app.transactions);

  const values = assets.map((a) =>
    valuation(
      a,
      a.currency === "IRT"
        ? 1
        : // Market quote first; a personal rate only fills an absent quote.
          (quotes.find((q) => q.currency === a.currency)?.priceToman ??
          app.user.customRates.find((r) => r.currency === a.currency)?.priceToman ??
          null),
    ),
  );
  const totalPortfolioValue = totalValuation(values);

  // Followed currencies that are not already covered by the hero + majors.
  const extraWatchlist = app.user.watchlist.filter(
    (code) => !["USD", ...majorCurrencies].includes(code),
  );

  const usd = quotes.find((q) => q.currency === "USD");

  return (
    <Screen
      title="ارز من"
      eyebrow="نبض بازار آزاد، در دستان شما"
      refresh
      trailing={
        <IconButton
          icon="search"
          size={38}
          accessibilityLabel="جستجو در بازار"
          onPress={() => router.push("/market")}
        />
      }
    >
      <MarketStatus />

      <MarketHero />

      {/* Portfolio glance — one calm row, not a dashboard card */}
      {assets.length > 0 && !app.user.settings.privacy && (
        <Section title="دارایی من" action={{ title: "مدیریت", onPress: () => router.push("/portfolio") }}>
          <GroupedList>
            <SettingsRow
              title="ارزش برآوردی کل"
              icon="wallet"
              value={
                totalPortfolioValue !== null
                  ? `${fmt(totalPortfolioValue, 0)} ${unit}`
                  : "—"
              }
              onPress={() => router.push("/portfolio")}
              accessory="chevron"
            />
          </GroupedList>
        </Section>
      )}

      {/* Secondary markets in a single grouped list */}
      <Section
        title="بازارهای اصلی"
        subtitle="نرخ لحظه‌ای بازار آزاد ایران"
        action={{ title: "بازار کامل", onPress: () => router.push("/market") }}
      >
        <CurrencyList>
          {majorCurrencies.map((code) => (
            <CurrencyRow
              key={code}
              code={code}
              quote={quotes.find((q) => q.currency === code)}
            />
          ))}
        </CurrencyList>
      </Section>

      {/* Extra followed currencies (beyond the hero + majors) */}
      {extraWatchlist.length > 0 && (
        <Section title="دنبال‌شده‌ها">
          <CurrencyList>
            {extraWatchlist.map((code) => (
              <CurrencyRow
                key={code}
                code={code}
                quote={quotes.find((q) => q.currency === code)}
              />
            ))}
          </CurrencyList>
        </Section>
      )}

      {/* Compact converter teaser */}
      <Section title="مبدل سریع">
        <GroupedList>
          <SettingsRow
            title={
              usd
                ? `۱۰۰ دلار آمریکا = ${fmt(usd.priceToman * 100, 0)} ${unit}`
                : "تبدیل هوشمند با نرخ بازار آزاد"
            }
            icon="swap-horizontal"
            iconColor={t.green}
            value=""
            onPress={() => router.push("/converter")}
            accessory="chevron"
          />
        </GroupedList>
      </Section>

      <View style={{ paddingHorizontal: spacing.xxs }}>
        <Label tertiary size={11} align="center" style={{ lineHeight: 17 }}>
          اطلاعات از شبکه اطلاع‌رسانی طلا و ارز (TGJU) دریافت می‌شود. نرخ‌های
          اعلام‌شده صرفاً جهت اطلاع‌رسانی بازار آزاد است و ممکن است در ساعات
          مختلف یا میان صرافی‌ها دارای نوسان باشد.
        </Label>
      </View>
    </Screen>
  );
}
