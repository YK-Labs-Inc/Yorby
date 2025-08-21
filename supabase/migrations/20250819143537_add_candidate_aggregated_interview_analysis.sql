-- Create table for aggregated interview analysis across all rounds
CREATE TABLE candidate_aggregated_interview_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES company_job_candidates(id) ON DELETE CASCADE,
  
  -- Core decision fields
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  hiring_verdict hiring_verdict NOT NULL,
  verdict_rationale TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one aggregation per candidate
  CONSTRAINT unique_candidate_aggregation UNIQUE (candidate_id)
);

-- Create index for performance
CREATE INDEX idx_candidate_aggregated_analysis_candidate 
  ON candidate_aggregated_interview_analysis(candidate_id);

-- Create index for filtering by verdict
CREATE INDEX idx_candidate_aggregated_analysis_verdict 
  ON candidate_aggregated_interview_analysis(hiring_verdict);

-- Add RLS policies
ALTER TABLE candidate_aggregated_interview_analysis ENABLE ROW LEVEL SECURITY;

-- Policy: Company members can view aggregated analysis for their candidates
CREATE POLICY "Company members can view their candidate aggregations" 
  ON candidate_aggregated_interview_analysis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM company_job_candidates cjc
      JOIN company_members cm ON cm.company_id = cjc.company_id
      WHERE cjc.id = candidate_aggregated_interview_analysis.candidate_id
      AND cm.user_id = auth.uid()
      AND cm.accepted_at IS NOT NULL
    )
  );

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_candidate_aggregated_interview_analysis_updated_at
  BEFORE UPDATE ON candidate_aggregated_interview_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE candidate_aggregated_interview_analysis IS 
  'Stores the final aggregated hiring verdict and score across all interview rounds for a candidate';
COMMENT ON COLUMN candidate_aggregated_interview_analysis.overall_score IS 
  'Weighted average score across all interview rounds (0-100)';
COMMENT ON COLUMN candidate_aggregated_interview_analysis.hiring_verdict IS 
  'Final hiring decision: ADVANCE (hire), REJECT (no hire), or BORDERLINE (needs discussion)';
COMMENT ON COLUMN candidate_aggregated_interview_analysis.verdict_rationale IS 
  'AI-generated explanation of the hiring verdict, synthesizing insights from all interview rounds';