import { useRef, useState } from "react";
import { Alert, Animated, Pressable, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import {
  convert,
  parseAmount,
  formatNumber,
  names,
  fiatCodes,
  type ConversionCurrency,
} from "@arzman/shared";
import {
  Screen,
  Card,
  AmountInput,
  GlassSegmentedControl,
  GlassButton,
  Label,
  MarketStatus,
  AppIcon,
  useTheme,
  radii,
  concentricRadius,
} from "../../src/ui";
import { useApp } from "../../src/store";

const codes = [...fiatCodes, "IRT", "IRR"] as const;

const currencyBadges: Record<ConversionCurrency, string> = {
  USD: "$",
  EUR: "€",
  AED: "د.إ",
  IQD: "ع.د",
  IRT: "تومان",
  IRR: "ریال",
};

export default function Converter() {
  const app = useApp();
  const t = useTheme();
  const params = useLocalSearchParams<{ from?: string }>();

  const [from, setFrom] = useState<ConversionCurrency>(
    codes.includes(params.from as ConversionCurrency)
      ? (params.from as ConversionCurrency)
      : "USD",
  );
  const [to, setTo] = useState<ConversionCurrency>("IRT");
  const [amount, setAmount] = useState("1");

  // Swap button animation
  const rotation = useRef(new Animated.Value(0)).current;

  const handleSwap = () => {
    app.haptic();
    Animated.spring(rotation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => rotation.setValue(0));

    setFrom(to);
    setTo(from);
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  let result: number | null = null;
  let singleRate: number | null = null;
  let error = "";

  const quotes = app.snapshot?.quotes ?? [];

  try {
    if (amount) {
      result = convert(parseAmount(amount), from, to, quotes);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "ورودی نامعتبر";
  }

  try {
    singleRate = convert(1, from, to, quotes);
  } catch {
    singleRate = null;
  }

  const copyResult = async () => {
    if (result !== null) {
      app.haptic();
      const textToCopy = `${formatNumber(result, false, 4)} ${names[to]}`;
      await Clipboard.setStringAsync(textToCopy);
      Alert.alert("کپی شد", `مبلغ «${textToCopy}» در حافظه کپی شد.`);
    }
  };

  return (
    <Screen title="مبدل ارز" eyebrow="تبدیل هوشمند با نرخ بازار آزاد">
      <MarketStatus />

      {/* 1. Source Currency Box */}
      <Card style={{ padding: 18, gap: 14 }}>
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
                width: 36,
                height: 36,
                borderRadius: concentricRadius(radii.card, 18, 10),
                backgroundColor: t.dark
                  ? "rgba(10, 132, 255, 0.2)"
                  : "rgba(0, 122, 255, 0.12)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Label size={13} weight="700" accent>
                {currencyBadges[from]}
              </Label>
            </View>
            <Label size={15} weight="700">
              ارز مبدأ: {names[from]}
            </Label>
          </View>

          <Label secondary size={12}>
            {from}
          </Label>
        </View>

        <GlassSegmentedControl
          values={codes}
          value={from}
          onChange={setFrom}
          label={(c) => (c === "IRT" ? "تومان" : c === "IRR" ? "ریال" : c)}
        />

        <AmountInput
          label={`مبلغ ورودی (${names[from]})`}
          value={amount}
          onChangeText={setAmount}
          placeholder="۱"
        />
      </Card>

      {/* Floating Center Swap Action */}
      <View
        style={{
          alignItems: "center",
          marginVertical: -6,
          zIndex: 10,
        }}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="جابه‌جایی ارز مبدأ و مقصد"
            onPress={handleSwap}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: t.dark
                ? "rgba(35, 40, 52, 0.95)"
                : "rgba(255, 255, 255, 0.98)",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: t.glassRim,
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: t.dark ? 0.4 : 0.15,
              shadowRadius: 8,
              elevation: 4,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <AppIcon name="swap-vertical" size={22} color={t.accent} />
          </Pressable>
        </Animated.View>
      </View>

      {/* 2. Destination Currency Box */}
      <Card style={{ padding: 18, gap: 14 }}>
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
                width: 36,
                height: 36,
                borderRadius: concentricRadius(radii.card, 18, 10),
                backgroundColor: t.dark
                  ? "rgba(48, 209, 88, 0.2)"
                  : "rgba(52, 199, 89, 0.12)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Label size={13} weight="700" green>
                {currencyBadges[to]}
              </Label>
            </View>
            <Label size={15} weight="700">
              ارز مقصد: {names[to]}
            </Label>
          </View>

          <Label secondary size={12}>
            {to}
          </Label>
        </View>

        <GlassSegmentedControl
          values={codes}
          value={to}
          onChange={setTo}
          label={(c) => (c === "IRT" ? "تومان" : c === "IRR" ? "ریال" : c)}
        />

        {/* Converted Output Display */}
        <View
          style={{
            backgroundColor: t.dark
              ? "rgba(25, 28, 36, 0.75)"
              : "rgba(235, 239, 246, 0.8)",
            padding: 16,
            borderRadius: radii.control,
            alignItems: "flex-end",
            gap: 4,
            borderWidth: 1,
            borderColor: t.line,
          }}
        >
          <Label secondary size={12}>
            مبلغ محاسبه‌شده:
          </Label>
          <Label
            size={32}
            weight="700"
            tabular
            style={{ writingDirection: "ltr", letterSpacing: -0.5 }}
          >
            {result === null
              ? "—"
              : formatNumber(result, app.user.settings.persian, 4)}
          </Label>
          <Label secondary size={13} weight="600">
            {names[to]}
          </Label>
        </View>

        {/* Live Exchange Rate Reference */}
        {singleRate !== null && (
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 4,
            }}
          >
            <Label secondary size={12}>
              نرخ تبدیل پایه:
            </Label>
            <Label size={12} weight="600" tabular style={{ writingDirection: "ltr" }}>
              ۱ {names[from]} = {formatNumber(singleRate, app.user.settings.persian, 4)}{" "}
              {names[to]}
            </Label>
          </View>
        )}

        {!!error && (
          <Label red size={13}>
            {error}
          </Label>
        )}

        {/* Actions */}
        <GlassButton
          title="کپی نتیجه محاسبه"
          icon="copy-outline"
          variant="prominent"
          disabled={result === null}
          onPress={() => void copyResult()}
        />
      </Card>

      {/* Information footer */}
      <View style={{ paddingHorizontal: 6, gap: 4, marginTop: 4 }}>
        <Label tertiary size={11} style={{ textAlign: "center", lineHeight: 17 }}>
          محاسبهٔ تبدیل بین دو ارز از نسبت مستقیم میانگین نرخ بازار آزاد ایران به دست می‌آید.
          این مبلغ خالص و بدون در نظر گرفتن کمیسیون یا کارمزد صرافی است.
        </Label>
      </View>
    </Screen>
  );
}
