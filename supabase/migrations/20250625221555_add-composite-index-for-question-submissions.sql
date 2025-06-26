-- Add composite index on custom_job_question_submissions for better query performance
-- This index will significantly improve queries that filter by both question_id and user_id

CREATE INDEX IF NOT EXISTS idx_custom_job_question_submissions_question_user 
ON custom_job_question_submissions(custom_job_question_id, user_id);

-- Also add an index for created_at to improve sorting performance
CREATE INDEX IF NOT EXISTS idx_custom_job_question_submissions_created_at
ON custom_job_question_submissions(created_at DESC);

-- Add composite index for the common query pattern in the new enrollment system
CREATE INDEX IF NOT EXISTS idx_custom_job_enrollments_user_coach
ON custom_job_enrollments(user_id, coach_id);