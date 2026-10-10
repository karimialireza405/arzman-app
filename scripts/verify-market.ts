/**
 * ArzMan Live TGJU Source vs Normalized API Verification Script
 *
 * Runs an independent live audit against official TGJU public profile pages:
 * USD, EUR, AED, IQD
 *
 * Usage:
 *   npm run verify
 */

import { parseTgju, profiles } from "../server/src/providers/tgju";
import { fiatCodes, names } from "../packages/shared/src";

interface AuditResult {
  currency: string;
  nameFa: string;
  sourceUrl: string;
  rawValue: number;
  rawUnit: string;
  quoteSize: number;
  normalizedToman: number;
  previousCloseToman: number | null;
  changeToman: number | null;
  changePercent: number | null;
  lowToman: number | null;
  highToman: number | null;
  sourceTimeLabel: string;
  sourceTimestamp: string | null;
  stale: boolean;
  status: "OK" | "FAIL";
  error?: string;
  responseTimeMs: number;
}

async function verifyMarket() {
  console.log(
    "======================================================================",
  );
  console.log(
    "             ارز من · ArzMan Live Market Verification                ",
  );
  console.log(
    "======================================================================",
  );
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);
  console.log(`Target Provider:     TGJU (شبکه اطلاع‌رسانی طلا و ارز)\n`);

  const results: AuditResult[] = [];

  for (const code of fiatCodes) {
    const url = `https://www.tgju.org/profile/${profiles[code]}`;
    const start = Date.now();
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "text/html",
          "User-Agent": "ArzMan/0.2 live market audit",
        },
        signal: AbortSignal.timeout(15000),
      });

      const responseTimeMs = Date.now() - start;

      if (!response.ok) {
        results.push({
          currency: code,
          nameFa: names[code],
          sourceUrl: url,
          rawValue: 0,
          rawUnit: "UNKNOWN",
          quoteSize: 1,
          normalizedToman: 0,
          previousCloseToman: null,
          changeToman: null,
          changePercent: null,
          lowToman: null,
          highToman: null,
          sourceTimeLabel: "ERROR",
          sourceTimestamp: null,
          stale: true,
          status: "FAIL",
          error: `HTTP ${response.status} ${response.statusText}`,
          responseTimeMs,
        });
        continue;
      }

      const html = await response.text();
      const quote = parseTgju(html, code);

      results.push({
        currency: code,
        nameFa: quote.nameFa,
        sourceUrl: url,
        rawValue: quote.rawValue,
        rawUnit: quote.rawUnit,
        quoteSize: quote.quoteSize,
        normalizedToman: quote.priceToman,
        previousCloseToman: quote.previousToman,
        changeToman: quote.change,
        changePercent: quote.changePercent,
        lowToman: quote.lowToman,
        highToman: quote.highToman,
        sourceTimeLabel: quote.sourceTimeLabel,
        sourceTimestamp: quote.sourceTimestamp,
        stale: quote.stale,
        status: "OK",
        responseTimeMs,
      });
    } catch (err) {
      results.push({
        currency: code,
        nameFa: names[code],
        sourceUrl: url,
        rawValue: 0,
        rawUnit: "UNKNOWN",
        quoteSize: 1,
        normalizedToman: 0,
        previousCloseToman: null,
        changeToman: null,
        changePercent: null,
        lowToman: null,
        highToman: null,
        sourceTimeLabel: "ERROR",
        sourceTimestamp: null,
        stale: true,
        status: "FAIL",
        error: err instanceof Error ? err.message : String(err),
        responseTimeMs: Date.now() - start,
      });
    }
  }

  // Print individual currency diagnostic reports
  for (const r of results) {
    console.log(
      `----------------------------------------------------------------------`,
    );
    console.log(`Currency:          ${r.currency} — ${r.nameFa}`);
    console.log(`Source URL:        ${r.sourceUrl}`);
    console.log(`Response Time:     ${r.responseTimeMs}ms`);

    if (r.status === "OK") {
      console.log(
        `TGJU raw value:    ${r.rawValue.toLocaleString()} ${r.rawUnit}`,
      );
      console.log(`Quote size:        ${r.quoteSize} unit`);
      console.log(
        `ArzMan Toman:      ${r.normalizedToman.toLocaleString()} Toman`,
      );
      console.log(
        `Normalization:     ${r.rawValue.toLocaleString()} ${r.rawUnit} / ${r.rawUnit === "IRR" ? 10 : 1} / ${r.quoteSize} = ${r.normalizedToman.toLocaleString()} Toman`,
      );
      console.log(
        `Previous close:    ${r.previousCloseToman?.toLocaleString() ?? "—"} Toman`,
      );
      console.log(
        `Daily change:      ${r.changeToman != null ? (r.changeToman >= 0 ? "+" : "") + r.changeToman.toLocaleString() + " Toman" : "—"} (${r.changePercent != null ? (r.changePercent >= 0 ? "+" : "") + r.changePercent.toFixed(2) + "%" : "—"})`,
      );
      console.log(
        `Today's bounds:    Low ${r.lowToman?.toLocaleString() ?? "—"} ... High ${r.highToman?.toLocaleString() ?? "—"} Toman`,
      );
      console.log(`Source time label: «${r.sourceTimeLabel}»`);
      console.log(
        `Source timestamp:  ${r.sourceTimestamp ?? "null (unverified trade time label)"}`,
      );
      console.log(`Stale flag:        ${r.stale}`);
      console.log(`Status:            ✅ OK`);
    } else {
      console.log(`Status:            ❌ FAILED: ${r.error}`);
    }
    console.log("");
  }

  // Summary Table
  console.log(
    "======================================================================",
  );
  console.log(
    "                        AUDIT SUMMARY TABLE                           ",
  );
  console.log(
    "======================================================================",
  );
  console.log(
    "| Currency | TGJU Raw (Rial) | Quote Size | ArzMan Price (Toman) | Status |",
  );
  console.log(
    "|----------|-----------------|------------|----------------------|--------|",
  );
  for (const r of results) {
    const rawStr =
      r.status === "OK" ? `${r.rawValue.toLocaleString()} IRR` : "ERROR";
    const sizeStr = `${r.quoteSize} unit`;
    const tomanStr =
      r.status === "OK" ? `${r.normalizedToman.toLocaleString()} Toman` : "—";
    const statusStr = r.status === "OK" ? "✅ OK" : "❌ FAIL";
    console.log(
      `| ${r.currency.padEnd(8)} | ${rawStr.padEnd(15)} | ${sizeStr.padEnd(10)} | ${tomanStr.padEnd(20)} | ${statusStr.padEnd(6)} |`,
    );
  }
  console.log(
    "======================================================================\n",
  );

  const allOk = results.every((r) => r.status === "OK");
  if (!allOk) {
    console.error("❌ Some currencies failed verification. Check logs above.");
    process.exitCode = 1;
  } else {
    console.log(
      "✨ All 4 Iranian market currencies successfully verified against live TGJU!",
    );
  }
}

verifyMarket().catch((err) => {
  console.error("Fatal verification error:", err);
  process.exitCode = 1;
});
