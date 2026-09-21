# ArzMan UI Audit — Pre-Redesign Assessment

**Date:** 2026-09-21  
**Auditor:** Lead Engineer  
**Context:** App currently evaluated primarily in **Expo Web / Safari** — NOT native iPhone. This is a critical distinction documented below.

---

## Executive Summary

The ArzMan app is **functionally complete** but **visually raw**. The current implementation uses a custom "Liquid Glass" design system built on `expo-glass-effect` and `expo-blur`, but it violates several Apple HIG principles:

1. **Glass on content cards** (HIG violation — glass is for chrome, not content)
2. **Standard circular corners** instead of continuous curves
3. **Generic button hierarchy** not matching Apple's semantic styles
4. **Hardcoded text colors** instead of semantic vibrancy
5. **Custom tab bar** that doesn't use system behavior
6. **No currency icon system** — just text glyphs in generic containers

**Viewing Context Warning:** All screenshots/evaluation currently done in **Safari/Web**. Safari renders blur, transparency, and shadows differently than native iOS. True visual quality can only be assessed on **physical iPhone via Expo Go or Development Build**.

---

## Screen-by-Screen Audit

### 1. Home Screen (`app/(tabs)/index.tsx`)

| Issue | Severity | HIG Reference |
|-------|----------|---------------|
| MarketHero card uses glass for hero content | High | Glass for chrome only |
| USD price at 38pt — too small for hero | Medium | Large Title = 34pt, Display = 42+pt |
| CurrencyRow cards use glass background | High | Content cards = opaque |
| Section spacing inconsistent (gap: 10, 12, 16) | Medium | 8pt grid |
| Quick actions use generic GlassButton | Medium | Should use .glass style for FABs |
| Portfolio sneak peek card heavy | Low | Reduce visual weight |

**What to Keep:**
- Overall structure (Hero → Portfolio → Watchlist → Quick Actions)
- MarketHero concept (USD showcase with sparkline)
- RTL layout and Persian text rendering

---

### 2. Markets Screen (`app/(tabs)/market.tsx`)

| Issue | Severity | HIG Reference |
|-------|----------|---------------|
| Search bar uses custom GlassSearchBar | Low | OK if follows search field patterns |
| Filter segmented control uses custom glass | Medium | Should match Apple segmented style |
| CurrencyRow cards still glass background | High | Content = opaque |
| Favorite toggle as GlassButton inside card | Medium | Should be trailing swipe or contextual |

**What to Keep:**
- Live search with Persian support
- Filter tabs (All / Favorites)
- CurrencyRow structure (icon, name, price, change)

---

### 3. Currency Detail (`app/currency/[code].tsx`)

| Issue | Severity | HIG Reference |
|-------|----------|---------------|
| Chart card uses glass background | Medium | Chart area = opaque |
| Stats grid cards use glass | High | Content = opaque |
| Currency symbol as text in generic circle | High | Needs currency badge system |
| Action buttons use mixed GlassButton variants | Medium | Standardize to semantic styles |

**What to Keep:**
- Chart with touch scrubber (Apple Stocks-like) ✅
- SpreadBar (daily range indicator) ✅
- Source metadata transparency ✅

---

### 4. Converter (`app/(tabs)/converter.tsx`)

| Issue | Severity | HIG Reference |
|-------|----------|---------------|
| Source/Destination cards use glass | Medium | Should be opaque cards |
| Swap button is custom rotating GlassIconButton | Low | OK if feels native |
| Result display lacks hierarchy | Medium | Primary result = prominent |
| Segmented controls for currency selection | OK | Good pattern |

**What to Keep:**
- Dual currency selection with segmented controls
- Live conversion result
- Swap animation concept

---

### 5. Portfolio (`app/(tabs)/portfolio.tsx`)

| Issue | Severity | HIG Reference |
|-------|----------|---------------|
| Asset cards use glass background | High | Content = opaque |
| Allocation bar uses basic View | Low | Could use gradient |
| Transaction list uses Pressable with basic styling | Medium | Should use swipe actions |
| Face ID gate screen is minimal | Low | Acceptable |

**What to Keep:**
- Allocation visualization concept
- P&L breakdown (unrealized/realized)
- Privacy-first Face ID gate

---

### 6. More / Settings (`app/(tabs)/more.tsx`)

| Issue | Severity | HIG Reference |
|-------|----------|---------------|
| Section cards use glass | Medium | Settings = opaque grouped |
| Segmented controls for unit/theme | OK | Good pattern |
| Switches use native Switch component | ✅ | Keep |
| CTA buttons use GlassButton | Medium | Standardize styles |

---

## Shared Component Audit

### Tab Bar (`app/(tabs)/_layout.tsx`)

