/**
 * Custom rates — «نرخ من» (modal sheet).
 *
 * Personal broker/USDT rate entry, compared honestly with the open market.
 */
import { useState } from "react";
import { View } from "react-native";
import {
  parseAmount,
  CustomRateSchema,
  names,
  formatNumber,
} from "@arzman/shared";
import { useApp } from "../src/store";
import {
  AmountInput,
  AppIcon,
  Button,
  ChangePill,
  CurrencyBadge,
  EmptyState,
  GroupedList,
  Label,
  Screen,
  Section,
  SegmentedControl,
  Surface,
  spacing,
  useFeedback,
  useTheme,
} from "../src/ui";

const customCurrencyOptions = ["USD", "EUR", "AED", "IQD", "USDT"] as const;

export default function CustomRates() {
  const app = useApp();
  const t = useTheme();
  const feedback = useFeedback();

  const [currency, setCurrency] = useState<(typeof customCurrencyOptions)[number]>("USDT");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    try {
      const rate = CustomRateSchema.parse({
        currency,
        priceToman: parseAmount(amount),
        updatedAt: new Date().toISOString(),
      });
      app.updateUser((u) => ({
        ...u,
        customRates: [
          ...u.customRates.filter((r) => r.currency !== currency),
          rate,
        ],
      }));
      feedback.success();
      setAmount("");
      setError("");
    } catch {
      setError("لطفاً نرخ معتبر و مثبت به تومان وارد نمایید");
    }
  };

  return (
    <Screen title="نرخ من" eyebrow="تعیین نرخ صرافی یا توافقی شما" floatingTabBar={false}>
      <Surface
        style={{
          flexDirection: "row-reverse",
          gap: spacing.xs,
          alignItems: "flex-start",
          backgroundColor: t.accentFill,
        }}
      >
        <AppIcon name="info" size={18} color={t.accent} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Label size={13} weight="600" accent>
            نرخ اختصاصی و ارزش‌گذاری تتر
          </Label>
          <Label secondary size={12} style={{ lineHeight: 18 }}>
            اگر با صرافی مشخصی معامله می‌کنید یا برای تتر نرخ شخصی دارید، نرخ
            تومانی آن را ثبت کنید تا در دارایی و مبدل استفاده شود.
          </Label>
        </View>
      </Surface>

      <Section title="ثبت یا ویرایش نرخ دستی">
        <Surface style={{ gap: spacing.sm }}>
          <View style={{ gap: spacing.xxs }}>
            <Label secondary size={13} weight="600">انتخاب دارایی</Label>
            <SegmentedControl
              values={customCurrencyOptions}
              value={currency}
              onChange={setCurrency}
              label={(c) => (c === "USDT" ? "تتر" : names[c])}
              size="compact"
            />
          </View>

          <AmountInput
            label={`قیمت هر ۱ ${names[currency]}`}
            value={amount}
            onChangeText={setAmount}
            unit="تومان"
          />

          {!!error && <Label red size={13}>{error}</Label>}

          <Button
            title="ذخیره نرخ دستی"
            icon="check"
            variant="prominent"
            size="large"
            fullWidth
            disabled={!app.ready || !!app.storageError || !amount}
            onPress={handleSave}
          />
        </Surface>
      </Section>

      <Section
        title="نرخ‌های فعال"
        subtitle={`${formatNumber(app.user.customRates.length, app.user.settings.persian)} نرخ ثبت‌شده`}
      >
        {app.user.customRates.length === 0 ? (
          <Surface>
            <EmptyState
              title="نرخ دستی ثبت نشده است"
              description="نخستین نرخ توافقی خود را در فرم بالا ثبت کنید."
              icon="pricetag-outline"
            />
          </Surface>
        ) : (
          <GroupedList separatorInset={66}>
            {app.user.customRates.map((rate) => {
              const market = app.snapshot?.quotes.find(
                (q) => q.currency === rate.currency,
              );
              const spreadDiff = market ? rate.priceToman - market.priceToman : null;
              const spreadPct = market
                ? (rate.priceToman / market.priceToman - 1) * 100
                : null;
              return (
                <View
                  key={rate.currency}
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    gap: spacing.xxs,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      gap: spacing.xs,
                    }}
                  >
                    <CurrencyBadge code={rate.currency} size="md" dark={t.dark} />
                    <View style={{ flex: 1, gap: 1 }}>
                      <Label size={16} weight="600">
                        {names[rate.currency]}
                      </Label>
                      <Label tertiary size={11} allowFontScaling={false}>
                        ثبت: {new Date(rate.updatedAt).toLocaleString("fa-IR")}
                      </Label>
                    </View>
                    <Label
                      allowFontScaling={false}
                      style={{
                        fontSize: 17,
                        lineHeight: 22,
                        fontWeight: "600",
                        fontVariant: ["tabular-nums"],
                        writingDirection: "ltr",
                      }}
                    >
                      {formatNumber(rate.priceToman, app.user.settings.persian, 0)}
                    </Label>
                  </View>

                  {market && spreadDiff !== null ? (
                    <View
                      style={{
                        flexDirection: "row-reverse",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingStart: 50,
                      }}
                    >
                      <Label tertiary size={11} allowFontScaling={false}>
                        اختلاف با بازار ({formatNumber(market.priceToman, app.user.settings.persian, 0)})
                      </Label>
                      <View
                        style={{ flexDirection: "row-reverse", alignItems: "center", gap: spacing.xxs }}
                      >
                        <Label
                          size={12}
                          weight="600"
                          allowFontScaling={false}
                          style={{ fontVariant: ["tabular-nums"], writingDirection: "ltr" }}
                        >
                          {spreadDiff > 0 ? "+" : ""}
                          {formatNumber(spreadDiff, app.user.settings.persian, 0)}
                        </Label>
                        <ChangePill value={spreadPct} size="small" />
                      </View>
                    </View>
                  ) : null}

                  <View style={{ flexDirection: "row-reverse", paddingStart: 50 }}>
                    <Button
                      title="حذف نرخ دستی"
                      variant="plain"
                      size="small"
                      textStyle={{ color: t.red }}
                      onPress={() =>
                        app.updateUser((u) => ({
                          ...u,
                          customRates: u.customRates.filter(
                            (r) => r.currency !== rate.currency,
                          ),
                        }))
                      }
                    />
                  </View>
                </View>
              );
            })}
          </GroupedList>
        )}
      </Section>
    </Screen>
  );
}
