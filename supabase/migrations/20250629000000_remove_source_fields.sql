-- Drop the RLS policy that depends on source_custom_job_question_id
DROP POLICY IF EXISTS "Allow read access to custom_job_question_sample_answers for use" ON custom_job_question_sample_answers;

-- Remove source_custom_job_id from custom_jobs table
ALTER TABLE custom_jobs DROP COLUMN IF EXISTS source_custom_job_id;

-- Remove source_custom_job_question_id from custom_job_questions table
ALTER TABLE custom_job_questions DROP COLUMN IF EXISTS source_custom_job_question_id;