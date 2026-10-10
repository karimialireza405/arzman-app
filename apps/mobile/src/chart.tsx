import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import Svg, {
  Polyline,
  Polygon,
  Circle,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import {
  type Currency,
  type HistoricalPoint,
  formatNumber,
} from "@arzman/shared";
import { useHistoryResult } from "./history";
import { apiUrl, useApp } from "./store";
import {
  Card,
  Label,
  GlassSegmentedControl,
  MarketChangeBadge,
  useTheme,
} from "./ui";

const ranges = ["1H", "1D", "1W", "1M", "3M", "1Y"] as const;
type Range = (typeof ranges)[number];

// Six segments share ~340pt; "۱ ساعت" truncated. Stocks-style short labels.
const rangeLabels: Record<Range, string> = {
  "1H": "ساعت",
  "1D": "روز",
  "1W": "هفته",
  "1M": "ماه",
  "3M": "۳ ماه",
  "1Y": "سال",
};

const noPoints: HistoricalPoint[] = [];

export function ChartCard({ currency }: { currency: Currency }) {
  const t = useTheme();
  const app = useApp();
  const [range, setRange] = useState<Range>("1D");
  const [selected, setSelected] = useState<number>(0);
  const [width, setWidth] = useState(320);
  const history = useHistoryResult(currency, range, !!apiUrl);
  const points = history.points ?? noPoints;
  const loading = history.loading;
  const status = !apiUrl
    ? "سرویس تاریخچه متصل نیست"
    : loading
      ? "در حال دریافت تاریخچه…"
      : history.failed
        ? "تاریخچه در دسترس نیست"
        : points.length < 2
          ? "مشاهدات ثبت‌شده در این بازه هنوز به ۲ نقطه نرسیده است."
          : "";

  // A new series starts with its latest point selected.
  useEffect(() => {
    setSelected(Math.max(0, points.length - 1));
  }, [points]);

  const values = points.map((p) => p.priceToman);
  const min = points.length ? Math.min(...values) : 0;
  const max = points.length ? Math.max(...values) : 1;
  // Headroom above and below the line. When the price did not move at all the
  // raw spread is zero, and without a floor the line would sit on the bottom
  // edge and read as an empty chart; this centres it instead.
  const pad = Math.max((max - min) * 0.12, Math.abs(max) * 0.0015, 1e-9);
  const floor = min - pad;
  const spread = max + pad - floor;

  const start = points.length ? Date.parse(points[0].timestamp) : 0;
  const end = points.length
    ? Date.parse(points[points.length - 1].timestamp)
    : 1;
  const timeSpread = Math.max(1, end - start);

  const chartHeight = 180;
  const paddingH = 12;
  const paddingV = 16;
  const usableWidth = Math.max(10, width - paddingH * 2);
  const usableHeight = chartHeight - paddingV * 2;

  const x = (i: number) =>
    paddingH +
    ((Date.parse(points[i].timestamp) - start) / timeSpread) * usableWidth;

  const y = (i: number) =>
    chartHeight - paddingV - ((values[i] - floor) / spread) * usableHeight;

  // Stocks convention: green up, red down. A series that did not move is not
  // "up" — it gets the brand colour instead of a misleading green.
  const first = values[0];
  const last = values[values.length - 1];
  const strokeColor =
    points.length < 2 || last === first
      ? t.accent
      : last > first
        ? t.green
        : t.red;
  const fillColor = strokeColor;
  const periodPercent =
    points.length >= 2 && first > 0 ? ((last - first) / first) * 100 : null;

  const activePoint = points[selected] ?? points[points.length - 1];

  // Build SVG polygon for gradient fill
  const polylineCoords = points.map((_, i) => `${x(i)},${y(i)}`).join(" ");
  const polygonCoords = points.length
    ? `${x(0)},${chartHeight} ${polylineCoords} ${x(points.length - 1)},${chartHeight}`
    : "";

  return (
    <Card style={{ padding: 18, gap: 14 }}>
      {/* Title and the change over the selected range. */}
      <View
        style={{
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Label size={17} weight="700">
          نمودار قیمت
        </Label>
        {loading ? (
          <ActivityIndicator size="small" color={t.accent} />
        ) : periodPercent !== null ? (
          <MarketChangeBadge value={periodPercent} size="small" />
        ) : null}
      </View>

      <GlassSegmentedControl
        values={ranges}
        value={range}
        onChange={setRange}
        label={(r) => rangeLabels[r]}
        size="compact"
      />

      {/* Scrub readout: the touched observation, compact and unboxed. */}
      {activePoint && points.length >= 2 ? (
        <View
          style={{
            flexDirection: "row-reverse",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "baseline",
              gap: 5,
            }}
          >
            <Label
              size={20}
              weight="700"
              tabular
              style={{ writingDirection: "ltr" }}
            >
              {formatNumber(
                activePoint.priceToman *
                  (app.user.settings.unit === "IRR" ? 10 : 1),
                app.user.settings.persian,
                2,
              )}
            </Label>
            <Label secondary size={13} weight="500">
              {app.user.settings.unit === "IRR" ? "ریال" : "تومان"}
            </Label>
          </View>
          <Label tertiary size={12}>
            {range === "1H" || range === "1D"
              ? new Date(activePoint.timestamp).toLocaleTimeString(
                  app.user.settings.persian ? "fa-IR" : "en-US",
                  { hour: "2-digit", minute: "2-digit" },
                )
              : new Date(activePoint.timestamp).toLocaleDateString(
                  app.user.settings.persian ? "fa-IR" : "en-US",
                  { month: "long", day: "numeric" },
                )}
          </Label>
        </View>
      ) : null}

      {/* 3. Stocks-Style Chart Graphic */}
      {points.length >= 2 ? (
        <View
          accessibilityLabel="نمودار روند قیمت؛ برای مرور بازه، انگشت خود را روی نمودار بکشید"
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            const locX = e.nativeEvent.locationX;
            const targetTime =
              start +
              Math.max(0, Math.min(1, (locX - paddingH) / usableWidth)) *
                timeSpread;
            let closestIdx = 0;
            let minDiff = Infinity;
            for (let i = 0; i < points.length; i++) {
              const diff = Math.abs(
                Date.parse(points[i].timestamp) - targetTime,
              );
              if (diff < minDiff) {
                minDiff = diff;
                closestIdx = i;
              }
            }
            setSelected(closestIdx);
            app.haptic();
          }}
          onResponderMove={(e) => {
            const locX = e.nativeEvent.locationX;
            const targetTime =
              start +
              Math.max(0, Math.min(1, (locX - paddingH) / usableWidth)) *
                timeSpread;
            let closestIdx = 0;
            let minDiff = Infinity;
            for (let i = 0; i < points.length; i++) {
              const diff = Math.abs(
                Date.parse(points[i].timestamp) - targetTime,
              );
              if (diff < minDiff) {
                minDiff = diff;
                closestIdx = i;
              }
            }
            if (closestIdx !== selected) {
              setSelected(closestIdx);
              app.haptic();
            }
          }}
          style={{ width: "100%", height: chartHeight }}
        >
          <Svg width={width} height={chartHeight}>
            <Defs>
              <LinearGradient
                id="chartAreaGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <Stop offset="0%" stopColor={fillColor} stopOpacity={0.28} />
                <Stop offset="85%" stopColor={fillColor} stopOpacity={0.02} />
                <Stop offset="100%" stopColor={fillColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {/* Subtle horizontal grid lines */}
            <Line
              x1={paddingH}
              y1={paddingV}
              x2={width - paddingH}
              y2={paddingV}
              stroke={t.lineSubtle}
              strokeWidth={1}
            />
            <Line
              x1={paddingH}
              y1={chartHeight / 2}
              x2={width - paddingH}
              y2={chartHeight / 2}
              stroke={t.lineSubtle}
              strokeWidth={1}
            />
            <Line
              x1={paddingH}
              y1={chartHeight - paddingV}
              x2={width - paddingH}
              y2={chartHeight - paddingV}
              stroke={t.lineSubtle}
              strokeWidth={1}
            />

            {/* Gradient Area Fill under Curve */}
            <Polygon points={polygonCoords} fill="url(#chartAreaGradient)" />

            {/* Main Trend Line */}
            <Polyline
              points={polylineCoords}
              fill="none"
              stroke={strokeColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Vertical Hairline Scrubber Crosshair */}
            {activePoint && (
              <>
                <Line
                  x1={x(selected)}
                  y1={paddingV}
                  x2={x(selected)}
                  y2={chartHeight - paddingV}
                  stroke={t.textSecondary}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
                <Circle
                  cx={x(selected)}
                  cy={y(selected)}
                  r={8}
                  fill={t.dark ? "#000000" : "#FFFFFF"}
                />
                <Circle
                  cx={x(selected)}
                  cy={y(selected)}
                  r={5}
                  fill={strokeColor}
                />
              </>
            )}
          </Svg>
        </View>
      ) : (
        <View
          style={{
            height: 140,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
            gap: 6,
          }}
        >
          <Label secondary size={13} style={{ textAlign: "center" }}>
            {status || "مشاهدات واقعی کافی برای ترسیم نمودار ثبت نشده است."}
          </Label>
          <Label tertiary size={11} style={{ textAlign: "center" }}>
            نمودار ارز من بر اساس داده‌های دریافت و تأییدشده است و قیمت ساختگی
            تولید نمی‌کند.
          </Label>
        </View>
      )}

      {/* 4. Truthful Disclosure */}
      <Label tertiary size={11} style={{ textAlign: "center" }}>
        فقط مشاهدات ثبت‌شده؛ هیچ نقطه‌ای ساخته یا درون‌یابی نمی‌شود.
      </Label>
    </Card>
  );
}