| Issue | Severity | HIG Reference |
|-------|----------|---------------|
| Custom floating capsule (68px height) | High | Standard = 49pt |
| Glass background with custom specular | Medium | Use system + subtle enhancement |
| SF Symbols mapping for icons | ✅ | Keep |
| Selected state: colored pill background | Medium | System default is subtle tint |
| No continuous corner simulation | High | 26pt continuous required |

### Buttons (`GlassButton`, `Button`, `GlassIconButton`)

| Issue | Severity | HIG Reference |
|-------|----------|---------------|
| 4 variants (prominent/regular/secondary/quiet) | OK | But semantics wrong for glass context |
| Pressed state: scale 0.96 | ✅ | Keep |
| Haptic on press | ✅ | Keep |
| No `.glass` style equivalent | High | Need glass pill style for FABs |
| Icon positioning inconsistent | Medium | Standardize |

### Cards (`Card`, `Glass`, `GlassContainer`)

| Issue | Severity | HIG Reference |
|-------|----------|---------------|
| `Card` uses glass background by default | **Critical** | Content = opaque |
| `Glass` wrapper overused | High | Glass for chrome only |
| `GlassContainer` used but not consistently | Medium | Use for grouped controls |
| Border radius: `radii.card = 24` | High | 16-20pt continuous |
| No continuous curve simulation | High | Simulate in RN |

### Currency Iconography

| Issue | Severity | HIG Reference |
|-------|----------|---------------|
| Text glyphs in generic rounded rect | **Critical** | Need currency badge family |
| No SF Symbols for currencies | Medium | Create custom badge family |
| Inconsistent sizing (44px vs 32pt) | Medium | Standardize 32pt badge |
| No RTL consideration for symbols | Medium | Keep $ € ل.إ ع.د LTR |

### Typography (`Label`, `Price`)

| Issue | Severity | HIG Reference |
|-------|----------|---------------|
| `Label` uses hardcoded colors | High | Semantic vibrancy required |
| `Price` at 38pt/22pt | Medium | Align to Apple text styles |
| Tabular figures used ✅ | ✅ | Keep |
| Persian digits toggle ✅ | ✅ | Keep |

### Spacing & Layout

| Issue | Severity | HIG Reference |
|-------|----------|---------------|
| Spacing tokens not strict 8pt grid | Medium | 4, 8, 12, 16, 20, 24, 28, 32, 40, 48 |
| Section gaps inconsistent (10, 12, 16) | Medium | Standardize |
| Screen padding: 18px | Medium | 16 or 20 (8pt grid) |

---

## Color & Material Audit

### Current Dark Mode Palette (from `tokens.ts`)
```typescript
dark: {
  background: "#050607",        // Near-black, not OLED #000000
  surface: "#141619",           // Card surface
  raised: "#202329",            // Elevated
  text: "#F5F7FA",              // Primary
  muted: "#9AA1AC",             // Secondary
  line: "#292D34",              // Dividers
  accent: "#AFC9EF",            // Blue tint
  green: "#75DDA5",             // Positive
  red: "#FF8D96",               // Negative
  
  // Glass materials
  glassRegular: "rgba(30, 34, 44, 0.72)",
  glassClear: "rgba(18, 20, 26, 0.46)",
  glassProminent: "rgba(42, 48, 62, 0.85)",
  glassRim: "rgba(255, 255, 255, 0.12)",
  glassSpecular: "rgba(255, 255, 255, 0.18)",
}
```

