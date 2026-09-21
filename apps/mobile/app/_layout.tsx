/**
 * Root stack.
 *
 * Screens that act as focused tasks (alerts, custom rate, transaction) present
 * as `formSheet`s — Apple's modal idiom — with the system sheet grabber. The
 * sheet corner radius comes from the design tokens (continuous geometry), and
 * the header uses the platform default back behavior (minimal, RTL-aware).
 */
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nManager, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../src/store";
import { radii, useTheme } from "../src/ui";

I18nManager.allowRTL(true);

function Navigation() {
  const t = useTheme();

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
        <Stack.Screen
          name="transaction"
          options={{
            title: "ثبت تراکنش",
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
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Navigation />
      </AppProvider>
    </SafeAreaProvider>
  );
}
