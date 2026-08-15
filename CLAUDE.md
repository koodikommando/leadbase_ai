# CRM — AI Lead Enrichment

## Project overview
AI-powered CRM focused on lead search and enrichment via Apollo.io and Claude API.
Built for Finnish B2B market targeting.

## Tech stack
- Next.js 14+ App Router
- TypeScript (strict mode)
- Tailwind CSS + CSS variables (no arbitrary colors)
- Framer Motion for all animations
- Supabase (database + edge functions)
- Anthropic Claude API (via Supabase edge function proxy only)
- Apollo.io API (via Supabase edge function proxy only)

## Architecture rules — never break these
- ALL external API calls go through Supabase edge functions, never from client
- Claude API key lives only in Supabase edge function secrets
- Apollo.io API key lives only in Supabase edge function secrets (APOLLO_API_KEY)
- Server components by default, client components only when interactivity required
- Supabase server client in server components, browser client only in client components

## Design system
- Theme: dark industrial/terminal aesthetic
- CSS variables defined in globals.css — always use these, never hardcode colors
- Accent color: #c8ff00 (phosphor green)
- Background base: #0a0a0a
- Fonts: Bebas Neue (headings), DM Mono (body/UI), Space Mono (numbers)
- Never use: Inter, Roboto, Arial, system-ui
- No border-radius over 4px
- No drop shadows — use background elevation instead
- Borders: 1px solid var(--border)

## Animation rules (Framer Motion)
- Page enter: stagger children 0.05s, y: 20→0, opacity: 0→1
- Duration: 0.2–0.3s, ease: [0.25, 0, 0, 1]
- No bounce, no spring, no playful easing
- Score badge: counter animation 0 → value on mount
- AnimatePresence on all list/search results

## File structure
src/
  app/                        # Next.js App Router pages
  components/
    ui/                       # ScoreBadge, LeadCard, SearchBar, EmptyState
    layout/                   # Sidebar
  lib/
    supabase/                 # client.ts + server.ts
    types/                    # apollo.ts, lead.ts
supabase/
  functions/
    apollo-search/            # Manual company-name search via Apollo.io
    icp-search/               # ICP → Apollo filters (Claude Haiku) + Apollo search
    generate-icp/             # Builds ICP profile from clients (Claude Sonnet)
    save-client/              # Persists a client company
    save-enriched-lead/       # Scores a lead vs ICP (Claude Sonnet) + saves it
    _shared/                  # enrichment-prompts.ts (system/user prompt builders)
  migrations/

## Search — current status
Search: Apollo.io organization search API — the sole lead source. Requires the APOLLO_API_KEY secret set in Supabase edge function secrets.
Both manual company-name search and ICP discovery run through Apollo.io; results are enriched with Claude.

## AI enrichment — Claude prompt contract
Lead scoring runs in the save-enriched-lead edge function, which takes an
ApolloOrganization as input and builds its prompts via _shared/enrichment-prompts.ts.
Always returns this exact JSON shape — do not change the contract:
{
  "lead_score": number (0-100),
  "icp_fit": "high" | "medium" | "low",
  "ai_summary": string (1-2 sentences),
  "signals": string[],
  "concerns": string[],
  "outreach_angle": string (one sentence)
}

## TypeScript rules
- Strict mode always on
- Interfaces for all API responses — especially ApolloOrganization and ApolloSearchResponse
- No `any` types
- All async functions must handle errors explicitly

## What not to do
- Do not add features not asked for
- Do not refactor working code unless asked
- Do not add comments to code that is self-explanatory
- Do not change the design system tokens
- Do not call external APIs directly from client components
- Do not use placeholder/lorem ipsum content — use realistic mock data

## Current todos
- [ ] Add settings page