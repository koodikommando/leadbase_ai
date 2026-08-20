# Testing

## Overview

The suite is [Playwright](https://playwright.dev) end-to-end tests, run against
`chromium`, `firefox`, and `webkit`. There is no separate unit-test runner in
this repo — coverage today is entirely e2e, driving the app through the
browser against a real Next.js dev server. See `README.md`'s Testing section
for the current file-by-file list of what's covered.

This is a size-appropriate choice for the project as it stands, not an
oversight: the app is thin (a handful of pages, a few edge functions with
straightforward request/response contracts), and e2e coverage through the UI
already exercises the client code, the edge-function boundary, and the
Supabase auth flow together. See "Out of scope" below for what a larger
version of this suite would add.

## Mocking strategy

`apollo-search` and `save-enriched-lead` are third-party- and AI-backed edge
functions (Apollo.io and Claude respectively). The default suite mocks both
at the network boundary with Playwright's `page.route()`, using fixtures
under `tests/fixtures/`:

- `tests/fixtures/apollo-search-facebook.json` — a mapped `apollo-search`
  response, used by `tests/e2e/search.spec.ts` and `tests/e2e/enrichment.spec.ts`.
- `tests/fixtures/enrichment-result.json` — a `save-enriched-lead` response,
  used by `tests/e2e/enrichment.spec.ts` (which also mocks the `leads`
  PostgREST `GET` so the saved lead renders on `/leads` without touching a
  real database row).

This keeps `npm test` fast, deterministic, and free of live-API flakiness —
no Apollo rate limits, no Claude cost or latency, no dependence on either
service being up.

`tests/e2e/search.live.spec.ts` is the deliberate exception: it hits the
real Apollo API through the real `apollo-search` function. It's tagged
`@live`, isolated into its own Playwright project (see `playwright.config.ts`
— `testIgnore` keeps it out of the `chromium`/`firefox`/`webkit` projects,
and a dedicated `live` project matches it), and run separately via
`npm run test:live`. In CI it's the `e2e-live` job, `continue-on-error: true`
— informational only, never blocks a PR. Its purpose is to catch real
Apollo response/contract drift that a fixture can't.

## Auth strategy

`tests/e2e/auth.setup.ts` is a Playwright "setup project": it signs in once
against a real, dedicated Supabase Auth test account
(`TEST_USER_EMAIL`/`TEST_USER_PASSWORD`) and persists the session via
`page.context().storageState()`. The `chromium`, `firefox`, and `webkit`
projects declare `dependencies: ['setup']` and reuse that `storageState`
(see `playwright.config.ts`), so every test other than the auth flow itself
starts already signed in — no repeated login per test.

Auth is the one thing this suite does **not** mock. Since `tests/e2e/auth.spec.ts`
exists specifically to verify sign-in, sign-out, protected-route redirects,
and session persistence, mocking Supabase Auth would mean testing a fake
version of the exact thing under test. It's a live call, but scoped to a
dedicated test account rather than a personal one, and every mutating flow
that matters for the rest of the suite (search, enrichment, saving leads) is
mocked separately so it doesn't depend on this account's data.

Without `.env.test` configured, the unauthenticated cases in `auth.spec.ts`
still run; anything requiring a signed-in session skips.

## CI structure

`.github/workflows/playwright.yml` runs two dependent jobs on every push and
PR:

- **`checks`** — `tsc --noEmit` and `npm run lint`. No dependency; runs first.
- **`e2e`** — `needs: checks`. Runs the mocked, three-browser suite
  (`npm test`). A type or lint error blocks this from running at all, so CI
  doesn't spend time booting browsers and a dev server on code that's
  already known to be broken.

A third job, **`e2e-live`**, also depends on `checks` but is
`continue-on-error: true` — it runs `search.live.spec.ts` against the real
Apollo API and reports separately, without ever failing the required checks
on a PR.

## The hydration wait

`tests/helpers/dom.ts` exports `waitForHydration(page)`, which calls
`page.waitForLoadState('networkidle')`. It's called right after `page.goto()`,
before any `fill()` or click, in `tests/helpers/auth.ts`'s `fillCredentials`
and directly in `search.spec.ts`/`enrichment.spec.ts`.

This app's inputs are visible and interactable in the SSR-rendered HTML
before React hydration has attached their `onChange` listeners. Interacting
with an input in that gap sets the DOM value with nothing listening for it,
so anything gated on that state (a submit button's `disabled` prop) never
unlocks. Playwright's own actionability checks don't know about hydration —
the input is visible and enabled from the raw HTML alone — so this needs an
explicit wait. It showed up almost exclusively on WebKit, whose automation
driver is slow enough to lose the race more often than Chromium or Firefox.

`networkidle` was picked deliberately, not as a default reach-for-it choice.
Playwright's docs generally discourage it as a general-purpose readiness
signal, because apps with persistent background polling or long-lived
connections can make it slow or never settle. This app doesn't have that:
there's no polling, and Next.js's dev-mode HMR socket doesn't count against
the idle check. In this codebase, waiting for network-idle is a reliable
proxy for "hydration has had a chance to complete" specifically because the
`/search` page's own post-hydration effect (fetching the ICP profile) is
itself a network call — network settling can't happen before hydration has
started here. There's no app-level "hydrated" marker to wait on instead;
adding one would be the more robust long-term fix but is out of scope for
now.

## Out of scope (for now)

These are deliberate scoping decisions for the project's current size, not
gaps that were missed:

- **No ephemeral/staging database.** Tests either mock the data layer
  entirely (search, enrichment) or hit a real, dedicated Supabase test
  account (auth) that isn't reset between runs. A per-run ephemeral Postgres
  or Supabase branch would give stronger isolation but is real
  infrastructure to stand up and maintain — not justified yet at this
  suite's size.
- **No separate unit-test framework.** Introducing something like Vitest for
  pure-function coverage (response mapping, JSON parsing in the edge
  functions) is a reasonable next step, but would add a second test runner
  and config to maintain. Not done yet; the e2e suite exercises that code
  indirectly today.
- **No API-level tests independent of the UI.** Everything currently drives
  through the browser. A Playwright `APIRequestContext` test hitting an edge
  function directly (bypassing the UI) would be a lower-cost way to add
  contract coverage without a new framework — a likely next addition, not
  yet landed.
