import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));

// apps/mobile/app.json is the single source of truth for the version; every
// workspace package follows it so a release never ships mismatched numbers.
it("keeps every package version equal to the app version", () => {
  const app: string = json("apps/mobile/app.json").expo.version;
  for (const path of [
    "package.json",
    "apps/mobile/package.json",
    "packages/shared/package.json",
    "server/package.json",
  ])
    expect({ path, version: json(path).version }).toEqual({
      path,
      version: app,
    });
});
