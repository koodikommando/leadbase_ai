import type { Page } from '@playwright/test';

// This app's inputs are already interactable in the SSR-rendered DOM before
// React hydration attaches their onChange listeners — the HTML looks ready
// to Playwright well before the app actually is. fill() (or any interaction)
// called into that gap sets the DOM value with no listener to catch it, so
// anything gated on that state (e.g. a submit button's disabled prop) never
// unlocks. This shows up most on WebKit, whose automation driver is slow
// enough to lose the race more often than Chromium/Firefox. Call this right
// after goto(), before any interaction, so fill() always lands post-hydration.
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}
