import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";
import {
  CurrencySchema,
  fiatCodes,
  names,
  PriceAlertSchema,
  parseAmount,
  formatNumber,
  type Currency,
  type PriceAlert,
} from "@arzman/shared";
import { useApp } from "../src/store";
import {
  Screen,
  Card,
  GlassSegmentedControl,
  AmountInput,
  GlassButton,
  Label,
  EmptyState,
  useTheme,
  radii,
} from "../src/ui";

const labels: Record<PriceAlert["kind"], string> = {
  above: "افزایش به بالاتر از",
  below: "کاهش به پایین‌تر از",
  percent: "تغییر روزانه بیش از",
  rapid: "حرکت سریع ۵ دقیقه‌ای",
};

const shortKindLabels: Record<PriceAlert["kind"], string> = {
  above: "بالاتر از",
  below: "پایین‌تر از",
  percent: "نوسان ٪",
  rapid: "جهش ۵دقیقه",
};

export default function Alerts() {
  const app = useApp();
  const t = useTheme();
  const params = useLocalSearchParams<{ currency?: string }>();

  const [currency, setCurrency] = useState<Currency>(
    CurrencySchema.safeParse(params.currency).success
      ? (params.currency as Currency)
      : "USD",
  );
  const [kind, setKind] = useState<PriceAlert["kind"]>("above");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const kinds = ["above", "below", "percent", "rapid"] as const;

  const handleCreate = () => {
    try {
      const alert = PriceAlertSchema.parse({
        id: String(Date.now()),
        currency,
        kind,
        threshold: parseAmount(amount),
        enabled: true,
        triggeredAt: null,
      });
      app.updateUser((u) => ({ ...u, alerts: [...u.alerts, alert] }));
      app.haptic();
      setAmount("");
      setError("");
    } catch {
      setError("لطفاً آستانهٔ عددی مثبت و معتبر وارد نمایید");
    }
  };

  return (
    <Screen title="هشدارهای قیمت" eyebrow="نظارت لحظه‌ای بر بازار">
      {/* 1. Honest Foreground Capability Note */}
      <Card
        style={{
          padding: 16,
          gap: 6,
          backgroundColor: t.dark
            ? "rgba(255, 214, 10, 0.12)"
            : "rgba(255, 149, 0, 0.1)",
          borderColor: t.amber,
        }}
      >
        <Label size={13} weight="700" amber>
          نحوهٔ عملکرد هشدارها در نسخه فعلی
        </Label>
        <Label secondary size={12} style={{ lineHeight: 18 }}>
          هشدارها هنگام باز بودن برنامه و بر اساس نرخ‌های دارای مهر زمانی معتبر
          بررسی می‌شوند. ارسال اعلان پس از بستن برنامه به زیرساخت پوش سرور نیاز دارد و
          در این نسخه فعال نیست.
        </Label>
      </Card>

      {/* 2. Create Alert Form */}
      <Card elevated style={{ padding: 20, gap: 16 }}>
        <Label size={17} weight="700">
          ایجاد هشدار هوشمند جدید
        </Label>

        {/* Currency Selection */}
        <View style={{ gap: 6 }}>
          <Label secondary size={13} weight="600">
            انتخاب ارز:
          </Label>
          <GlassSegmentedControl
            values={fiatCodes}
            value={currency}
            onChange={setCurrency}
          />
        </View>

        {/* Condition Type Selection */}
        <View style={{ gap: 6 }}>
          <Label secondary size={13} weight="600">
            شرط فعال‌سازی:
          </Label>
          <GlassSegmentedControl
            values={kinds}
            value={kind}
            onChange={setKind}
            label={(k) => shortKindLabels[k]}
          />
        </View>

        {/* Threshold Input */}
        <AmountInput
          label={
            kind === "above" || kind === "below"
              ? "آستانه قیمت · تومان"
              : "آستانه درصد تغییر"
          }
          value={amount}
          onChangeText={setAmount}
          placeholder="۰"
          unit={kind === "above" || kind === "below" ? "تومان" : "٪"}
        />

        {kind === "rapid" && (
          <Label tertiary size={11}>
            شرط حرکت سریع: مقایسهٔ قیمت دریافتی با استعلام قبلی در بازهٔ حداکثر پنج دقیقه.
          </Label>
        )}

        {!!error && (
          <Label red size={13}>
            {error}
          </Label>
        )}

        <GlassButton
          title="افزودن به هشدارهای فعال"
          icon="notifications"
          variant="prominent"
          size="large"
          disabled={!app.ready || !!app.storageError || !amount}
          onPress={handleCreate}
        />
      </Card>

      {/* 3. Existing Alerts List */}
      <Label size={17} weight="700">
        هشدارهای ثبت‌شده ({formatNumber(app.user.alerts.length, app.user.settings.persian)})
      </Label>

      {app.user.alerts.length === 0 ? (
        <EmptyState
          title="هشداری وجود ندارد"
          description="با تعیین آستانه و نوع شرط، تغییرات قیمت ارزها را زیر نظر بگیرید."
          icon="notifications-outline"
        />
      ) : (
        <View style={{ gap: 10 }}>
          {app.user.alerts.map((a) => {
            const isTriggered = !!a.triggeredAt;
            const isEnabled = a.enabled;

            return (
              <Card key={a.id} style={{ padding: 16, gap: 12 }}>
                <View
                  style={{
                    flexDirection: "row-reverse",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ gap: 2 }}>
                    <Label size={16} weight="700">
                      {names[a.currency]} ({a.currency})
                    </Label>
                    <Label secondary size={13}>
                      {labels[a.kind]}{" "}
                      {formatNumber(a.threshold, app.user.settings.persian)}{" "}
                      {a.kind === "above" || a.kind === "below" ? "تومان" : "٪"}
                    </Label>
                  </View>

                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: radii.pill,
                      backgroundColor: isTriggered
                        ? t.redGlass
                        : isEnabled
                          ? t.greenGlass
                          : t.raised,
                    }}
                  >
                    <Label
                      size={11}
                      weight="700"
                      style={{
                        color: isTriggered
                          ? t.redText
                          : isEnabled
                            ? t.greenText
                            : t.textTertiary,
                      }}
                    >
                      {isTriggered
                        ? "فعال‌شده"
                        : isEnabled
                          ? "در حال پایش"
                          : "متوقف"}
                    </Label>
                  </View>
                </View>

                {/* Actions */}
                <View
                  style={{
                    flexDirection: "row-reverse",
                    gap: 8,
                    paddingTop: 4,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: t.lineSubtle,
                  }}
                >
                  <GlassButton
                    title={
                      isTriggered
                        ? "فعال‌سازی مجدد"
                        : isEnabled
                          ? "توقف موقت"
                          : "فعال‌سازی"
                    }
                    size="small"
                    variant="regular"
                    style={{ flex: 1 }}
                    onPress={() =>
                      app.updateUser((u) => ({
                        ...u,
                        alerts: u.alerts.map((item) =>
                          item.id === a.id
                            ? {
                                ...item,
                                enabled: isTriggered ? true : !item.enabled,
                                triggeredAt: null,
                              }
                            : item,
                        ),
                      }))
                    }
                  />

                  <GlassButton
                    title="حذف"
                    icon="close-outline"
                    size="small"
                    variant="quiet"
                    onPress={() =>
                      app.updateUser((u) => ({
                        ...u,
                        alerts: u.alerts.filter((item) => item.id !== a.id),
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
