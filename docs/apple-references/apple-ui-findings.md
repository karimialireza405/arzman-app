# Apple UI Design Findings — Applied to ArzMan

This document records the specific, practical design rules extracted from official Apple sources and how they map to ArzMan redesign decisions.

---

## 1. Material Hierarchy & Glass Usage

### Apple Rule (HIG: Materials)
> **5-level material hierarchy:** UltraThin → Thin → Regular (Default "Liquid Glass") → Thick → Chrome
> **Default to `.regularMaterial`** for floating containers (tabs, sheets, popovers).
> **Use `.thickMaterial`** only for forced-focus states (modals, alerts, lock screen widgets).
> **Content cards must remain opaque/semi-opaque** — glass is for chrome/controls, not content.

### ArzMan Application
| Element | Material | Rationale |
|---------|----------|-----------|
| Tab Bar | Regular (Glass) | Floating chrome, allows scroll-behind content visibility |
| Sheets (Alerts, Converter, Custom Rates, Transaction) | Thick | Focused tasks, visual separation from background |
| Currency Cards / Market Cards | Opaque (Surface) | Content legibility — prices must be readable |
| Floating Action Buttons | Glass (`.glass` style) | Overlay actions that blur background |
| Primary CTA Buttons | Opaque (`.borderedProminent`) | Must pop off glass surfaces |
| Secondary Actions | Transparent (`.bordered`) | Respects glass vibrancy |
| Segmented Controls | Glass background + opaque selected pill | Visual grouping, clear selection state |

**Critical:** Current ArzMan uses glass on content cards (CurrencyRow, Card). This violates HIG. **Must refactor to opaque surface cards.**

---

## 2. Glass vs Opaque Decision Matrix

### Apple Rule (HIG: Materials)
| Scenario | Use Glass | Use Opaque |
|----------|-----------|------------|
| Background is alive/scrolling | ✅ | ❌ |
| Text legibility critical (small type, custom fonts) | ❌ | ✅ |
| Vibrancy labels available (.primary/.secondary) | ✅ | N/A |
| Reduce Transparency must be respected | ✅ (auto) | N/A |

### ArzMan Application
- **Home screen background:** OLED black (opaque) — ✅
- **Currency cards (CurrencyRow):** Currently glass → **Change to opaque surface** — Prices are primary content
- **MarketHero card:** Keep glass for hero accent, but inner content opaque — Hybrid approach
- **Tab bar:** Glass (system default) — ✅
- **Sheets:** Thick glass — ✅

---

## 3. Corner Radii — Continuous Curves Mandate

### Apple Rule (HIG: Corner Radii / Visual Design)
> **All system-aligned containers MUST use `continuous` (squircle) corners.**
> Standard circular corners (`cornerRadius`) look "legacy" (pre-iOS 7) on modern devices.

| Element | Radius | Curve Style |
|---------|--------|-------------|
| Device Screen | ~55pt (iPhone 15 Pro) | continuous (system) |
| Tab Bar / Toolbar | **26pt** | **continuous** |
| Sheets / Cards / Popovers | **16-20pt** | **continuous** |
| Buttons (large) | **14-16pt** | **continuous** |
| Grouped List Cells | 12pt (top/bottom) | continuous |

### ArzMan Application
| Current | Target |
|---------|--------|
| `radii.card = 24` | **16-20pt continuous** (cards) |
| `radii.control = 14` | **14-16pt continuous** (buttons/controls) |
| `radii.pill = 9999` | **Full pill continuous** (badges, segmented) |
| Tab bar: `borderRadius: 26` | **26pt continuous** ✅ |

**Action:** Update all `borderRadius` to use `continuous` curve equivalent in React Native. Since RN doesn't have native `continuous`, we simulate with slightly larger radius + consistent inner/outer radius ratios.

---

## 4. Tab Bar — Liquid Glass Standard

### Apple Rule (HIG: Tab Bars)
> **Tab bars MUST use translucent material (Regular/Thick)** to allow background content visibility during scroll/transition.
> **Standard Height:** 49pt compact / 83pt landscape
> **Corner Radius:** Continuous 26pt (matches device bezel)
> **Safe Area:** Tab bar extends to edge; content uses `safeAreaInset`

### ArzMan Application
| Current | Target |
|---------|--------|
| Custom floating capsule | **Use system TabView with `.regularMaterial`** |
| Height: 68px | **49pt (74px @ 3x)** compact |
| Icons: SF Symbols mapping | ✅ Keep |
| Selected state: Colored background pill | **System default selected tint** (subtle) |
| Glass specular highlight | Add top-edge specular stroke |

