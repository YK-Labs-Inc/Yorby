-- Add user_id field to custom_job_question_submissions table
ALTER TABLE custom_job_question_submissions
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_custom_job_question_submissions_user_id ON custom_job_question_submissions(user_id);