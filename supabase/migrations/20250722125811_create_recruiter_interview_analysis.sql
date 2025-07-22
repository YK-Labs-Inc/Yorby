-- Create recruiter interview analysis schema with improved structure

-- Create enum for hiring verdict (keeping this as it's appropriately constrained)
CREATE TYPE hiring_verdict AS ENUM ('ADVANCE', 'REJECT', 'BORDERLINE');

-- Main recruiter interview analysis table
CREATE TABLE recruiter_interview_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_interview_id uuid REFERENCES custom_job_mock_interviews(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Primary feedback (above the fold)
  hiring_verdict hiring_verdict NOT NULL,
  verdict_summary text NOT NULL,
  overall_match_score integer NOT NULL CHECK (overall_match_score >= 0 AND overall_match_score <= 100),
  
  -- Processing metadata
  processing_duration_ms integer,
  model_used text,
  input_token_count integer,
  output_token_count integer
);

-- Flexible insights table with free-form types
CREATE TABLE recruiter_interview_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES recruiter_interview_analysis(id) ON DELETE CASCADE NOT NULL,
  insight_type text NOT NULL, -- Free-form: 'strength', 'concern', 'red_flag', 'next_step', etc.
  category text, -- Optional: 'technical', 'behavioral', 'cultural', 'experience'
  title text NOT NULL,
  description text NOT NULL,
  evidence jsonb DEFAULT '{}'::jsonb, -- includes quotes, timestamps
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Table for individual strengths
CREATE TABLE recruiter_interview_strengths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES recruiter_interview_analysis(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  evidence text NOT NULL,
  relevance text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Table for concerns and red flags (consolidated)
CREATE TABLE recruiter_interview_concerns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES recruiter_interview_analysis(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  evidence text, -- Optional evidence/examples
  impact text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')), -- 'critical' = red flag
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);


-- Table for transcript highlights
CREATE TABLE recruiter_interview_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES recruiter_interview_analysis(id) ON DELETE CASCADE NOT NULL,
  highlight_type text NOT NULL, -- Free-form: 'strong_fit', 'concern', 'cultural_alignment', etc.
  quote text NOT NULL,
  context text NOT NULL,
  timestamp_seconds integer, -- Optional timestamp in the interview
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Table for job alignment details
CREATE TABLE recruiter_job_alignment_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES recruiter_interview_analysis(id) ON DELETE CASCADE NOT NULL UNIQUE,
  matched_requirements text[] DEFAULT '{}',
  missing_requirements text[] DEFAULT '{}',
  exceeded_requirements text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);


-- Table for question-level analysis
CREATE TABLE recruiter_question_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES recruiter_interview_analysis(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES custom_job_questions(id) ON DELETE CASCADE,
  question_text text NOT NULL, -- Store question text in case question is deleted
  answer_summary text NOT NULL,
  answer_quality_score integer CHECK (answer_quality_score >= 0 AND answer_quality_score <= 100),
  key_points text[] DEFAULT '{}',
  concerns text[] DEFAULT '{}',
  examples_provided text[] DEFAULT '{}',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_recruiter_interview_analysis_mock_interview_id ON recruiter_interview_analysis(mock_interview_id);
CREATE INDEX idx_recruiter_interview_analysis_verdict ON recruiter_interview_analysis(hiring_verdict);
CREATE INDEX idx_recruiter_interview_analysis_score ON recruiter_interview_analysis(overall_match_score);
CREATE INDEX idx_recruiter_interview_analysis_created ON recruiter_interview_analysis(created_at);
CREATE INDEX idx_recruiter_interview_analysis_verdict_score ON recruiter_interview_analysis(hiring_verdict, overall_match_score DESC);

CREATE INDEX idx_recruiter_interview_insights_analysis_id ON recruiter_interview_insights(analysis_id);
CREATE INDEX idx_recruiter_interview_insights_type ON recruiter_interview_insights(insight_type);
CREATE INDEX idx_recruiter_interview_insights_category ON recruiter_interview_insights(category);

CREATE INDEX idx_recruiter_strengths_analysis ON recruiter_interview_strengths(analysis_id);
CREATE INDEX idx_recruiter_concerns_analysis ON recruiter_interview_concerns(analysis_id);
CREATE INDEX idx_recruiter_concerns_severity ON recruiter_interview_concerns(severity);
CREATE INDEX idx_recruiter_highlights_analysis ON recruiter_interview_highlights(analysis_id);
CREATE INDEX idx_recruiter_highlights_type ON recruiter_interview_highlights(highlight_type);
CREATE INDEX idx_recruiter_job_alignment_analysis ON recruiter_job_alignment_details(analysis_id);
CREATE INDEX idx_recruiter_question_analysis_analysis ON recruiter_question_analysis(analysis_id);
CREATE INDEX idx_recruiter_question_analysis_question ON recruiter_question_analysis(question_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recruiter_interview_analysis_updated_at 
  BEFORE UPDATE ON recruiter_interview_analysis 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE recruiter_interview_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_interview_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_interview_strengths ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_interview_concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_interview_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_job_alignment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_question_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for main analysis table
CREATE POLICY "Company members can view their interview analyses"
  ON recruiter_interview_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM custom_job_mock_interviews mi
      JOIN custom_jobs cj ON mi.custom_job_id = cj.id
      JOIN company_members cm ON cj.company_id = cm.company_id
      WHERE mi.id = recruiter_interview_analysis.mock_interview_id
      AND cm.user_id = auth.uid()
      AND cj.company_id IS NOT NULL
    )
  );

CREATE POLICY "Service role can insert interview analyses"
  ON recruiter_interview_analysis FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update interview analyses"
  ON recruiter_interview_analysis FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for all other tables (using a loop for consistency)
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN 
    SELECT unnest(ARRAY[
      'recruiter_interview_insights',
      'recruiter_interview_strengths',
      'recruiter_interview_concerns',
      'recruiter_interview_highlights',
      'recruiter_job_alignment_details',
      'recruiter_question_analysis'
    ])
  LOOP
    EXECUTE format('
      CREATE POLICY "Company members can view %I"
        ON %I FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM recruiter_interview_analysis ria
            JOIN custom_job_mock_interviews mi ON ria.mock_interview_id = mi.id
            JOIN custom_jobs cj ON mi.custom_job_id = cj.id
            JOIN company_members cm ON cj.company_id = cm.company_id
            WHERE ria.id = %I.analysis_id
            AND cm.user_id = auth.uid()
            AND cj.company_id IS NOT NULL
          )
        )', table_name, table_name, table_name);

    EXECUTE format('
      CREATE POLICY "Service role can manage %I"
        ON %I FOR ALL
        USING (true)
        WITH CHECK (true)', table_name, table_name);
  END LOOP;
END $$;

-- Grant permissions
GRANT SELECT ON 
  recruiter_interview_analysis,
  recruiter_interview_insights,
  recruiter_interview_strengths,
  recruiter_interview_concerns,
  recruiter_interview_highlights,
  recruiter_job_alignment_details,
  recruiter_question_analysis
TO authenticated;

GRANT ALL ON 
  recruiter_interview_analysis,
  recruiter_interview_insights,
  recruiter_interview_strengths,
  recruiter_interview_concerns,
  recruiter_interview_highlights,
  recruiter_job_alignment_details,
  recruiter_question_analysis
TO service_role;

-- Create a view for easy querying of complete analysis
CREATE OR REPLACE VIEW recruiter_interview_analysis_complete AS
SELECT 
  ria.*,
  -- Aggregate strengths
  (SELECT json_agg(
    json_build_object(
      'id', id,
      'title', title,
      'evidence', evidence,
      'relevance', relevance
    ) ORDER BY display_order, created_at
  ) FROM recruiter_interview_strengths WHERE analysis_id = ria.id) as strengths,
  
  -- Aggregate concerns (includes red flags when severity='critical')
  (SELECT json_agg(
    json_build_object(
      'id', id,
      'title', title,
      'description', description,
      'evidence', evidence,
      'impact', impact,
      'severity', severity,
      'is_red_flag', severity = 'critical'
    ) ORDER BY severity = 'critical' DESC, severity = 'high' DESC, display_order, created_at
  ) FROM recruiter_interview_concerns WHERE analysis_id = ria.id) as concerns,
  
  -- Aggregate highlights
  (SELECT json_agg(
    json_build_object(
      'id', id,
      'highlight_type', highlight_type,
      'quote', quote,
      'context', context,
      'timestamp_seconds', timestamp_seconds
    ) ORDER BY display_order, created_at
  ) FROM recruiter_interview_highlights WHERE analysis_id = ria.id) as highlights,
  
  -- Aggregate insights (flexible categorized insights)
  (SELECT json_agg(
    json_build_object(
      'id', id,
      'insight_type', insight_type,
      'category', category,
      'title', title,
      'description', description,
      'evidence', evidence,
      'priority', priority
    ) ORDER BY priority DESC, created_at
  ) FROM recruiter_interview_insights WHERE analysis_id = ria.id) as insights,
  
  -- Aggregate question analysis
  (SELECT json_agg(
    json_build_object(
      'id', id,
      'question_id', question_id,
      'question_text', question_text,
      'answer_summary', answer_summary,
      'answer_quality_score', answer_quality_score,
      'key_points', key_points,
      'concerns', concerns,
      'examples_provided', examples_provided
    ) ORDER BY display_order
  ) FROM recruiter_question_analysis WHERE analysis_id = ria.id) as question_analysis,
  
  -- Job alignment details
  jad.matched_requirements,
  jad.missing_requirements,
  jad.exceeded_requirements
  
FROM recruiter_interview_analysis ria
LEFT JOIN recruiter_job_alignment_details jad ON jad.analysis_id = ria.id;

-- Grant permissions on the view
GRANT SELECT ON recruiter_interview_analysis_complete TO authenticated;

-- Add comment documentation
COMMENT ON TABLE recruiter_interview_analysis IS 'Main table for AI-generated interview analysis for recruiters';
COMMENT ON TABLE recruiter_interview_strengths IS 'Stores individual strength insights from candidate interviews';
COMMENT ON TABLE recruiter_interview_concerns IS 'Stores concerns and red flags (severity=critical) from candidate interviews';
COMMENT ON TABLE recruiter_interview_highlights IS 'Stores notable quotes and moments from interview transcripts';
COMMENT ON TABLE recruiter_question_analysis IS 'Stores question-by-question analysis of candidate responses';
COMMENT ON TABLE recruiter_job_alignment_details IS 'Stores detailed job requirement matching analysis';
COMMENT ON COLUMN recruiter_interview_insights.insight_type IS 'Free-form type allowing flexibility in categorization';
COMMENT ON COLUMN recruiter_interview_highlights.highlight_type IS 'Free-form type (e.g., strong_fit, concern, cultural_alignment, technical_expertise)';