# LeadBase — AI Lead Enrichment CRM

An AI-powered CRM for finding and qualifying B2B leads, built for the Finnish
market. You define an Ideal Customer Profile (ICP) from your existing clients,
then search Apollo.io for companies that match — either by name or by letting
Claude translate your ICP into Apollo search filters automatically. Every
result can be enriched with an AI-generated fit score, summary, and outreach
angle before it's saved as a lead.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4 with CSS variables (dark industrial/terminal design system)
- Framer Motion for all animation
- Supabase — Postgres database, auth, and edge functions
- Anthropic Claude API (Haiku for filter translation, Sonnet for ICP generation and lead scoring)
- Apollo.io API — sole lead search source

All external API calls (Claude, Apollo) run through Supabase edge functions.
Neither the Anthropic key nor the Apollo key is ever present on the client.

## Architecture

```
src/
  app/                    Next.js App Router pages (leads, search, settings)
  components/ui/          ScoreBadge, LeadCard, SearchBar, EmptyState
  components/layout/      Sidebar
  lib/
    supabase/             client.ts (browser) + server.ts (server components)
    types/                apollo.ts, lead.ts

supabase/
  functions/
    apollo-search/        Manual company-name search via Apollo.io
    icp-search/            ICP → Apollo filters (Claude Haiku) → Apollo search
    generate-icp/          Builds an ICP profile from your clients (Claude Sonnet)
    save-client/            Persists a client company
    save-enriched-lead/    Scores a lead against the ICP (Claude Sonnet) + saves it
    _shared/                Shared prompt builders for the enrichment functions
  migrations/               Postgres schema, in order
```

Server components are used by default; client components only where
interactivity is required. All lead scoring returns a fixed JSON contract
(`lead_score`, `icp_fit`, `ai_summary`, `signals`, `concerns`, `outreach_angle`)
— see `save-enriched-lead` and `_shared/enrichment-prompts.ts`.

## Setup

### 1. Clone and install

```bash
npm install
cp .env.example .env
```

### 2. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then from
**Project Settings → API** copy the project URL and publishable (anon) key
into `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

### 3. Run the database migrations

Using the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <project-id>
supabase db push
```

This applies `supabase/migrations/001` through `007` in order.

### 4. Set edge function secrets

The Claude and Apollo API keys live only in Supabase — never in `.env`:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set APOLLO_API_KEY=...
```

### 5. Deploy the edge functions

```bash
supabase functions deploy apollo-search
supabase functions deploy icp-search
supabase functions deploy generate-icp
supabase functions deploy save-client
supabase functions deploy save-enriched-lead
```

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

End-to-end tests run on [Playwright](https://playwright.dev), against
`chromium`, `firefox`, and `webkit`. The suite currently covers:

- a logged-out homepage smoke test (`tests/smoke.spec.ts`)
- auth coverage for login, logout, and protected-route redirects (`tests/auth.spec.ts`)
- authenticated smoke for `/leads`, `/search`, and `/settings` (`tests/app.spec.ts`)

Auth session tests and authenticated smoke need a dedicated Supabase Auth user. Copy the template
and fill in those credentials:

```bash
cp .env.test.example .env.test
```

Playwright logs in once via `tests/auth.setup.ts` and reuses that session for `tests/app.spec.ts`.
`tests/auth.spec.ts` and `tests/smoke.spec.ts` start logged out.

Without `.env.test`, the unauthenticated cases still run; sign-in, sign-out, and authenticated
smoke skip.

```bash
npx playwright install   # first run only, installs browser binaries
npm test                 # starts the dev server and runs the suite
```

`playwright.config.ts` boots `npm run dev` and waits on
`http://localhost:3000` automatically, so a separate dev server isn't
required. Tests also run in CI via `.github/workflows/playwright.yml`.
Add these GitHub Actions secrets so session tests don't skip:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

## What's implemented vs. what was tried and dropped

**Implemented and working end-to-end:**
- Manual company-name search via Apollo.io (`apollo-search`)
- ICP profile generation from your saved clients using Claude Sonnet (`generate-icp`)
- ICP-driven search — Claude Haiku translates the ICP into Apollo filters, then Apollo is queried (`icp-search`)
- AI lead scoring/enrichment against the ICP using Claude Sonnet, with a fixed JSON output contract (`save-enriched-lead`)
- Client management and per-user data scoping (Supabase RLS)

**Tried and deliberately dropped — not an unfinished feature:**
- **pgvector / embedding-based similarity search.** Early versions of the schema included `embedding` columns on `leads` and `icp_profiles`, intended for vector similarity matching between leads and the ICP. In practice, the embedding-generation step was never wired into the enrichment pipeline, no similarity query (`<=>`, `<->`, or an RPC) was ever written, and the columns were never read. Rather than leave dead schema around, `supabase/migrations/007_drop_vector_infra.sql` removes both embedding columns and the `pgvector` extension outright. Lead-to-ICP matching in this project is done via the Claude-based scoring pipeline (`save-enriched-lead`) instead — a decision to keep one enrichment path rather than maintain two, not a cut corner.
