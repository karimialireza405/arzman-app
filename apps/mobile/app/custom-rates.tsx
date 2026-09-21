import { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  parseAmount,
  CustomRateSchema,
  names,
  formatNumber,
} from "@arzman/shared";
import { useApp } from "../src/store";
import {
  Screen,
  Card,
  GlassSegmentedControl,
  AmountInput,
  GlassButton,
  Label,
  Price,
  MarketChangeBadge,
  useTheme,
  radii,
} from "../src/ui";

const customCurrencyOptions = ["USD", "EUR", "AED", "IQD", "USDT"] as const;

export default function CustomRates() {
  const app = useApp();
  const t = useTheme();

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
      app.haptic();
      setAmount("");
      setError("");
    } catch {
      setError("لطفاً نرخ معتبر و مثبت به تومان وارد نمایید");
    }
  };

  return (
    <Screen title="نرخ من" eyebrow="تعیین نرخ صرافی یا توافقی شما">
      {/* 1. Explanatory Banner */}
      <Card
        style={{
          padding: 16,
          gap: 6,
          backgroundColor: t.dark
            ? "rgba(10, 132, 255, 0.12)"
            : "rgba(0, 122, 255, 0.08)",
          borderColor: t.accent,
        }}
      >
        <Label size={13} weight="700" accent>
          نرخ اختصاصی و ارزش‌گذاری تتر
        </Label>
        <Label secondary size={12} style={{ lineHeight: 18 }}>
          اگر با صرافی مشخصی معامله می‌کنید یا برای تتر (USDT) نرخ شخصی دارید، نرخ
          تومانی آن را در این بخش ثبت کنید تا در بخش دارایی و مبدل مورد استفاده قرار گیرد.
        </Label>
      </Card>

      {/* 2. Custom Rate Entry Form */}
      <Card elevated style={{ padding: 20, gap: 16 }}>
        <Label size={17} weight="700">
          ثبت یا ویرایش نرخ دستی
        </Label>

        <View style={{ gap: 6 }}>
          <Label secondary size={13} weight="600">
            انتخاب دارایی:
          </Label>
          <GlassSegmentedControl
            values={customCurrencyOptions}
            value={currency}
            onChange={setCurrency}
            label={(c) => (c === "USDT" ? "تتر" : c)}
          />
        </View>

        <AmountInput
          label={`قیمت هر ۱ ${names[currency]} (تومان)`}
          value={amount}
          onChangeText={setAmount}
          placeholder="۰"
          unit="تومان"
        />

        {!!error && (
          <Label red size={13}>
            {error}
          </Label>
        )}

        <GlassButton
          title="ذخیره نرخ دستی"
          icon="check"
          variant="prominent"
          size="large"
          disabled={!app.ready || !!app.storageError || !amount}
          onPress={handleSave}
        />
      </Card>

      {/* 3. Existing Custom Rates */}
      <Label size={17} weight="700">
        نرخ‌های دستی فعال ({formatNumber(app.user.customRates.length, app.user.settings.persian)})
      </Label>

      {app.user.customRates.length === 0 ? (
        <Card style={{ padding: 24, alignItems: "center", gap: 8 }}>
          <Label secondary size={13}>
            هنوز نرخ دستی برای دارایی‌ها ثبت نشده است.
          </Label>
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {app.user.customRates.map((rate) => {
            const market = app.snapshot?.quotes.find(
              (q) => q.currency === rate.currency,
            );

            const spreadDiff = market ? rate.priceToman - market.priceToman : null;
            const spreadPct = market
              ? (rate.priceToman / market.priceToman - 1) * 100
              : null;

            return (
              <Card key={rate.currency} style={{ padding: 18, gap: 12 }}>
                <View
                  style={{
                    flexDirection: "row-reverse",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ gap: 2 }}>
                    <Label size={17} weight="700">
                      {names[rate.currency]} ({rate.currency})
                    </Label>
                    <Label secondary size={11}>
                      ثبت: {new Date(rate.updatedAt).toLocaleString("fa-IR")}
                    </Label>
                  </View>

                  <Price value={rate.priceToman} />
                </View>

                {market && spreadDiff !== null && (
                  <View
                    style={{
                      flexDirection: "row-reverse",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: t.raised,
                      padding: 10,
                      borderRadius: radii.control,
                    }}
                  >
                    <Label secondary size={12}>
                      اختلاف با بازار آزاد ({formatNumber(market.priceToman, app.user.settings.persian)}):
                    </Label>
                    <View
                      style={{
                        flexDirection: "row-reverse",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Label size={12} weight="600" tabular>
                        {spreadDiff > 0 ? "+" : ""}
                        {formatNumber(spreadDiff, app.user.settings.persian)} تومان
                      </Label>
                      <MarketChangeBadge value={spreadPct} size="small" />
                    </View>
                  </View>
                )}

                <View
                  style={{
                    flexDirection: "row-reverse",
                    justifyContent: "flex-end",
                    paddingTop: 4,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: t.lineSubtle,
                  }}
                >
                  <GlassButton
                    title="حذف نرخ دستی"
                    icon="close-outline"
                    variant="quiet"
                    size="small"
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
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