### Issues
| Issue | Severity | Target |
|-------|----------|--------|
| Background not true OLED #000000 | Medium | `#000000` for Dark |
| Surface too dark (#141619) | Low | `#121212` or `#1C1C1E` (Apple) |
| Accent blue not Apple system | Medium | `#0A84FF` (iOS Blue) |
| Green/Red not system | Medium | `#30D158` / `#FF453A` |
| Glass materials custom | Medium | Match iOS material recipes |

---

## Web vs Native Viewing Context

### Critical Documentation
**The app is currently being evaluated in Safari/Web via Expo Web export.**

| Aspect | Web/Safari | Native iOS (Expo Go / Dev Build) |
|--------|------------|----------------------------------|
| Blur (`expo-blur`) | CSS `backdrop-filter` | Native `UIVisualEffectView` |
| Glass (`expo-glass-effect`) | Polyfill/approx | Native `UIKit` / `SwiftUI` glass |
| Shadows | CSS `box-shadow` | Native `CALayer` shadows |
| Safe Area | CSS env() | Native `UIView` safeAreaInsets |
| SF Symbols | Font fallback | Native `UIImage.SymbolConfiguration` |
| Haptics | None | Native `UIImpactFeedbackGenerator` |
| Scroll Physics | Web scroll | Native `UIScrollView` deceleration |
| Text Rendering | Web fonts | Native Core Text |
| Color Space | sRGB | P3 Wide Gamut |

**Conclusion:** Web rendering **cannot** accurately represent native iPhone visual quality. All design judgments must be validated on **physical iPhone via Expo Go or Development Build**.

---

## What to Keep (Already Good)

1. **Functional completeness** — All features work
2. **RTL/Persian support** — Excellent throughout
3. **CurrencyRow structure** — Good information hierarchy
4. **Chart with scrubber** — Apple Stocks-like interaction
5. **SpreadBar** — Useful daily range indicator
6. **MarketHero concept** — USD hero with sparkline
7. **Privacy-first Face ID gate** — Correct behavior
8. **Transaction ledger with swipe-to-delete concept** — Good UX
9. **Settings grouped sections** — Logical organization
10. **TypeScript strictness** — Zero `any`, proper schemas

---

## Redesign Priority Matrix

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| **P0** | Refactor cards to opaque surface (remove glass from content) | Medium | High |
| **P0** | Implement continuous corner simulation | Medium | High |
| **P0** | Create currency badge system (USD/EUR/AED/IQD) | Medium | High |
| **P0** | Redesign tab bar to system-like 49pt with specular edge | Medium | High |
| **P0** | Align button styles to Apple semantic (prominent/bordered/glass) | Medium | High |
| **P1** | Refactor color tokens to Apple system colors | Low | Medium |
| **P1** | Implement semantic vibrancy text colors | Low | Medium |
| **P1** | Strict 8pt spacing grid | Low | Medium |
| **P1** | Unified spring configs (3 presets) | Low | Medium |
| **P2** | Currency badge family with SF Rounded | Low | Medium |
| **P2** | Specular edge highlight on tab bar | Low | Polish |
| **P2** | Shadow elevation system (4 levels) | Low | Polish |
| **P2** | Unified press/active states | Low | Polish |

---

## Next Steps

1. **Create design token refactor** (`apps/mobile/src/design-system/tokens.ts`)
2. **Rebuild shared components** (`apps/mobile/src/ui.tsx`) with Apple-aligned primitives
3. **Redesign tab bar** (`app/(tabs)/_layout.tsx`)
4. **Redesign all 6 screens** with new components
5. **Test on physical iPhone** (Expo Go → Dev Build for Face ID)
6. **Document changes** in HANDOFF, TODO, CHANGELOG

---

## Post-Redesign Status — 2026-09-21 (implementation complete)

The priority matrix above has been executed. Verification: `npm run check`
(typecheck + lint + 22 vitest tests) passes with zero errors and zero warnings,
`npx expo-doctor` reports 21/21 checks passed, and `npx expo export --platform all`
produces clean Web, iOS (Hermes) and Android (Hermes) bundles.

| Priority task | Status |
|---------------|--------|
| Refactor cards to opaque surface (remove glass from content) | ✅ `Surface` / `GroupedList` carry all content; glass only on tab bar + chrome buttons |
| Implement continuous corner simulation | ✅ Native `borderCurve: "continuous"` everywhere (no simulation needed) |
| Create currency badge system (USD/EUR/AED/IQD) | ✅ `CurrencyBadge` in `src/design-system/currency-icons.ts` |
| Redesign tab bar | ✅ Floating 58pt Liquid Glass capsule, labels, quiet selection, RTL-mirrored order |
| Align button styles to Apple semantics | ✅ `Button` with prominent/tinted/bordered/glass/plain/destructive |
| Refactor color tokens to Apple system colors | ✅ tokens.ts dark `#0A84FF/#30D158/#FF453A`, light `#007AFF/#34C759/#FF3B30`, OLED `#000000` |
| Semantic vibrancy text colors | ✅ `text / textSecondary / textTertiary` (60%/40% white or black equivalents) |
| Strict spacing grid | ✅ 8pt grid in tokens.ts + `semanticSpacing` |
| Typography scale aligned to Apple text styles | ✅ `Label variant` uses the Dynamic Type scale table |
| Unified spring configs (3 presets) | ✅ `springs.press / tab / modal / snappy / gentle` |
| Specular edge highlight on tab bar | ✅ hairline specular view inside the tab bar glass |
| Press/active states + haptics on all controls | ✅ `usePressFeedback` + `useFeedback` on every control |
| RTL chevron mirroring | ✅ `chevron.left` SF Symbol used as the RTL disclosure direction |

### Remaining known visual debt

1. **True Liquid Glass is iOS-only.** On web/Android the `BlurView` fallback is
   an approximation; contrast is intentionally higher there, not identical.
2. **Currency detail chart** still uses its own Card padding (18pt); it could
   adopt `Surface` directly for a perfectly consistent radius.
3. **Dynamic Type**: money values intentionally do not scale (`allowFontScaling={false}`)
   so tabular figures never wrap; labels do scale. A future pass could add a
   max-scale clamp for money values instead.
4. **Segmented control with 6 items** (converter currencies) uses a chip picker
   instead — allowed, but a native popup-style picker would be even more system-like.
