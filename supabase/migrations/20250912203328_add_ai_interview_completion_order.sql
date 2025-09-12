-- Add ai_interview_completion_order column to track the order in which candidates complete AI interviews
ALTER TABLE company_job_candidates 
ADD COLUMN ai_interview_completion_order INTEGER DEFAULT NULL;

-- Add index for efficient queries when filtering by company and ordering
CREATE INDEX idx_company_job_candidates_ai_completion_order 
ON company_job_candidates(company_id, ai_interview_completion_order);

-- Add comment to explain the column's purpose
COMMENT ON COLUMN company_job_candidates.ai_interview_completion_order IS 
'The order in which this candidate completed their AI interview within the company (1-based). Used for free tier limits.';