-- Add RLS policy to allow users full access to their own submissions
-- Users can manage submissions where auth.uid() = user_id

CREATE POLICY "Users can manage their own submissions"
ON "public"."custom_job_question_submissions"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);