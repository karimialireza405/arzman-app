import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nManager, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../src/store";
import { useTheme } from "../src/ui";

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
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: "700",
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.background },
          headerBackButtonDisplayMode: "minimal",
          animation: Platform.OS === "ios" ? "default" : "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="currency/[code]"
          options={{
            title: "جزئیات ارز",
            headerBackTitle: "بازار",
          }}
        />
        <Stack.Screen
          name="alerts"
          options={{
            title: "هشدارهای قیمت",
            presentation: "formSheet",
            sheetCornerRadius: 32,
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="custom-rates"
          options={{
            title: "نرخ من",
            presentation: "formSheet",
            sheetCornerRadius: 32,
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="transaction"
          options={{
            title: "ثبت تراکنش",
            presentation: "formSheet",
            sheetCornerRadius: 32,
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
