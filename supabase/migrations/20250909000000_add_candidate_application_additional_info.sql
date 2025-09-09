-- Create table for candidate application additional information
-- This table stores portfolio links, social profiles, and other text-based information
-- that candidates want to include with their job application
CREATE TABLE candidate_application_additional_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES company_job_candidates(id) ON DELETE CASCADE,
  
  -- The actual URL or text content
  value TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_candidate_additional_info_candidate 
  ON candidate_application_additional_info(candidate_id);

-- Add RLS policies
ALTER TABLE candidate_application_additional_info ENABLE ROW LEVEL SECURITY;

-- Policy: Company members can view additional info for candidates they have access to
CREATE POLICY "Company members can view candidate additional info" 
  ON candidate_application_additional_info
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM company_job_candidates cjc
      JOIN company_members cm ON cm.company_id = cjc.company_id
      WHERE cjc.id = candidate_application_additional_info.candidate_id
      AND cm.user_id = auth.uid()
      AND cm.accepted_at IS NOT NULL
    )
  );

-- Policy: Users have full access to their own additional info
CREATE POLICY "Users have full access to their own additional info"
  ON candidate_application_additional_info
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM company_job_candidates cjc
      WHERE cjc.id = candidate_application_additional_info.candidate_id
      AND cjc.candidate_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM company_job_candidates cjc
      WHERE cjc.id = candidate_application_additional_info.candidate_id
      AND cjc.candidate_user_id = auth.uid()
    )
  );

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_candidate_additional_info_updated_at
  BEFORE UPDATE ON candidate_application_additional_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE candidate_application_additional_info IS 
  'Stores additional information provided by candidates during job application, such as portfolio links, social profiles, and other relevant URLs or text';
COMMENT ON COLUMN candidate_application_additional_info.value IS 
  'The URL, link, or text content for the additional information provided by the candidate';