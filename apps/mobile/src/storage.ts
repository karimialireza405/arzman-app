import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";

let db: Promise<SQLite.SQLiteDatabase> | null = null;
async function database() {
  if (!db)
    db = SQLite.openDatabaseAsync("arzman.db").then(async (d) => {
      await d.execAsync(
        "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)",
      );
      return d;
    });
  return db;
}
export async function readLocal(key: string): Promise<string | null> {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return (
    (
      await (
        await database()
      ).getFirstAsync<{ value: string }>(
        "SELECT value FROM kv WHERE key = ?",
        key,
      )
    )?.value ?? null
  );
}
export async function writeLocal(key: string, value: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await (
    await database()
  ).runAsync("INSERT OR REPLACE INTO kv VALUES (?, ?)", key, value);
}
export async function clearMarketCache() {
  if (Platform.OS === "web") {
    localStorage.removeItem("market");
    return;
  }
  await (await database()).runAsync("DELETE FROM kv WHERE key = ?", "market");
}
// Each transaction is a small Keychain item; the index is committed last to avoid dangling entries.
export async function readPrivate(key: string) {
  return Platform.OS === "web"
    ? readLocal(`private-${key}`)
    : SecureStore.getItemAsync(key);
}
export async function writePrivate(key: string, value: string) {
  if (Platform.OS === "web") return writeLocal(`private-${key}`, value);
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
