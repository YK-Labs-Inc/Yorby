-- Add RLS policy to allow coaches to SELECT custom_job_question_submissions
-- for students who are enrolled in their custom jobs through custom_job_enrollments
-- Uses the user_id field in submissions table to match enrolled students

CREATE POLICY "Coaches can view submissions from enrolled students"
ON "public"."custom_job_question_submissions"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_enrollments cje
        JOIN custom_job_questions cjq ON cje.custom_job_id = cjq.custom_job_id
        JOIN coaches c ON cje.coach_id = c.id
        WHERE c.user_id = auth.uid()
        AND cjq.id = custom_job_question_submissions.custom_job_question_id
        AND cje.user_id = custom_job_question_submissions.user_id
    )
);