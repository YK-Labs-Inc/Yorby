-- Add RLS policies to custom_job_question_submission_feedback table
-- Using the user_id field from submissions for simplified access control

-- Policy 1: Allow users to manage feedback for their own submissions
CREATE POLICY "Users can manage feedback for their submissions"
ON "public"."custom_job_question_submission_feedback"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_question_submissions cjqs
        WHERE cjqs.id = custom_job_question_submission_feedback.submission_id
        AND cjqs.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM custom_job_question_submissions cjqs
        WHERE cjqs.id = custom_job_question_submission_feedback.submission_id
        AND cjqs.user_id = auth.uid()
    )
);

-- Policy 2: Allow coaches to manage feedback for enrolled students
CREATE POLICY "Coaches can manage feedback for enrolled students"
ON "public"."custom_job_question_submission_feedback"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_question_submissions cjqs
        JOIN custom_job_questions cjq ON cjqs.custom_job_question_id = cjq.id
        JOIN custom_job_enrollments cje ON cje.custom_job_id = cjq.custom_job_id
        JOIN coaches c ON cje.coach_id = c.id
        WHERE c.user_id = auth.uid()
        AND cjqs.id = custom_job_question_submission_feedback.submission_id
        AND cje.user_id = cjqs.user_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM custom_job_question_submissions cjqs
        JOIN custom_job_questions cjq ON cjqs.custom_job_question_id = cjq.id
        JOIN custom_job_enrollments cje ON cje.custom_job_id = cjq.custom_job_id
        JOIN coaches c ON cje.coach_id = c.id
        WHERE c.user_id = auth.uid()
        AND cjqs.id = custom_job_question_submission_feedback.submission_id
        AND cje.user_id = cjqs.user_id
    )
);