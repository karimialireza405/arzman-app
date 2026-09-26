// Browser preview only: settings and the market cache live in localStorage.
export async function readLocal(key: string): Promise<string | null> {
  return localStorage.getItem(key);
}
export async function writeLocal(key: string, value: string) {
  localStorage.setItem(key, value);
}
export async function clearMarketCache() {
  localStorage.removeItem("market");
}
