-- Update recruiter analysis tables to use company interview system

-- Step 1: Drop the existing view that depends on these tables
DROP VIEW IF EXISTS recruiter_interview_analysis_complete CASCADE;

-- Step 2: Update recruiter_interview_analysis table
-- Drop the existing foreign key constraint
ALTER TABLE recruiter_interview_analysis 
  DROP CONSTRAINT IF EXISTS recruiter_interview_analysis_mock_interview_id_fkey;

-- Rename the column
ALTER TABLE recruiter_interview_analysis 
  RENAME COLUMN mock_interview_id TO candidate_interview_id;

-- Add new foreign key to candidate_job_interviews
ALTER TABLE recruiter_interview_analysis
  ADD CONSTRAINT recruiter_interview_analysis_candidate_interview_id_fkey
  FOREIGN KEY (candidate_interview_id) 
  REFERENCES candidate_job_interviews(id) 
  ON DELETE CASCADE;

-- Update the unique constraint
ALTER TABLE recruiter_interview_analysis
  DROP CONSTRAINT IF EXISTS recruiter_interview_analysis_mock_interview_id_key;
  
ALTER TABLE recruiter_interview_analysis
  ADD CONSTRAINT recruiter_interview_analysis_candidate_interview_id_key
  UNIQUE (candidate_interview_id);

-- Step 3: Update recruiter_question_analysis table
-- Drop the existing foreign key constraint to custom_job_questions
ALTER TABLE recruiter_question_analysis
  DROP CONSTRAINT IF EXISTS recruiter_question_analysis_question_id_fkey;

-- Add new foreign key to company_interview_question_bank
ALTER TABLE recruiter_question_analysis
  ADD CONSTRAINT recruiter_question_analysis_question_id_fkey
  FOREIGN KEY (question_id)
  REFERENCES company_interview_question_bank(id)
  ON DELETE CASCADE;

-- Step 4: Create updated view with new relationships
CREATE OR REPLACE VIEW recruiter_interview_analysis_complete AS
SELECT 
  -- Main analysis data
  ria.id,
  ria.candidate_interview_id,
  ria.created_at,
  ria.updated_at,
  ria.hiring_verdict,
  ria.verdict_summary,
  ria.overall_match_score,
  ria.processing_duration_ms,
  ria.model_used,
  ria.input_token_count,
  ria.output_token_count,
  
  -- Aggregated strengths
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', ris.id,
        'title', ris.title,
        'evidence', ris.evidence,
        'relevance', ris.relevance,
        'display_order', ris.display_order
      )
    ) FILTER (WHERE ris.id IS NOT NULL),
    '[]'::json
  ) AS strengths,
  
  -- Aggregated concerns
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', ric.id,
        'title', ric.title,
        'description', ric.description,
        'evidence', ric.evidence
      )
    ) FILTER (WHERE ric.id IS NOT NULL),
    '[]'::json
  ) AS concerns,
  
  -- Aggregated insights
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', rii.id,
        'insight_type', rii.insight_type,
        'category', rii.category,
        'title', rii.title,
        'description', rii.description,
        'evidence', rii.evidence,
        'priority', rii.priority
      )
    ) FILTER (WHERE rii.id IS NOT NULL),
    '[]'::json
  ) AS insights,
  
  -- Aggregated highlights
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', rih.id,
        'highlight_type', rih.highlight_type,
        'quote', rih.quote,
        'context', rih.context,
        'timestamp_seconds', rih.timestamp_seconds,
        'display_order', rih.display_order
      )
    ) FILTER (WHERE rih.id IS NOT NULL),
    '[]'::json
  ) AS highlights,
  
  -- Job alignment details
  rjad.matched_requirements,
  rjad.missing_requirements,
  rjad.exceeded_requirements,
  
  -- Question analysis
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', rqa.id,
        'question_id', rqa.question_id,
        'question_text', rqa.question_text,
        'user_answer', rqa.user_answer,
        'answer_quality_score', rqa.answer_quality_score,
        'key_points', rqa.key_points,
        'concerns', rqa.concerns,
        'examples_provided', rqa.examples_provided,
        'display_order', rqa.display_order
      )
    ) FILTER (WHERE rqa.id IS NOT NULL),
    '[]'::json
  ) AS question_analysis

FROM recruiter_interview_analysis ria
LEFT JOIN recruiter_interview_strengths ris ON ris.analysis_id = ria.id
LEFT JOIN recruiter_interview_concerns ric ON ric.analysis_id = ria.id
LEFT JOIN recruiter_interview_insights rii ON rii.analysis_id = ria.id
LEFT JOIN recruiter_interview_highlights rih ON rih.analysis_id = ria.id
LEFT JOIN recruiter_job_alignment_details rjad ON rjad.analysis_id = ria.id
LEFT JOIN recruiter_question_analysis rqa ON rqa.analysis_id = ria.id

GROUP BY 
  ria.id,
  ria.candidate_interview_id,
  ria.created_at,
  ria.updated_at,
  ria.hiring_verdict,
  ria.verdict_summary,
  ria.overall_match_score,
  ria.processing_duration_ms,
  ria.model_used,
  ria.input_token_count,
  ria.output_token_count,
  rjad.matched_requirements,
  rjad.missing_requirements,
  rjad.exceeded_requirements;

-- Step 5: Update RLS policies for recruiter_interview_analysis
-- Drop existing policies
DROP POLICY IF EXISTS "Company members can view interview analysis" ON recruiter_interview_analysis;
DROP POLICY IF EXISTS "Company members can create interview analysis" ON recruiter_interview_analysis;
DROP POLICY IF EXISTS "Company members can update interview analysis" ON recruiter_interview_analysis;
DROP POLICY IF EXISTS "Company members can delete interview analysis" ON recruiter_interview_analysis;
DROP POLICY IF EXISTS "Candidates can view their own interview analysis" ON recruiter_interview_analysis;

-- Create new policies using candidate_job_interviews relationship
CREATE POLICY "Company members can view interview analysis" ON recruiter_interview_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidate_job_interviews cci
      JOIN company_job_candidates cjc ON cjc.id = cci.candidate_id
      JOIN company_members cm ON cm.company_id = cjc.company_id
      WHERE cci.id = recruiter_interview_analysis.candidate_interview_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can manage interview analysis" ON recruiter_interview_analysis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM candidate_job_interviews cci
      JOIN company_job_candidates cjc ON cjc.id = cci.candidate_id
      JOIN company_members cm ON cm.company_id = cjc.company_id
      WHERE cci.id = recruiter_interview_analysis.candidate_interview_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin', 'recruiter')
    )
  );

CREATE POLICY "Candidates can view their own interview analysis" ON recruiter_interview_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidate_job_interviews cci
      JOIN company_job_candidates cjc ON cjc.id = cci.candidate_id
      WHERE cci.id = recruiter_interview_analysis.candidate_interview_id
      AND cjc.candidate_user_id = auth.uid()
    )
  );

-- Step 6: Update RLS policies for all related tables
-- Similar pattern for other tables that reference analysis_id
-- (They don't need changes since they still reference recruiter_interview_analysis)

-- Step 7: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recruiter_interview_analysis_candidate_interview_id 
  ON recruiter_interview_analysis(candidate_interview_id);

-- Note: Since this is a breaking change for an unreleased feature,
-- we're not migrating any existing data. The tables should be empty.