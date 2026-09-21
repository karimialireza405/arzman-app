import { Alert, Platform, Switch, View, Linking, StyleSheet } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";
import { useApp } from "../../src/store";
import {
  Screen,
  Card,
  GlassButton,
  Label,
  GlassSegmentedControl,
  Section,
  AppIcon,
  useTheme,
  radii,
  concentricRadius,
} from "../../src/ui";

export default function More() {
  const app = useApp();
  const t = useTheme();
  const settings = app.user.settings;

  const update = (next: Partial<typeof settings>) =>
    app.updateUser((u) => ({ ...u, settings: { ...u.settings, ...next } }));

  const togglePrivacy = async () => {
    if (Platform.OS === "web") {
      Alert.alert("نیاز به دستگاه", "قفل حریم خصوصی در نسخهٔ وب فعال نمی‌شود");
      return;
    }
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "تغییر وضعیت قفل بیومتریک دارایی",
      });
      if (result.success) {
        update({ privacy: !settings.privacy });
        app.haptic();
      }
    } catch {
      Alert.alert("احراز هویت", "احراز هویت دستگاه در دسترس نیست");
    }
  };

  return (
    <Screen title="تنظیمات" eyebrow="شخصی‌سازی و حریم خصوصی">
      {/* 1. Quick Navigation Shortcuts */}
      <Card style={{ padding: 14, gap: 10 }}>
        <GlassButton
          title="تنظیم هشدارهای قیمت"
          icon="notifications-outline"
          variant="regular"
          onPress={() => router.push("/alerts")}
        />
        <GlassButton
          title="مدیریت نرخ من (تتر و نرخ‌های دستی)"
          icon="pricetag-outline"
          variant="regular"
          onPress={() => router.push("/custom-rates")}
        />
      </Card>

      {/* 2. Display & Formatting Preferences */}
      <Section title="نمایش و قالب‌بندی">
        <Card style={{ padding: 18, gap: 14 }}>
          {/* Unit selection */}
          <View style={{ gap: 6 }}>
            <Label secondary size={13} weight="600">
              واحد پیش‌فرض مبالغ بازار
            </Label>
            <GlassSegmentedControl
              values={["IRT", "IRR"] as const}
              value={settings.unit}
              onChange={(unit) => update({ unit })}
              label={(v) => (v === "IRT" ? "تومان (پیش‌فرض)" : "ریال")}
            />
          </View>

          {/* Theme selection */}
          <View style={{ gap: 6 }}>
            <Label secondary size={13} weight="600">
              حالت ظاهری برنامه (پوسته)
            </Label>
            <GlassSegmentedControl
              values={["dark", "light", "system"] as const}
              value={settings.appearance}
              onChange={(appearance) => update({ appearance })}
              label={(v) => ({ dark: "تیره (OLED)", light: "روشن", system: "خودکار" })[v]}
            />
          </View>

          {/* Persian digits toggle */}
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 4,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: t.lineSubtle,
            }}
          >
            <View style={{ gap: 2 }}>
              <Label size={15} weight="600">
                نمایش اعداد به فرمت فارسی
              </Label>
              <Label secondary size={12}>
                نمایش ۱۲۳ به جای 123
              </Label>
            </View>
            <Switch
              accessibilityLabel="نمایش اعداد فارسی"
              value={settings.persian}
              onValueChange={(v) => {
                app.haptic();
                update({ persian: v });
              }}
              trackColor={{ false: t.raised, true: t.accent }}
            />
          </View>

          {/* Haptics toggle */}
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 4,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: t.lineSubtle,
            }}
          >
            <View style={{ gap: 2 }}>
              <Label size={15} weight="600">
                بازخورد لرزشی دکمه‌ها (Haptic)
              </Label>
              <Label secondary size={12}>
                لرزش‌های ظریف و طبیعی اپل هنگام تعامل
              </Label>
            </View>
            <Switch
              accessibilityLabel="بازخورد لمسی"
              value={settings.haptics}
              onValueChange={(v) => {
                app.haptic();
                update({ haptics: v });
              }}
              trackColor={{ false: t.raised, true: t.accent }}
            />
          </View>
        </Card>
      </Section>

      {/* 3. Data & Privacy */}
      <Section title="داده و حریم خصوصی">
        <Card style={{ padding: 18, gap: 14 }}>
          {/* Refresh polling rate */}
          <View style={{ gap: 6 }}>
            <Label secondary size={13} weight="600">
              دوره استعلام نرخ از سرویس هنگام باز بودن برنامه
            </Label>
            <GlassSegmentedControl
              values={["30", "60", "120", "300"] as const}
              value={String(settings.refresh) as "30" | "60" | "120" | "300"}
              onChange={(v) => update({ refresh: Number(v) as 30 | 60 | 120 | 300 })}
              label={(v) => `${v} ثانیه`}
            />
          </View>

          {/* Biometric privacy toggle button */}
          <View style={{ gap: 6 }}>
            <GlassButton
              title={
                settings.privacy
                  ? "غیرفعال کردن قفل Face ID دارایی"
                  : "فعال‌سازی قفل Face ID دارایی"
              }
              icon="lock-closed-outline"
              variant={settings.privacy ? "secondary" : "regular"}
              onPress={() => void togglePrivacy()}
            />
            <Label secondary size={11} style={{ lineHeight: 16 }}>
              در صورت فعال بودن، بخش دارایی من و ثبت تراکنش‌ها فقط با احراز هویت بیومتریک دستگاه باز می‌شود.
            </Label>
          </View>

          {/* Clear cache */}
          <View
            style={{
              paddingTop: 8,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: t.lineSubtle,
              gap: 8,
            }}
          >
            <GlassButton
              title="پاک کردن حافظهٔ کش بازار"
              icon="refresh"
              variant="quiet"
              onPress={() =>
                void app
                  .clearCache()
                  .then(() => Alert.alert("کش پاک شد", "داده‌های کش‌شده بازار با موفقیت تخلیه شدند."))
                  .catch(() => Alert.alert("خطا", "پاک کردن کش ناموفق بود."))
              }
            />
            <Label tertiary size={11} style={{ textAlign: "center" }}>
              {app.snapshot
                ? `آخرین دریافت سرور: ${new Date(app.snapshot.fetchedAt).toLocaleString(settings.persian ? "fa-IR" : "en-US")}`
                : "حافظه کش بازار خالی است"}
            </Label>
          </View>
        </Card>
      </Section>

      {/* 4. About Source & Architecture */}
      <Section title="دربارهٔ منبع و برنامه">
        <Card style={{ padding: 18, gap: 12 }}>
          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: concentricRadius(radii.card, 18, 10),
                backgroundColor: t.dark
                  ? "rgba(10, 132, 255, 0.18)"
                  : "rgba(0, 122, 255, 0.12)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <AppIcon name="sparkles" size={20} color={t.accent} />
            </View>
            <View style={{ gap: 2 }}>
              <Label size={16} weight="700">
                شبکه اطلاع‌رسانی طلا و ارز (TGJU)
              </Label>
              <Label secondary size={12}>
                منبع اصلی داده‌های بازار آزاد ایران
              </Label>
            </View>
          </View>

          <Label secondary size={12} style={{ lineHeight: 18 }}>
            سرویس سبک ابری ArzMan داده‌های عمومی صفحات TGJU را در چرخه‌های ۵ دقیقه‌ای استعلام،
            اعتبارسنجی و نرمال‌سازی می‌کند. اطلاعات با حفظ امنیت روی دستگاه کش می‌شوند.
          </Label>

          <GlassButton
            title="مشاهده تارنمای منبع (tgju.org)"
            icon="info"
            variant="quiet"
            size="small"
            onPress={() => void Linking.openURL("https://www.tgju.org")}
          />

          <View
            style={{
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: t.lineSubtle,
              paddingTop: 8,
              alignItems: "center",
              gap: 2,
            }}
          >
            <Label secondary size={12} weight="600">
              «ارز من» · نسخهٔ {Constants.expoConfig?.version ?? "0.1.0"}
            </Label>
            <Label tertiary size={10}>
              طراحی‌شده برای آیفون · با زبان طراحی Liquid Glass
            </Label>
          </View>
        </Card>
      </Section>
    </Screen>
  );
}
