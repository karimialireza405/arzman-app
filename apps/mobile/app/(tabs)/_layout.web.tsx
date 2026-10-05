/**
 * Tab bar for the web build (Safari "Add to Home Screen" on iPhone).
 *
 * Native tabs render as a strip at the top of the page on the web, over the
 * ArzMan wordmark, so the web uses ArzMan's floating glass bar, the same one
 * as Android. The bottom inset comes from env(safe-area-inset-bottom) via
 * viewport-fit=cover in public/index.html.
 */
export { default, unstable_settings } from "./_layout.android";