**Action:** Simplify tab bar to use native system behavior where possible, enhance with specular edge highlight.

---

## 5. Button Styles — Semantic System

### Apple Rule (HIG: Buttons)
| Style | Visual | Material Interaction | Use Case |
|-------|--------|----------------------|----------|
| `.borderedProminent` | Filled, Opaque (Tint) | Ignores background | Primary Action (Save, Confirm) |
| `.bordered` | Outlined, Transparent | Sits on Glass | Secondary (Cancel, Edit) |
| `.plain` | Text only | Sits on Glass | Tertiary/Navigation |
| `.glass` (iOS 17+) | Translucent Pill | Becomes Glass | Floating Actions (FAB, overlays) |

**Critical:** Never put `.borderedProminent` inside glass container — contrast clash breaks Liquid Glass illusion.

### ArzMan Application
| Button Type | Current | Target |
|-------------|---------|--------|
| Primary CTA (Save, Confirm) | Glass prominent | **Opaque tint fill** (`.borderedProminent` equivalent) |
| Secondary (Cancel, Edit) | Glass regular | **Outlined transparent** (`.bordered` equivalent) |
| Floating Action (FAB) | Glass icon button | **Glass pill** (`.glass` equivalent) |
| Segmented selected | Colored background | **Opaque pill on glass track** |
| Tab bar icons | Glass icon button | **System default** (no custom glass wrapper) |

---

## 6. Vibrancy & Label Hierarchy

### Apple Rule (HIG: Vibrancy)
> **Glass REQUIRES semantic label colors.** Hardcoded colors break Dark Mode and Reduce Transparency.

```swift
// On ANY glass background:
Text("Primary").foregroundStyle(.primary)       // Vibrant, high contrast
Text("Secondary").foregroundStyle(.secondary)   // Vibrant, muted
Text("Tertiary").foregroundStyle(.tertiary)     // Vibrant, subtle
Text("Destructive").foregroundStyle(.red)       // System red vibrancy
```

### ArzMan Application
| Text Role | Current | Target |
|-----------|---------|--------|
| Primary headline (prices) | Hardcoded `t.text` | **Semantic `t.text` (vibrant)** |
| Secondary (unit labels) | Hardcoded `t.muted` | **Semantic `t.textSecondary`** |
| Tertiary (timestamps) | Hardcoded `t.textTertiary` | **Semantic `t.textTertiary`** |
| Green/Red (directional) | Hardcoded `t.green/t.red` | **Semantic with vibrancy** |

**Action:** Ensure all Label components use semantic color tokens that automatically adapt to glass vibrancy.

---

## 7. Currency Iconography — SF Symbols + Custom Badges

### Apple Rule (SF Symbols + Custom)
> **Use SF Symbols for system concepts.** For custom brand marks (currencies), create consistent badge family with:
> - Rounded rect/squircle container
> - SF Rounded font for glyphs
> - Consistent optical sizing
> - Proper RTL alignment

### ArzMan Application
| Currency | Current | Target Badge Design |
|----------|---------|---------------------|
| USD | `$` text | **Squircle 32pt**, SF Rounded Bold, `$` glyph, accent tint |
| EUR | `€` text | **Squircle 32pt**, SF Rounded Bold, `€` glyph, accent tint |
| AED | `د.إ` text | **Squircle 32pt**, SF Rounded Bold, `د.إ` glyph, green tint |
| IQD | `ع.د` text | **Squircle 32pt**, SF Rounded Bold, `ع.د` glyph, amber tint |

**Container:** `continuous` radius 12-14pt, subtle glass background with accent border.

---

## 8. Typography Scale — Dynamic Type Ready

### Apple Rule (HIG: Typography)
| Style | Size | Weight | Leading | Use Case |
|-------|------|--------|---------|----------|
| Large Title | 34pt | Bold | 41pt | Navigation bar large title |
| Title 1 | 28pt | Bold | 34pt | Screen titles |
| Title 2 | 22pt | Bold | 28pt | Section headers |
| Title 3 | 20pt | Semibold | 25pt | Subsection |
| Headline | 17pt | Semibold | 22pt | Primary content |
| Body | 17pt | Regular | 22pt | Body text |
| Callout | 16pt | Regular | 21pt | Secondary content |
| Subheadline | 15pt | Regular | 20pt | Metadata |
| Footnote | 13pt | Regular | 18pt | Captions |
| Caption 1 | 12pt | Medium | 16pt | Small labels |
| Caption 2 | 11pt | Regular | 13pt | Tiny labels |

