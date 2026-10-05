/**
 * Root stack.
 *
 * Screens that act as focused tasks (alerts, custom rate) present
 * as `formSheet`s — Apple's modal idiom — with the system sheet grabber. The
 * sheet corner radius comes from the design tokens (continuous geometry), and
 * the header uses the platform default back behavior (minimal, RTL-aware).
 */
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Appearance, I18nManager, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
// Per-weight subpaths: the package's main entry references all nine weights,
// which put three unused .ttf files (~380 KB) into the bundle.
import { useFonts } from "expo-font";
import { Vazirmatn_300Light } from "@expo-google-fonts/vazirmatn/300Light";
import { Vazirmatn_400Regular } from "@expo-google-fonts/vazirmatn/400Regular";
import { Vazirmatn_500Medium } from "@expo-google-fonts/vazirmatn/500Medium";
import { Vazirmatn_600SemiBold } from "@expo-google-fonts/vazirmatn/600SemiBold";
import { Vazirmatn_700Bold } from "@expo-google-fonts/vazirmatn/700Bold";
import { Vazirmatn_800ExtraBold } from "@expo-google-fonts/vazirmatn/800ExtraBold";
import { AppProvider, useApp } from "../src/store";
import { radii, useTheme } from "../src/ui";
import { setFontsAvailable } from "../src/design-system";

// ArzMan lays Persian out right-to-left *by hand*: every row is an explicit
// `row-reverse` and the tab order is reversed in code. If the system were also
// allowed to go RTL (an iPhone set to Persian, with "fa" in the bundle's
// localizations), iOS would mirror all of it a second time and put everything
// back on the wrong side. So the system direction is pinned to LTR.
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

function Navigation() {
  const t = useTheme();
  const appearance = useApp().user.settings.appearance;
  // Native views (Android's system bars and dialogs, iOS's native tab bar,
  // alerts and keyboards) follow the *system* scheme unless told otherwise, so
  // choosing «روشن» on a phone in dark mode left them dark. Hand the app's
  // choice to the platform; «خودکار» gives control back to the system.
  useEffect(() => {
    if (Platform.OS === "web") return;
    Appearance.setColorScheme(appearance === "system" ? "unspecified" : appearance);
  }, [appearance]);

  return (
    <>
      <StatusBar style={t.dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.background },
          headerTintColor: t.text,
          headerTitleStyle: { fontSize: 17, fontWeight: "600" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.background },
          headerBackButtonDisplayMode: "minimal",
          animation: Platform.OS === "ios" ? "default" : "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="currency/[code]"
          options={{ title: "جزئیات ارز", headerBackTitle: "بازار" }}
        />
        <Stack.Screen
          name="alerts"
          options={{
            title: "هشدارهای قیمت",
            presentation: "formSheet",
            sheetCornerRadius: radii.sheet,
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="custom-rates"
          options={{
            title: "نرخ من",
            presentation: "formSheet",
            sheetCornerRadius: radii.sheet,
            sheetGrabberVisible: true,
          }}
        />
      </Stack>
    </>
  );
}

export default function Layout() {
  // Bundled assets, so this resolves in a frame or two. Rendering before it
  // would draw every Persian string in the system font and then jump.
  const [fontsLoaded, fontError] = useFonts({
    Vazirmatn_300Light,
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_600SemiBold,
    Vazirmatn_700Bold,
    Vazirmatn_800ExtraBold,
  });
  // A font failure must never lock the user out: fall back to the system face.
  if (!fontsLoaded && !fontError) return null;
  setFontsAvailable(!fontError);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <Navigation />
      </AppProvider>
    </SafeAreaProvider>
  );
}
