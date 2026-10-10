# Apple UI Reference Index — ArzMan

This index catalogs the **official Apple design sources** used to ground the
ArzMan redesign. Every design decision in this project should trace back to one
of these sources. All pages were retrieved on **2026-09-21**.

> **How to read Apple docs without a browser (verified):** Apple's Human
> Interface Guidelines pages are JavaScript-rendered, but the raw article is
> available as Markdown at:
> `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.md`
> and framework articles as
> `https://developer.apple.com/tutorials/data/documentation/<Framework>/<Article>.json`.
> That is the official "View Markdown" equivalent used for this audit.

---

## Primary sources (verified, used for this redesign)

| #   | Source                                       | Official URL                                                                          | Used for                                                                                                                                                                 |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | HIG · Materials                              | `https://developer.apple.com/design/human-interface-guidelines/materials`             | Two-material model: Liquid Glass = controls/navigation chrome; standard materials = content layer                                                                        |
| 2   | HIG · Buttons                                | `…/human-interface-guidelines/buttons`                                                | Semantic styles, 44×44pt hit region, mandatory press state, one-or-two prominent buttons per view, rounded-rect for stacked / capsule for horizontal rows                |
| 3   | HIG · Tab bars                               | `…/human-interface-guidelines/tab-bars`                                               | Navigation only, labels required, filled SF Symbols, quiet selection, no overflow tabs                                                                                   |
| 4   | HIG · Search fields                          | `…/human-interface-guidelines/search-fields`                                          | Search icon + clear button + placeholder, search-as-you-type                                                                                                             |
| 5   | HIG · Segmented controls                     | `…/human-interface-guidelines/segmented-controls`                                     | ≤5 segments on iPhone, equal widths, never mix actions with state                                                                                                        |
| 6   | HIG · Lists and tables                       | `…/human-interface-guidelines/lists-and-tables`                                       | Grouped rows, inset separators, disclosure indicators only when navigating                                                                                               |
| 7   | HIG · Typography                             | `…/human-interface-guidelines/typography`                                             | 17pt default / 11pt minimum on iOS, avoid light weights, weight+size+color for hierarchy                                                                                 |
| 8   | HIG · Layout                                 | `…/human-interface-guidelines/layout`                                                 | Priority ordering, alignment, grouping with negative space/containers, "Differentiate controls from content"                                                             |
| 9   | HIG · Right to left                          | `…/human-interface-guidelines/right-to-left`                                          | Mirror navigation flow; never mirror currency glyphs ($ € د.إ ع.د)                                                                                                       |
| 10  | Adopting Liquid Glass (Technology Overviews) | `https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass` | Liquid Glass is the topmost layer for navigation/controls; system button styles `glass`, `prominentGlass`, `clearGlass`                                                  |
| 11  | SF Symbols                                   | `https://developer.apple.com/sf-symbols/`                                             | Symbol set + weights used by `AppIcon` (house, chart.line.uptrend.xyaxis, arrow.left.arrow.right, wallet.pass, ellipsis.circle, bell, star, lock, tag, magnifyingglass…) |
| 12  | Apple Design Resources                       | `https://developer.apple.com/design/resources/`                                       | 8pt spacing rhythm, elevation/shadow levels, control sizes                                                                                                               |

WWDC sessions that define the Liquid Glass behavior (referenced from the pages above):
WWDC25 session 356 / WWDC25 208 (tab bar + Liquid Glass adoption), cited in the
tab-bars change log (`December 16, 2025 — Updated guidance for Liquid Glass`).

---

## Design decisions traced to sources

| ArzMan element                               | Apple source                                  | Decision                                                                                                                                                       |
| -------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content cards (market rows, holdings, stats) | HIG · Materials                               | **Opaque** surfaces; glass never carries price content                                                                                                         |
| Floating tab bar                             | HIG · Tab bars + Materials                    | Floating `regular` Liquid Glass capsule, labels always visible, quiet selected tint, SF Symbols                                                                |
| Buttons                                      | HIG · Buttons                                 | Semantic variants (`prominent`, `tinted`, `bordered`, `glass`, `plain`, `destructive`); 50pt stacked / capsule in rows; ≥44pt hit region; always a press state |
| Segmented control                            | HIG · Segmented controls                      | Equal-width segments, ≤5 on iPhone, traveling selection indicator on a quiet fill track                                                                        |
| Search field                                 | HIG · Search fields                           | 36pt rounded rect, magnifier + placeholder + clear, live filtering                                                                                             |
| Lists (market, holdings, settings)           | HIG · Lists and tables                        | One grouped surface with inset hairline separators; chevrons only for navigation                                                                               |
| Typography                                   | HIG · Typography                              | 17pt body, 11pt minimum, no light weights, tabular figures for all money values                                                                                |
| RTL                                          | HIG · Right to left                           | Layout mirrored (leading = right), currency glyphs never mirrored, tab order mirrored                                                                          |
| Motion                                       | HIG · Materials/Motion + system Reduce Motion | Spring press states (~0.97 scale), springs unified in tokens, Reduce Motion honored via `AccessibilityInfo`                                                    |

---

## Validation checklist (from HIG)

Before shipping any UI change, verify:

- [x] Tab bar uses the system material and stays navigation-only
- [x] All container corners use `borderCurve: "continuous"`
- [x] At most one prominent button per view; stacked = rounded rect, row = capsule
- [x] Text uses semantic colors (primary/secondary/tertiary)
- [x] Content cards are opaque; glass only on chrome/controls
- [x] RTL: navigation flow mirrored, currency glyphs never mirrored
- [x] Safe areas: Dynamic Island top inset + floating tab bar + home indicator clearance
- [x] Reduce Motion honored (system setting, not an app guess)
- [x] Dynamic Type respected (`allowFontScaling` on text; fixed optical sizes only for money values)

## How to use this index

1. Check `apple-ui-findings.md` for the extracted rule.
2. If missing, fetch the official page (prefer the `.md` data endpoint above).
3. Document the decision with a source link in code comments or the commit.
4. Never invent "Apple-like" rules without a source.
