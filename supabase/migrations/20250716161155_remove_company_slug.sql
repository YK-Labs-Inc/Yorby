-- Remove slug column from companies table
ALTER TABLE companies DROP COLUMN IF EXISTS slug;

-- Drop any indexes on the slug column
DROP INDEX IF EXISTS companies_slug_idx;
DROP INDEX IF EXISTS companies_slug_unique_idx;