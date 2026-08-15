-- Drop the global unique constraint on apollo_id
alter table companies
drop constraint if exists companies_apollo_id_key;

-- Replace with per-user unique constraint
alter table companies
add constraint companies_apollo_id_user_id_key
unique (apollo_id, user_id);
