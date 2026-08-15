alter table public.companies enable row level security;
alter table public.leads enable row level security;
alter table public.icp_profiles enable row level security;
alter table public.company_profile enable row level security;

alter table public.companies alter column user_id set not null;
alter table public.leads alter column user_id set not null;
alter table public.icp_profiles alter column user_id set not null;
alter table public.company_profile alter column user_id set not null;

drop policy if exists "companies_select" on public.companies;
drop policy if exists "companies_insert" on public.companies;
drop policy if exists "companies_update" on public.companies;
drop policy if exists "companies_delete" on public.companies;
drop policy if exists "companies_owner" on public.companies;
create policy "companies_owner" on public.companies
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "leads_select" on public.leads;
drop policy if exists "leads_insert" on public.leads;
drop policy if exists "leads_update" on public.leads;
drop policy if exists "leads_delete" on public.leads;
drop policy if exists "leads_owner" on public.leads;
create policy "leads_owner" on public.leads
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "icp_profiles_select" on public.icp_profiles;
drop policy if exists "icp_profiles_insert" on public.icp_profiles;
drop policy if exists "icp_profiles_update" on public.icp_profiles;
drop policy if exists "icp_profiles_delete" on public.icp_profiles;
drop policy if exists "icp_profiles_owner" on public.icp_profiles;
create policy "icp_profiles_owner" on public.icp_profiles
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "company_profile_all" on public.company_profile;
drop policy if exists "company_profile_owner" on public.company_profile;
create policy "company_profile_owner" on public.company_profile
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
