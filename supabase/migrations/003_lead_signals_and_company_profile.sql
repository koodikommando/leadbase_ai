-- Add signals and concerns to leads table
alter table leads
add column if not exists signals text[],
add column if not exists concerns text[];

-- Create company_profile table if it does not exist
create table if not exists company_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company_name text,
  what_we_sell text,
  who_we_sell_to text,
  typical_deal_size text,
  problem_we_solve text,
  updated_at timestamptz default now()
);

-- Unique constraint so upsert works correctly
create unique index if not exists company_profile_user_id_idx
  on company_profile (user_id);

-- Index for fast lookup
create index if not exists company_profile_user_idx
  on company_profile (user_id);
