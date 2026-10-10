/**
 * More — «بیشتر»
 *
 * iOS Settings pattern: grouped sections, rows with icons on the leading side,
 * switches for on/off preferences, segmented controls for small choice sets,
 * and a chevron only when a row navigates somewhere.
 */
import { Alert, Linking, Pressable, View } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { useApp } from "../../src/store";
import {
  AppIcon,
  Button,
  GroupedList,
  Label,
  Screen,
  Section,
  SegmentedControl,
  SettingsRow,
  Surface,
  SwitchRow,
  spacing,
  useTheme,
} from "../../src/ui";

/** A tappable developer contact in the footer; Latin text stays left-to-right. */
function ContactLink({
  icon,
  text,
  url,
}: {
  icon: string;
  text: string;
  url: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={text}
      hitSlop={8}
      onPress={() => void Linking.openURL(url)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <AppIcon name={icon} size={13} color={t.accent} />
      <Label
        accent
        size={12}
        weight="500"
        align="left"
        style={{ writingDirection: "ltr" }}
      >
        {text}
      </Label>
    </Pressable>
  );
}

export default function More() {
  const app = useApp();
  const t = useTheme();
  const settings = app.user.settings;

  const update = (next: Partial<typeof settings>) =>
    app.updateUser((u) => ({ ...u, settings: { ...u.settings, ...next } }));

  return (
    <Screen title="بیشتر" eyebrow="تنظیمات و منابع">
      {/* Shortcuts */}
      <Section title="ابزارها">
        <GroupedList>
          <SettingsRow
            title="هشدارهای قیمت"
            subtitle="نظارت لحظه‌ای روی آستانه‌های دلخواه"
            icon="notifications"
            iconColor={t.amber}
            onPress={() => router.push("/alerts")}
          />
          <SettingsRow
            title="نرخ من"
            subtitle="تتر و نرخ‌های توافقی شخصی"
            icon="pricetag"
            iconColor={t.accentSecondary}
            onPress={() => router.push("/custom-rates")}
          />
        </GroupedList>
      </Section>

      {/* Display & formatting */}
      <Section title="نمایش و قالب‌بندی">
        <GroupedList>
          <SettingsRow
            title="واحد پیش‌فرض"
            subtitle="نمایش مبالغ در سراسر برنامه"
            accessory="none"
          />
          <View
            style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.xs }}
          >
            <SegmentedControl
              values={["IRT", "IRR"] as const}
              value={settings.unit}
              onChange={(unit) => update({ unit })}
              label={(v) => (v === "IRT" ? "تومان" : "ریال")}
            />
          </View>

          <SettingsRow
            title="حالت ظاهری"
            subtitle="هماهنگ با دستگاه یا دستی"
            accessory="none"
          />
          <View
            style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.xs }}
          >
            <SegmentedControl
              values={["dark", "light", "system"] as const}
              value={settings.appearance}
              onChange={(appearance) => update({ appearance })}
              label={(v) =>
                ({ dark: "تیره", light: "روشن", system: "خودکار" })[v]
              }
            />
          </View>

          <SwitchRow
            title="اعداد فارسی"
            subtitle="نمایش ارقام ۰ تا ۹ به‌جای ارقام لاتین"
            value={settings.persian}
            onValueChange={(persian) => update({ persian })}
          />
        </GroupedList>
      </Section>

      {/* Device */}
      <Section title="دستگاه">
        <GroupedList>
          <SwitchRow
            title="لمس لرزشی (Haptics)"
            subtitle="بازخورد لمسی هنگام تعامل با کنترل‌ها"
            value={settings.haptics}
            onValueChange={(haptics) => update({ haptics })}
          />
        </GroupedList>
      </Section>

      {/* Data & cache */}
      <Section title="داده و منبع">
        <GroupedList>
          <SettingsRow
            title="به‌روزرسانی خودکار"
            subtitle="فاصلهٔ استعلام از سرویس بازار"
            accessory="none"
          />
          <View
            style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.xs }}
          >
            <SegmentedControl
              values={[30, 60, 120, 300] as const}
              value={settings.refresh}
              onChange={(refresh) => update({ refresh })}
              label={(v) => (v < 60 ? `${v}ث` : `${v / 60}د`)}
              size="compact"
            />
          </View>
          <SettingsRow
            title="پاک کردن حافظهٔ کش بازار"
            subtitle={
              app.snapshot
                ? `آخرین دریافت: ${new Date(app.snapshot.fetchedAt).toLocaleString(settings.persian ? "fa-IR" : "en-US")}`
                : "حافظهٔ کش خالی است"
            }
            icon="refresh"
            destructive
            onPress={() =>
              void app
                .clearCache()
                .then(() =>
                  Alert.alert("کش پاک شد", "داده‌های کش‌شده بازار تخلیه شدند."),
                )
                .catch(() => Alert.alert("خطا", "پاک کردن کش ناموفق بود."))
            }
          />
        </GroupedList>
      </Section>

      {/* About */}
      <Section title="درباره">
        <Surface style={{ gap: spacing.xs }}>
          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: spacing.xs,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Label size={15} weight="600">
                شبکه اطلاع‌رسانی طلا و ارز (TGJU)
              </Label>
              <Label secondary size={12}>
                منبع اصلی داده‌های بازار آزاد ایران
              </Label>
            </View>
          </View>
          <Label secondary size={12} style={{ lineHeight: 18 }}>
            سرویس ابری سبک ارز من داده‌های عمومی TGJU را در چرخه‌های منظم
            اعتبارسنجی، نرمال‌سازی و با حفظ امنیت روی دستگاه شما کش می‌کند.
          </Label>
          <View
            style={{ flexDirection: "row-reverse", justifyContent: "flex-end" }}
          >
            <Button
              title="مشاهدهٔ تارنمای منبع"
              variant="plain"
              size="small"
              onPress={() => void Linking.openURL("https://www.tgju.org")}
            />
          </View>
        </Surface>

        <View
          style={{ alignItems: "center", gap: 4, paddingVertical: spacing.xs }}
        >
          <Label secondary size={12} weight="600" align="center">
            «ارز من» · نسخهٔ {Constants.expoConfig?.version ?? "0.1.0"}
          </Label>
          <Label tertiary size={12} align="center">
            توسعه‌دهنده: علیرضا کریمی
          </Label>
          <ContactLink
            icon="logo-github"
            text="github.com/karimialireza405"
            url="https://github.com/karimialireza405"
          />
          <ContactLink
            icon="mail"
            text="alirezkarimi0021@gmail.com"
            url="mailto:alirezkarimi0021@gmail.com"
          />
        </View>
      </Section>
    </Screen>
  );
}
