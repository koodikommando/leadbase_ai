-- Drop unused pgvector / embedding infrastructure.
--
-- These columns were dead weight: leads.embedding was never written, and no
-- similarity query (<=>, <->, or an RPC) exists anywhere in the codebase, so
-- neither embedding column was ever read. The OpenAI embedding-generation step
-- that used to populate icp_profiles.embedding has been removed. Dropping the
-- columns also drops their IVFFlat indexes automatically.

alter table leads drop column if exists embedding;
alter table icp_profiles drop column if exists embedding;

-- Nothing else in the schema uses the vector type once the columns are gone.
drop extension if exists vector;
