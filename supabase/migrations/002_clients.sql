-- Mark existing companies as clients
alter table companies
add column if not exists is_client boolean default false,
add column if not exists client_notes text;

-- Index for fast client queries
create index if not exists companies_is_client_true_idx
on companies (is_client)
where is_client = true;

-- Update icp_profiles to match the shape Claude will return
alter table icp_profiles
add column if not exists industries text[],
add column if not exists size_range text,
add column if not exists signals text[],
add column if not exists anti_signals text[],
add column if not exists client_count integer,
add column if not exists generated_at timestamptz;
