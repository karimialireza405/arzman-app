/**
 * Home — «خانه»
 *
 * Layout follows Apple's priority order: the single benchmark quote first,
 * then the rest of the market. Secondary markets sit in one inset grouped list
 * instead of four equal-weight cards.
 */
import { View } from "react-native";
import { router } from "expo-router";
import { names } from "@arzman/shared";
import { useApp } from "../../src/store";
import {
  BrandHeader,
  CurrencyList,
  GroupedList,
  CurrencyRow,
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

const majorCurrencies = ["EUR", "AED", "GBP", "TRY", "IQD"] as const;

export default function Home() {
  const app = useApp();
  const t = useTheme();
  const fmt = usePrice();
  const unit = names[app.user.settings.unit];
  const quotes = app.snapshot?.quotes ?? [];

  // Followed currencies that are not already covered by the hero + majors.
  const extraWatchlist = app.user.watchlist.filter(
    (code) => !["USD", ...majorCurrencies].includes(code),
  );

  const usd = quotes.find((q) => q.currency === "USD");

  return (
    <Screen title="ArzMan" largeTitle={false} refresh>
      <BrandHeader tagline="نبض بازار آزاد، در دستان شما" onSearch={() => router.push("/market")} />

      <MarketStatus />

      <MarketHero />


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
