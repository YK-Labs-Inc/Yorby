-- Add RLS policy to custom_job_question_submission_mux_metadata table
-- Users have ALL access to mux_metadata if they own the parent submission

-- Policy 1: Allow users full access to mux_metadata for their own submissions
CREATE POLICY "Users can manage mux_metadata for their submissions"
ON "public"."custom_job_question_submission_mux_metadata"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_question_submissions cjqs
        WHERE cjqs.id = custom_job_question_submission_mux_metadata.id
        AND cjqs.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM custom_job_question_submissions cjqs
        WHERE cjqs.id = custom_job_question_submission_mux_metadata.id
        AND cjqs.user_id = auth.uid()
    )
);

-- Policy 2: Allow coaches SELECT access to metadata from enrolled students
CREATE POLICY "Coaches can view metadata from enrolled students"
ON "public"."custom_job_question_submission_mux_metadata"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_question_submissions cjqs
        JOIN custom_job_questions cjq ON cjqs.custom_job_question_id = cjq.id
        JOIN custom_job_enrollments cje ON cje.custom_job_id = cjq.custom_job_id
        JOIN coaches c ON cje.coach_id = c.id
        WHERE c.user_id = auth.uid()
        AND cjqs.id = custom_job_question_submission_mux_metadata.id
        AND cje.user_id = cjqs.user_id
    )
);