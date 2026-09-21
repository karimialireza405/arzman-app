import { useEffect, useState } from "react";
import { AppState, Platform, View } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import {
  AssetSchema,
  names,
  parseAmount,
  calculatePortfolio,
  PortfolioTransactionSchema,
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
  useTheme,
  radii,
} from "../src/ui";

const types = ["buy", "sell", "adjustment"] as const;
type TxType = (typeof types)[number];

const typeLabels: Record<TxType, string> = {
  buy: "خرید",
  sell: "فروش",
  adjustment: "اصلاح موجودی",
};

export default function Transaction() {
  const app = useApp();
  const t = useTheme();

  const [currency, setCurrency] = useState<typeof AssetSchema._output>("USD");
  const [kind, setKind] = useState<TxType>("buy");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const s = AppState.addEventListener("change", (state) => {
      if (state !== "active") setAuthorized(false);
    });
    return () => s.remove();
  }, []);

  if (app.user.settings.privacy && !authorized) {
    return (
      <Screen title="تأیید هویت" eyebrow="ثبت امن تراکنش دارایی">
        <Card style={{ padding: 24, gap: 16, alignItems: "center" }}>
          <Label size={18} weight="700">
            نیاز به احراز هویت دستگاه
          </Label>
          <Label secondary size={13} style={{ textAlign: "center" }}>
            برای دسترسی به بخش ثبت تراکنش دارایی، احراز هویت با Face ID یا رمز عبور دستگاه الزامی است.
          </Label>
          <GlassButton
            title="تأیید هویت"
            variant="prominent"
            size="large"
            onPress={() => {
              if (Platform.OS === "web") {
                setError("این قابلیت به دستگاه نیاز دارد");
                return;
              }
              void LocalAuthentication.authenticateAsync({
                promptMessage: "ثبت تراکنش دارایی",
              })
                .then((r) => setAuthorized(r.success))
                .catch(() => setError("احراز هویت انجام نشد"));
            }}
          />
          {!!error && (
            <Label red size={13}>
              {error}
            </Label>
          )}
        </Card>
      </Screen>
    );
  }

  let totalEstimatedToman: number | null = null;
  try {
    if (quantity && cost) {
      totalEstimatedToman = parseAmount(quantity) * parseAmount(cost);
    }
  } catch {
    totalEstimatedToman = null;
  }

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      const tx = PortfolioTransactionSchema.parse({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        currency,
        type: kind,
        quantity: parseAmount(quantity),
        costToman: parseAmount(cost),
        timestamp: new Date().toISOString(),
      });
      calculatePortfolio([...app.transactions, tx]);
      await app.saveTransaction(tx);
      app.haptic();
      router.back();
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes("م")
          ? e.message
          : "مقدار مثبت و بهای معتبر وارد کنید",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="ثبت تراکنش" eyebrow="مدیریت پورتفوی شخصی">
      <Card style={{ padding: 20, gap: 16 }}>
        {/* Type Segmented Control */}
        <View style={{ gap: 6 }}>
          <Label secondary size={13} weight="600">
            نوع عملیات مالی:
          </Label>
          <GlassSegmentedControl
            values={types}
            value={kind}
            onChange={setKind}
            label={(k) => typeLabels[k]}
          />
        </View>

        {/* Currency Selection */}
        <View style={{ gap: 6 }}>
          <Label secondary size={13} weight="600">
            انتخاب ارز:
          </Label>
          <GlassSegmentedControl
            values={AssetSchema.options}
            value={currency}
            onChange={setCurrency}
            label={(c) => (c === "IRT" ? "تومان" : c)}
          />
        </View>

        {/* Quantity Input */}
        <AmountInput
          label={
            kind === "adjustment"
              ? `موجودی کل جدید · ${names[currency]}`
              : `تعداد / حجم معامله · ${names[currency]}`
          }
          value={quantity}
          onChangeText={setQuantity}
          placeholder="۰"
          unit={currency}
        />

        {/* Unit Cost Input */}
        <AmountInput
          label={
            kind === "adjustment"
              ? "میانگین بهای خرید جدید هر واحد (تومان)"
              : "قیمت هر واحد (تومان)"
          }
          value={cost}
          onChangeText={setCost}
          placeholder="۰"
          unit="تومان"
        />

        {/* Total Price Live Calculation Box */}
        {totalEstimatedToman !== null && kind !== "adjustment" && (
          <View
            style={{
              backgroundColor: t.dark
                ? "rgba(25, 28, 36, 0.75)"
                : "rgba(235, 239, 246, 0.8)",
              padding: 14,
              borderRadius: radii.control,
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <Label secondary size={12}>
              ارزش کل این معامله:
            </Label>
            <Label size={15} weight="700" tabular>
              {formatNumber(totalEstimatedToman, app.user.settings.persian, 0)} تومان
            </Label>
          </View>
        )}

        {kind === "adjustment" && (
          <View
            style={{
              backgroundColor: t.raised,
              padding: 12,
              borderRadius: radii.control,
            }}
          >
            <Label secondary size={12}>
              در حالت اصلاح موجودی، میزان کل دارایی و میانگین خرید شما برای ارز {names[currency]} با این مقادیر بازنویسی و تنظیم می‌گردد.
            </Label>
          </View>
        )}

        {!!error && (
          <Label red size={13}>
            {error}
          </Label>
        )}

        <GlassButton
          title={saving ? "در حال ذخیره روی دستگاه…" : "ذخیره تراکنش در دارایی من"}
          icon="check"
          variant="prominent"
          size="large"
          loading={saving}
          disabled={saving || !app.ready || !!app.storageError}
          onPress={() => void save()}
        />
      </Card>

      <View style={{ paddingHorizontal: 6, gap: 4, marginTop: 4 }}>
        <Label tertiary size={11} style={{ textAlign: "center" }}>
          ثبت تراکنش‌ها فقط در حافظهٔ دستگاه انجام شده و روی میانگین خرید و سود/زیان محاسبه می‌شود.
        </Label>
      </View>
    </Screen>
  );
}
