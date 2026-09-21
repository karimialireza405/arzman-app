import { useState } from "react";
import { View } from "react-native";
import { fiatCodes, names, type Currency } from "@arzman/shared";
import {
  Screen,
  MarketStatus,
  CurrencyRow,
  GlassSearchBar,
  GlassSegmentedControl,
  EmptyState,
  Label,
} from "../../src/ui";
import { useApp } from "../../src/store";

const filterTabs = ["all", "favorites"] as const;
type FilterTab = (typeof filterTabs)[number];

const filterLabels: Record<FilterTab, string> = {
  all: "همه ارزها",
  favorites: "دنبال‌شده‌ها",
};

export default function Market() {
  const app = useApp();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");

  const normalizedSearch = search.trim().toLowerCase();

  const filteredCodes = fiatCodes.filter((code) => {
    // 1. Filter by category
    if (filter === "favorites" && !app.user.watchlist.includes(code)) {
      return false;
    }

    // 2. Filter by search query
    if (normalizedSearch) {
      const codeMatch = code.toLowerCase().includes(normalizedSearch);
      const nameMatch = names[code].toLowerCase().includes(normalizedSearch);
      return codeMatch || nameMatch;
    }

    return true;
  });

  return (
    <Screen
      title="بازار ارز"
      eyebrow="نرخ لحظه‌ای بازار آزاد ایران"
      refresh
    >
      {/* Connectivity & Source Freshness Status */}
      <MarketStatus />

      {/* Floating Glass Search Bar */}
      <GlassSearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="جستجوی ارز (دلار، یورو، AED...)"
        onClear={() => setSearch("")}
      />

      {/* Segmented Filter (All vs Favorites) */}
      <GlassSegmentedControl
        values={filterTabs}
        value={filter}
        onChange={setFilter}
        label={(tab) => filterLabels[tab]}
      />

      {/* Filtered Currencies List */}
      {filteredCodes.length === 0 ? (
        <EmptyState
          title="ارزی یافت نشد"
          description={
            filter === "favorites"
              ? "هنوز هیچ ارزی به دنبال‌شده‌ها اضافه نکرده‌اید."
              : `هیچ ارزی مطابق با «${search}» پیدا نشد.`
          }
          icon={filter === "favorites" ? "star-outline" : "search"}
        />
      ) : (
        <View style={{ gap: 10 }}>
          {filteredCodes.map((code: Currency) => (
            <CurrencyRow
              key={code}
              code={code}
              quote={app.snapshot?.quotes.find((q) => q.currency === code)}
              showFavorite
            />
          ))}
        </View>
      )}

      {/* Helpful Hint */}
      <View style={{ paddingHorizontal: 6, gap: 4, marginTop: 4 }}>
        <Label secondary size={12} style={{ textAlign: "center" }}>
          برای مشاهده نمودار و جزئیات تکنیکال، هر ردیف را لمس کنید.
        </Label>
      </View>
    </Screen>
  );
}
