-- Update recruiter_interview_analysis_complete view to use user_answer instead of answer_summary
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
  
  -- Aggregate question analysis (updated to use user_answer)
  (SELECT json_agg(
    json_build_object(
      'id', id,
      'question_id', question_id,
      'question_text', question_text,
      'user_answer', user_answer,
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