**Financial Numbers:** Use **Tabular Figures** (`.monospacedDigit` / `fontVariant: ['tabular-nums']`) for alignment.

### ArzMan Application
| Element | Current | Target |
|---------|---------|--------|
| USD Hero Price | 38pt | **42-44pt Display**, Tabular, Bold |
| Currency card price | 22pt | **24pt Title 3**, Tabular, Semibold |
| Section headers | 20pt | **22pt Title 2**, Bold |
| Metadata (time, source) | 11-12pt | **12pt Caption 1**, Secondary |
| Converter input | 24pt | **28pt Title 2**, Tabular, Semibold |

---

## 9. Spacing System — 8pt Base Grid

### Apple Rule (HIG: Layout / Apple Design Resources)
> **Base unit: 8pt.** All spacing, padding, margins are multiples of 8pt.
> Common values: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64

### ArzMan Application
| Current `tokens.space` | Target |
|------------------------|--------|
| xs: 8, sm: 12, md: 16, lg: 20, xl: 28, xxl: 40 | **4, 8, 12, 16, 20, 24, 28, 32, 40, 48** |

**Action:** Refactor spacing tokens to strict 8pt multiples.

---

## 10. Shadow & Elevation Levels

### Apple Rule (HIG: Depth)
| Level | Shadow | Use Case |
|-------|--------|----------|
| 0 (Flat) | None | Content cards on background |
| 1 (Raised) | `0 1px 2px rgba(0,0,0,0.05)` | Hovered cards, selected segments |
| 2 (Floating) | `0 4px 8px rgba(0,0,0,0.08)` | Sheets, popovers |
| 3 (Modal) | `0 8px 24px rgba(0,0,0,0.12)` | Modal sheets, alerts |
| 4 (FAB/Overlay) | `0 12px 32px rgba(0,0,0,0.16)` | Floating action buttons |

**Dark Mode:** Shadows are more subtle (lower opacity) but still present for depth perception.

### ArzMan Application
- Current shadows inconsistent → Standardize to 4-level system above
- Tab bar: Level 2 floating
- Sheets: Level 3 modal
- FAB buttons: Level 4 overlay

---

## 11. Motion & Spring Configs

### Apple Rule (HIG: Motion)
> **Spring animations feel native.** Standard configs:

| Interaction | Damping | Stiffness | Mass | Duration |
|-------------|---------|-----------|------|----------|
| Press feedback | 15-20 | 150-200 | 1.0 | ~100ms |
| Tab transition | 20-25 | 150-200 | 1.0 | ~200ms |
| Sheet present | 25-30 | 180-220 | 1.2 | ~300ms |
| List reorder | 20 | 200 | 1.0 | ~250ms |

**Reduce Motion:** Respect `prefersReducedMotion` — disable springs, use instant transitions.

### ArzMan Application
| Current | Target |
|---------|--------|
| Various custom springs | **Unified 3 spring configs** (snappy, gentle, modal) |
| Press scale: 0.96 | **0.96 with spring** ✅ |
| Tab press haptic | **Keep** ✅ |

---

## 12. RTL & Persian Layout

### Apple Rule (HIG: Right-to-Left)
> **RTL is a first-class layout direction.** Mirror:
> - Navigation flow (back button on left → right)
> - Icon direction (chevrons, arrows)
> - Text alignment
> - **Do NOT mirror:** Currency symbols ($, €), media controls (play, rewind), clock hands, math symbols

### ArzMan Application
| Element | Current | Target |
|---------|---------|--------|
| Layout direction | `writingDirection: "rtl"` | ✅ Keep |
| Currency symbols in badges | Not mirrored | ✅ Keep `$`, `€`, `د.إ`, `ع.د` LTR |
| Chevron icons | Custom mapping | **Mirror: `chevron.left` ↔ `chevron.right`** |
| Tab bar order | RTL reversed | ✅ Keep |
| Number display | Tabular LTR | ✅ Keep |

---

## 13. Reduce Transparency & Accessibility

### Apple Rule (HIG: Accessibility)
> **Test with Reduce Transparency ON.** System automatically converts glass to opaque if you use semantic materials/colors.
> **Dynamic Type:** All text must scale. Use `UIFontMetrics` / `fontVariant: ['tabular-nums']`.

### ArzMan Application
- Current: Custom glass fallbacks may not respect Reduce Transparency
- **Action:** Ensure `BlurView` fallback has opaque alternative when `accessibilityReduceTransparency` is true
- **Dynamic Type:** Verify all `Label` components scale with system text size

