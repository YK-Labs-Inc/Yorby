-- Add RLS policy to give users ALL access to recruiter_interview_analysis 
-- if their user_id matches the user_id of the parent custom_job_mock_interviews record

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "user_all_access" ON recruiter_interview_analysis;

-- Create new policy: Give users ALL access if their user_id matches the parent custom_job_mock_interviews.user_id
CREATE POLICY "user_all_access"
  ON recruiter_interview_analysis 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM custom_job_mock_interviews mi
      WHERE mi.id = recruiter_interview_analysis.mock_interview_id
      AND mi.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM custom_job_mock_interviews mi
      WHERE mi.id = recruiter_interview_analysis.mock_interview_id
      AND mi.user_id = auth.uid()
    )
  );

-- Also update the related tables to have the same user access policy
-- This ensures users can see all analysis details for their own interviews

-- recruiter_interview_insights
DROP POLICY IF EXISTS "user_all_access" ON recruiter_interview_insights;
CREATE POLICY "user_all_access"
  ON recruiter_interview_insights
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM recruiter_interview_analysis ria
      JOIN custom_job_mock_interviews mi ON ria.mock_interview_id = mi.id
      WHERE ria.id = recruiter_interview_insights.analysis_id
      AND mi.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM recruiter_interview_analysis ria
      JOIN custom_job_mock_interviews mi ON ria.mock_interview_id = mi.id
      WHERE ria.id = recruiter_interview_insights.analysis_id
      AND mi.user_id = auth.uid()
    )
  );

-- recruiter_interview_strengths
DROP POLICY IF EXISTS "user_all_access" ON recruiter_interview_strengths;
CREATE POLICY "user_all_access"
  ON recruiter_interview_strengths
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM recruiter_interview_analysis ria
      JOIN custom_job_mock_interviews mi ON ria.mock_interview_id = mi.id
      WHERE ria.id = recruiter_interview_strengths.analysis_id
      AND mi.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM recruiter_interview_analysis ria
      JOIN custom_job_mock_interviews mi ON ria.mock_interview_id = mi.id
      WHERE ria.id = recruiter_interview_strengths.analysis_id
      AND mi.user_id = auth.uid()
    )
  );

-- recruiter_interview_concerns
DROP POLICY IF EXISTS "user_all_access" ON recruiter_interview_concerns;
CREATE POLICY "user_all_access"
  ON recruiter_interview_concerns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM recruiter_interview_analysis ria
      JOIN custom_job_mock_interviews mi ON ria.mock_interview_id = mi.id
      WHERE ria.id = recruiter_interview_concerns.analysis_id
      AND mi.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM recruiter_interview_analysis ria
      JOIN custom_job_mock_interviews mi ON ria.mock_interview_id = mi.id
      WHERE ria.id = recruiter_interview_concerns.analysis_id
      AND mi.user_id = auth.uid()
    )
  );

-- recruiter_interview_highlights
DROP POLICY IF EXISTS "user_all_access" ON recruiter_interview_highlights;
CREATE POLICY "user_all_access"
  ON recruiter_interview_highlights
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM recruiter_interview_analysis ria
      JOIN custom_job_mock_interviews mi ON ria.mock_interview_id = mi.id
      WHERE ria.id = recruiter_interview_highlights.analysis_id
      AND mi.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM recruiter_interview_analysis ria
      JOIN custom_job_mock_interviews mi ON ria.mock_interview_id = mi.id
      WHERE ria.id = recruiter_interview_highlights.analysis_id
      AND mi.user_id = auth.uid()
    )
  );

-- recruiter_job_alignment_details
DROP POLICY IF EXISTS "user_all_access" ON recruiter_job_alignment_details;
CREATE POLICY "user_all_access"
  ON recruiter_job_alignment_details
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM recruiter_interview_analysis ria
      JOIN custom_job_mock_interviews mi ON ria.mock_interview_id = mi.id
      WHERE ria.id = recruiter_job_alignment_details.analysis_id
      AND mi.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM recruiter_interview_analysis ria
      JOIN custom_job_mock_interviews mi ON ria.mock_interview_id = mi.id
      WHERE ria.id = recruiter_job_alignment_details.analysis_id
      AND mi.user_id = auth.uid()
    )
  );

-- recruiter_question_analysis
DROP POLICY IF EXISTS "user_all_access" ON recruiter_question_analysis;
CREATE POLICY "user_all_access"
  ON recruiter_question_analysis
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM recruiter_interview_analysis ria
      JOIN custom_job_mock_interviews mi ON ria.mock_interview_id = mi.id
      WHERE ria.id = recruiter_question_analysis.analysis_id
      AND mi.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM recruiter_interview_analysis ria
      JOIN custom_job_mock_interviews mi ON ria.mock_interview_id = mi.id
      WHERE ria.id = recruiter_question_analysis.analysis_id
      AND mi.user_id = auth.uid()
    )
  );

-- Add comment documentation
COMMENT ON POLICY "user_all_access" ON recruiter_interview_analysis IS 'Users have full access to interview analyses for their own mock interviews';
COMMENT ON POLICY "user_all_access" ON recruiter_interview_insights IS 'Users have full access to interview insights for their own mock interviews';
COMMENT ON POLICY "user_all_access" ON recruiter_interview_strengths IS 'Users have full access to interview strengths for their own mock interviews';
COMMENT ON POLICY "user_all_access" ON recruiter_interview_concerns IS 'Users have full access to interview concerns for their own mock interviews';
COMMENT ON POLICY "user_all_access" ON recruiter_interview_highlights IS 'Users have full access to interview highlights for their own mock interviews';
COMMENT ON POLICY "user_all_access" ON recruiter_job_alignment_details IS 'Users have full access to job alignment details for their own mock interviews';
COMMENT ON POLICY "user_all_access" ON recruiter_question_analysis IS 'Users have full access to question analysis for their own mock interviews';