// Browser preview only. Financial data here is not encrypted; iPhone uses Keychain.
export async function readLocal(key: string): Promise<string | null> {
  return localStorage.getItem(key);
}
export async function writeLocal(key: string, value: string) {
  localStorage.setItem(key, value);
}
export async function clearMarketCache() {
  localStorage.removeItem("market");
}
export async function readPrivate(key: string) {
  return readLocal(`private-${key}`);
}
export async function writePrivate(key: string, value: string) {
  return writeLocal(`private-${key}`, value);
}
export async function deletePrivate(key: string) {
  localStorage.removeItem(`private-${key}`);
}
