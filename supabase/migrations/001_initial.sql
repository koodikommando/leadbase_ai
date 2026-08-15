-- Enable pgvector extension for semantic search / embeddings
create extension if not exists vector;

-- ─── Companies ────────────────────────────────────────────────────────────────
create table companies (
  id             uuid        primary key default gen_random_uuid(),
  apollo_id      text        unique,                   -- Apollo.io person/org ID
  name           text        not null,
  domain         text,
  industry       text,
  employee_count integer,
  country        text,
  city           text,
  linkedin_url   text,
  raw_apollo     jsonb,                                -- full Apollo response stored here
  created_at     timestamptz default now()
);

-- ─── Leads ────────────────────────────────────────────────────────────────────
create table leads (
  id              uuid        primary key default gen_random_uuid(),
  company_id      uuid        references companies(id) on delete cascade,
  lead_score      integer     check (lead_score between 0 and 100),
  icp_fit         text        check (icp_fit in ('high', 'medium', 'low')),
  outreach_angle  text,
  status          text        default 'new' check (status in ('new', 'contacted', 'qualified', 'disqualified')),
  embedding       vector(1536),
  ai_summary      text,
  created_at      timestamptz default now()
);

-- ─── ICP Profiles ─────────────────────────────────────────────────────────────
create table icp_profiles (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  embedding   vector(1536),
  criteria    jsonb,
  created_at  timestamptz default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
-- IVFFlat index for approximate nearest-neighbor search on lead embeddings
create index on leads using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- IVFFlat index for ICP profile embeddings
create index on icp_profiles using ivfflat (embedding vector_cosine_ops)
  with (lists = 10);

-- Fast lookup by Apollo ID
create index on companies (apollo_id);

-- Fast lookup by company
create index on leads (company_id);

-- Score-sorted queries
create index on leads (lead_score desc);
