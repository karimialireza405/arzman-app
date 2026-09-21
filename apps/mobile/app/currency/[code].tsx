import { useLocalSearchParams, router } from "expo-router";
import { View, StyleSheet } from "react-native";
import { CurrencySchema, names } from "@arzman/shared";
import { useApp } from "../../src/store";
import {
  Screen,
  Card,
  Label,
  Price,
  MarketChangeBadge,
  SpreadBar,
  GlassButton,
  MarketStatus,
  EmptyState,
  useTheme,
  radii,
  concentricRadius,
} from "../../src/ui";
import { ChartCard } from "../../src/chart";

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  AED: "د.إ",
  IQD: "ع.د",
};

export default function Detail() {
  const params = useLocalSearchParams<{ code: string }>();
  const app = useApp();
  const t = useTheme();

  const result = CurrencySchema.safeParse(params.code);
  if (!result.success) {
    return (
      <Screen title="ارز نامعتبر">
        <EmptyState
          title="ارز پیدا نشد"
          description="کد ارز نامعتبر است. از فهرست بازار ارز مورد نظر را انتخاب کنید."
          icon="close-outline"
        />
      </Screen>
    );
  }

  const code = result.data;
  const q = app.snapshot?.quotes.find((item) => item.currency === code);
  const isFavorite = app.user.watchlist.includes(code);

  const toggleFavorite = () => {
    app.updateUser((u) => ({
      ...u,
      watchlist: isFavorite
        ? u.watchlist.filter((c) => c !== code)
        : [...u.watchlist, code],
    }));
  };

  return (
    <Screen
      title={names[code]}
      eyebrow={`${code} · بازار آزاد ایران`}
      refresh
    >
      <MarketStatus />

      {/* 1. Currency Price Hero Card */}
      <Card elevated style={{ padding: 20, gap: 16 }}>
        <View
          style={{
            flexDirection: "row-reverse",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Right in RTL: Icon and Title */}
          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: concentricRadius(radii.card, 20, 12),
                backgroundColor: t.dark
                  ? "rgba(40, 44, 56, 0.7)"
                  : "rgba(228, 233, 242, 0.85)",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: t.glassRim,
              }}
            >
              <Label size={20} weight="700" accent>
                {currencySymbols[code] || code}
              </Label>
            </View>

            <View style={{ gap: 2 }}>
              <Label size={18} weight="700">
                {names[code]}
              </Label>
              <Label secondary size={12}>
                کد استاندارد: {code}
              </Label>
            </View>
          </View>

          {/* Left in RTL: Change badge */}
          <MarketChangeBadge value={q?.changePercent} size="large" />
        </View>

        {/* Main Price Display */}
        <View
          style={{
            flexDirection: "row-reverse",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingTop: 4,
          }}
        >
          <Price value={q?.priceToman} large />
          {q?.change != null && (
            <View style={{ gap: 2, alignItems: "flex-start" }}>
              <Label secondary size={11}>
                تغییر روزانه:
              </Label>
              <Price value={q.change} />
            </View>
          )}
        </View>

        {/* Spread Bar */}
        {q && (
          <SpreadBar
            current={q.priceToman}
            low={q.lowToman}
            high={q.highToman}
          />
        )}
      </Card>

      {/* 2. Interactive Stocks-Style Chart */}
      <ChartCard currency={code} />

      {/* 3. Detailed Statistics Grid */}
      <Card style={{ padding: 18, gap: 14 }}>
        <Label size={17} weight="700">
          مشخصات معامله و منبع
        </Label>

        <View
          style={{
            flexDirection: "row-reverse",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* High */}
          <View
            style={{
              width: "47%",
              backgroundColor: t.raised,
              padding: 12,
              borderRadius: radii.control,
              gap: 4,
            }}
          >
            <Label secondary size={11}>
              بالاترین نرخ روز
            </Label>
            <Price value={q?.highToman} />
          </View>

          {/* Low */}
          <View
            style={{
              width: "47%",
              backgroundColor: t.raised,
              padding: 12,
              borderRadius: radii.control,
              gap: 4,
            }}
          >
            <Label secondary size={11}>
              پایین‌ترین نرخ روز
            </Label>
            <Price value={q?.lowToman} />
          </View>

          {/* Previous Close */}
          <View
            style={{
              width: "47%",
              backgroundColor: t.raised,
              padding: 12,
              borderRadius: radii.control,
              gap: 4,
            }}
          >
            <Label secondary size={11}>
              نرخ روز گذشته
            </Label>
            <Price value={q?.previousToman} />
          </View>

          {/* Time & Unit */}
          <View
            style={{
              width: "47%",
              backgroundColor: t.raised,
              padding: 12,
              borderRadius: radii.control,
              gap: 4,
            }}
          >
            <Label secondary size={11}>
              زمان ثبت نرخ در منبع
            </Label>
            <Label size={13} weight="600">
              {q?.sourceTimeLabel || "نامشخص"}
            </Label>
          </View>
        </View>

        <View
          style={{
            paddingTop: 8,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: t.lineSubtle,
            gap: 2,
          }}
        >
          <Label tertiary size={11}>
            واحد منبع: {q?.rawUnit === "IRR" ? "ریال" : "تومان"} برای {q?.quoteSize ?? 1} واحد {code}
          </Label>
          <Label tertiary size={11}>
            منبع اطلاعات: شبکه اطلاع‌رسانی طلا و ارز (TGJU)
          </Label>
        </View>
      </Card>

      {/* 4. Action Buttons */}
      <View style={{ gap: 10 }}>
        <GlassButton
          title={isFavorite ? "حذف از دنبال‌شده‌ها" : "افزودن به دنبال‌شده‌ها"}
          icon={isFavorite ? "star" : "star-outline"}
          variant={isFavorite ? "secondary" : "regular"}
          onPress={toggleFavorite}
        />

        <GlassButton
          title="تبدیل این ارز در مبدل"
          icon="swap-horizontal"
          variant="regular"
          onPress={() =>
            router.push({ pathname: "/converter", params: { from: code } })
          }
        />

        <GlassButton
          title="تنظیم هشدار قیمت"
          icon="notifications-outline"
          variant="regular"
          onPress={() =>
            router.push({ pathname: "/alerts", params: { currency: code } })
          }
        />

        <GlassButton
          title="ثبت خرید یا فروش در دارایی من"
          icon="add"
          variant="prominent"
          onPress={() => router.push("/transaction")}
        />
      </View>
    </Screen>
  );
}
