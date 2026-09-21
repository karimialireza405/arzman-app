/**
 * Legacy import path.
 *
 * Every screen imports from `../src/ui`. That path now re-exports the modular
 * UI kit in `src/components/*`, so the Apple redesign could be rebuilt without
 * touching a single screen import. New code may import `src/components`
 * directly; both resolve to the same modules.
 */
export * from "./components";
