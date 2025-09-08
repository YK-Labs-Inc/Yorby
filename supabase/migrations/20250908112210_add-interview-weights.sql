-- Add interview weight enum and columns for weighted average feature
-- This enables recruiters to assign importance levels to interview rounds and questions

-- Create the interview weight enum type
CREATE TYPE interview_weight AS ENUM (
    'low',
    'normal',
    'high'
);

-- Add weight column to job_interviews table (interview rounds)
ALTER TABLE job_interviews 
ADD COLUMN weight interview_weight NOT NULL DEFAULT 'normal';

-- Add weight column to job_interview_questions table (individual questions)
ALTER TABLE job_interview_questions 
ADD COLUMN weight interview_weight NOT NULL DEFAULT 'normal';

-- Add indexes for better performance when querying by weight
CREATE INDEX idx_job_interviews_weight ON job_interviews(weight);
CREATE INDEX idx_job_interview_questions_weight ON job_interview_questions(weight);