---

## Summary: ArzMan Redesign Checklist from Apple Sources

### Must Fix (HIG Violations)
- [ ] **Content cards use glass → Change to opaque surface**
- [ ] **Standard corner radius → Continuous curves (simulate in RN)**
- [ ] **Buttons inside glass use prominent → Use bordered/glass styles**
- [ ] **Hardcoded text colors → Semantic vibrant colors**
- [ ] **Custom tab bar glass → Simplify to system-like with specular edge**

### Should Improve
- [ ] Currency badge system (SF Rounded, consistent family)
- [ ] Spacing tokens to strict 8pt grid
- [ ] Typography scale aligned to Apple text styles
- [ ] Shadow elevation system (4 levels)
- [ ] Unified spring configs (3 presets)

### Polish
- [ ] Specular edge highlight on tab bar
- [ ] Subtle inner stroke on glass containers
- [ ] Press/active states on all interactive elements
- [ ] Haptic feedback on all controls
- [ ] RTL chevron mirroring

---

## Sources Referenced

1. **HIG: Materials** — https://developer.apple.com/design/human-interface-guidelines/materials
2. **HIG: Tab Bars** — https://developer.apple.com/design/human-interface-guidelines/tab-bars
3. **HIG: Buttons** — https://developer.apple.com/design/human-interface-guidelines/buttons
4. **HIG: Typography** — https://developer.apple.com/design/human-interface-guidelines/typography
5. **HIG: Corner Radii / Continuous Curves** — https://developer.apple.com/design/human-interface-guidelines/visual-design
6. **SwiftUI: GlassEffectContainer** — https://developer.apple.com/documentation/SwiftUI/GlassEffectContainer
7. **SF Symbols 6** — https://developer.apple.com/sf-symbols/
8. **Apple Design Resources** — https://developer.apple.com/design/resources/

---

## 14. Applied redesign — implementation record (2026-09-21)

The checklist at the end of §Summary has been implemented. Mapping of the rules
to the shipped code (`apps/mobile/src/components/*`, `apps/mobile/src/design-system/*`):

| Rule | Implementation |
|------|----------------|
| Liquid Glass only on chrome | `Glass` (surfaces.tsx) is used by the tab bar, glass buttons and icon buttons. `Surface`/`GroupedList` (surfaces.tsx) are opaque and carry all market/portfolio content. |
| Continuous (squircle) corners | RN's native `borderCurve: "continuous"` on every container, exposed through the `curve` token in tokens.ts. |
| Concentric geometry | `concentricRadius(outer, padding, min)` + `concentricPairs` presets in tokens.ts. |
| Button semantics | `Button` (controls.tsx): `prominent / tinted / bordered / glass / plain / destructive`, sizes 50/44/34pt, capsule shape for horizontal rows, ≥44pt hit region (hitSlop on small), spring press + light impact haptic. |
| Tab bar | `app/(tabs)/_layout.tsx`: floating 58pt capsule of `regular` Liquid Glass with specular hairline, always-visible labels, quiet accent tint on the selected symbol, mirrored RTL order, selection haptic. |
| Segmented control | `SegmentedControl` (controls.tsx): equal widths, ≤5 segments, traveling indicator (spring, Reduce-Motion aware), selection haptic. |
| Search field | `SearchField` (controls.tsx): 36pt rounded rect, magnifier + placeholder + clear, live filtering, focus rim. |
| Grouped lists | `GroupedList` + `Divider` (surfaces.tsx): inset hairline separators (66pt = badge 38 + gap 12 + list padding 16). |
| Typography | `Label` with Apple Dynamic Type names (`variant`), 17pt default body, tabular figures for money, no light weights. |
| Vibrancy | Semantic text colors only (`text`, `textSecondary`, `textTertiary`) from tokens.ts. |
| RTL | `row-reverse` + `writingDirection: "rtl"`; currency glyphs keep an explicit per-glyph direction (`currency-icons.ts`); chevrons map to the RTL direction (`chevron.left`). |
| Reduce Motion | `useReduceMotion()` reads the **system** Reduce Motion switch; press springs and the segmented indicator skip animation when enabled. |

### Honesty correction

The previous Home hero drew a **decorative, fabricated sparkline**. It has been
removed and replaced by `RangeMeter` (market.tsx), which plots the *reported*
daily low → high with the current price marker. ArzMan continues to render no
invented price series anywhere.
