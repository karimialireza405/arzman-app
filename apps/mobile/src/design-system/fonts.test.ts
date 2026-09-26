import { describe, expect, it } from "vitest";
import { fontFamilyFor, hasPersianLetters, persianText, PERSIAN_LINE_HEIGHT } from "./fonts";

describe("Persian text resolution", () => {
  it("never lets a line be shorter than Vazirmatn's measured height", () => {
    // largeTitle was 34/41: glyphs need ceil(34 × 1.5625) = 54.
    expect(persianText({ fontSize: 34, lineHeight: 41 }).lineHeight).toBe(54);
    expect(persianText({ fontSize: 15 }).lineHeight).toBe(Math.ceil(15 * PERSIAN_LINE_HEIGHT));
    // A caller asking for more room keeps it.
    expect(persianText({ fontSize: 15, lineHeight: 40 }).lineHeight).toBe(40);
  });

  it("resolves weight to a family and drops fontWeight", () => {
    const s = persianText({ fontSize: 17, fontWeight: "600" });
    expect(s.fontFamily).toBe("Vazirmatn_600SemiBold");
    expect(s.fontWeight).toBeUndefined();
    expect(fontFamilyFor("bold")).toBe("Vazirmatn_700Bold");
    expect(fontFamilyFor(undefined)).toBe("Vazirmatn_400Regular");
    expect(fontFamilyFor("300")).toBe("Vazirmatn_300Light");
    expect(fontFamilyFor("900")).toBe("Vazirmatn_800ExtraBold");
  });

  it("drops tracking on Persian words but keeps it on numbers", () => {
    expect(persianText({ fontSize: 44, letterSpacing: -0.8 }, "ارز من").letterSpacing).toBeUndefined();
    expect(persianText({ fontSize: 44, letterSpacing: -0.8 }, "۲۳۴٬۶۱۵").letterSpacing).toBe(-0.8);
    expect(persianText({ fontSize: 44, letterSpacing: -0.8 }, "234,615").letterSpacing).toBe(-0.8);
  });

  it("tells Persian letters from Persian digits", () => {
    expect(hasPersianLetters("تومان")).toBe(true);
    expect(hasPersianLetters("۱۴۸٫۶")).toBe(false);
    expect(hasPersianLetters(["۱۲", " ", "ریال"])).toBe(true);
    expect(hasPersianLetters(42)).toBe(false);
  });
});
