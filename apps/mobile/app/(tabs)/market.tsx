/**
 * Markets — «بازار»
 *
 * iOS Stocks pattern: search first, then a scope control (همه / دنبال‌شده‌ها),
 * then one inset grouped list. Rows are pressable and navigate to detail.
 */
import { useState } from "react";
import { View } from "react-native";
import { fiatCodes, names, type Currency } from "@arzman/shared";
import { useApp } from "../../src/store";
import {
  CurrencyList,
  CurrencyRow,
  EmptyState,
  Label,
  MarketStatus,
  Screen,
  SearchField,
  SegmentedControl,
  spacing,
} from "../../src/ui";

const filters = ["all", "favorites"] as const;
type Filter = (typeof filters)[number];

const filterLabels: Record<Filter, string> = {
  all: "همه",
  favorites: "دنبال‌شده‌ها",
};

export default function Market() {
  const app = useApp();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const query = search.trim().toLowerCase();

  const filtered = fiatCodes.filter((code) => {
    if (filter === "favorites" && !app.user.watchlist.includes(code)) return false;
    if (!query) return true;
    return (
      code.toLowerCase().includes(query) ||
      names[code].toLowerCase().includes(query)
    );
  });

  return (
    <Screen
      title="بازار ارز"
      eyebrow="نرخ لحظه‌ای بازار آزاد ایران"
      refresh
    >
      <MarketStatus />

      {/* Search + scope (iOS search pattern) */}
      <View style={{ gap: spacing.xs }}>
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="جستجوی ارز (دلار، یورو، AED…)"
          onClear={() => setSearch("")}
        />
        <SegmentedControl
          values={filters}
          value={filter}
          onChange={setFilter}
          label={(v) => filterLabels[v]}
        />
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          title="ارزی یافت نشد"
          description={
            filter === "favorites"
              ? "هنوز هیچ ارزی به دنبال‌شده‌ها اضافه نکرده‌اید."
              : `هیچ ارزی مطابق با «${search}» پیدا نشد.`
          }
          icon={filter === "favorites" ? "star-outline" : "search"}
          action={
            filter === "favorites"
              ? { title: "بازگشت به همه ارزها", onPress: () => setFilter("all") }
              : undefined
          }
        />
      ) : (
        <CurrencyList>
          {filtered.map((code: Currency) => (
            <CurrencyRow
              key={code}
              code={code}
              quote={app.snapshot?.quotes.find((q) => q.currency === code)}
              showFavorite
            />
          ))}
        </CurrencyList>
      )}

      <View style={{ paddingHorizontal: spacing.xxs }}>
        <Label tertiary size={11} align="center">
          برای مشاهده نمودار و جزئیات هر ارز، ردیف مورد نظر را لمس کنید.
        </Label>
      </View>
    </Screen>
  );
}
