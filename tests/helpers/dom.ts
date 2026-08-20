import type { Locator } from '@playwright/test';

// WebKit doesn't reliably fire this app's React onChange/validation from
// locator.fill() on controlled inputs — the value lands in the DOM but the
// component's state (and anything gated on it, e.g. a submit button's
// disabled prop) never updates. click + clear + pressSequentially dispatches
// real key events instead, which WebKit does deliver correctly. Do not
// replace this with .fill() as a "simplification" — it will reintroduce
// WebKit-only flakiness.
export async function fillControlledInput(input: Locator, value: string): Promise<void> {
  await input.click();
  await input.clear();
  await input.pressSequentially(value);
}
