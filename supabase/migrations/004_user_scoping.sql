-- Multi-tenancy: add user_id to all tables
alter table companies
add column if not exists user_id uuid references auth.users(id);

alter table leads
add column if not exists user_id uuid references auth.users(id);

alter table icp_profiles
add column if not exists user_id uuid references auth.users(id);

-- Enable RLS
alter table companies enable row level security;
alter table leads enable row level security;
alter table icp_profiles enable row level security;
alter table company_profile enable row level security;

-- Ownership policies
drop policy if exists "companies_owner" on companies;
create policy "companies_owner" on companies
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "leads_owner" on leads;
create policy "leads_owner" on leads
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "icp_profiles_owner" on icp_profiles;
create policy "icp_profiles_owner" on icp_profiles
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "company_profile_owner" on company_profile;
create policy "company_profile_owner" on company_profile
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Indexes
create index if not exists companies_user_id_idx on companies (user_id);
create index if not exists leads_user_id_idx on leads (user_id);
create index if not exists icp_profiles_user_id_idx on icp_profiles (user_id);
