/**
 * Markets — «بازار»
 *
 * iOS Stocks pattern: search first, then scope chips (همه / دنبال‌شده‌ها /
 * regions — 24 currencies need browsing aids), then one inset grouped list. Rows are pressable and navigate to detail.
 */
import { useState } from "react";
import { View } from "react-native";
import { fiatCodes, names, shortNames, type Currency } from "@arzman/shared";
import { useApp } from "../../src/store";
import {
  ChipRow,
  CurrencyList,
  CurrencyRow,
  EmptyState,
  Label,
  MarketStatus,
  Screen,
  SearchField,
  spacing,
} from "../../src/ui";

const filters = ["all", "favorites", "gulf", "west", "asia", "neighbors"] as const;
type Filter = (typeof filters)[number];

const filterLabels: Record<Filter, string> = {
  all: "همه",
  favorites: "دنبال‌شده‌ها",
  gulf: "عربی و خلیج فارس",
  west: "اروپا و آمریکا",
  asia: "آسیا و اقیانوسیه",
  neighbors: "همسایگان",
};

/** Regions are browsing aids; a currency may sit in more than one. */
const regions: Record<Exclude<Filter, "all" | "favorites">, readonly Currency[]> = {
  gulf: ["AED", "SAR", "QAR", "OMR", "KWD", "BHD", "IQD"],
  west: ["USD", "EUR", "GBP", "CHF", "CAD"],
  asia: ["CNY", "JPY", "INR", "MYR", "THB", "AUD"],
  neighbors: ["TRY", "IQD", "AFN", "AZN", "AMD", "RUB", "GEL"],
};

export default function Market() {
  const app = useApp();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const query = search.trim().toLowerCase();

  const filtered = fiatCodes.filter((code) => {
    if (filter === "favorites" && !app.user.watchlist.includes(code)) return false;
    if (filter !== "all" && filter !== "favorites" && !regions[filter].includes(code)) return false;
    if (!query) return true;
    return (
      code.toLowerCase().includes(query) ||
      names[code].toLowerCase().includes(query) ||
      shortNames[code].includes(query)
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
          placeholder="جستجوی ارز (دلار، پوند، لیر، AED…)"
          onClear={() => setSearch("")}
        />
        <ChipRow
          values={filters}
          value={filter}
          onChange={setFilter}
          label={(v) => filterLabels[v]}
          accessibilityLabel="دسته‌بندی ارزها"
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
