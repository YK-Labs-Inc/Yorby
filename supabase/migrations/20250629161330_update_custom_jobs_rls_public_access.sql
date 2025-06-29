-- Drop the existing policy that restricts access to users with coach access
DROP POLICY IF EXISTS "Allow select access to custom_jobs for users with coach access" ON custom_jobs;

-- Create new policy that allows all users to read custom_jobs where coach_id is not null
-- This allows public access to coach programs without requiring authentication
CREATE POLICY "Allow public read access to coach custom_jobs"
ON "public"."custom_jobs"
AS PERMISSIVE
FOR SELECT
TO public
USING (coach_id IS NOT NULL);