// Types for recruiter_interview_analysis_complete view JSON fields

export interface Strength {
  id: string;
  title: string;
  evidence: string;
  relevance: string;
}

export interface Concern {
  id: string;
  title: string;
  description: string;
  evidence: string | null;
  impact: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  is_red_flag: boolean;
}

export interface Highlight {
  id: string;
  highlight_type: string;
  quote: string;
  context: string;
  timestamp_seconds: number | null;
}

export interface Insight {
  id: string;
  insight_type: string;
  category: string;
  title: string;
  description: string;
  evidence: string | null;
  priority: number;
}

export interface QuestionAnalysis {
  id: string;
  question_id: string;
  question_text: string;
  answer_summary: string;
  answer_quality_score: number | null;
  key_points: string[] | null;
  concerns: string[] | null;
  examples_provided: boolean | null;
}

// Type for the complete interview analysis with properly typed JSON fields
export interface TypedInterviewAnalysis {
  id: string | null;
  mock_interview_id: string | null;
  hiring_verdict: 'ADVANCE' | 'REJECT' | 'BORDERLINE' | null;
  overall_match_score: number | null;
  verdict_summary: string | null;
  processing_duration_ms: number | null;
  input_token_count: number | null;
  output_token_count: number | null;
  model_used: string | null;
  created_at: string | null;
  updated_at: string | null;
  strengths: Strength[] | null;
  concerns: Concern[] | null;
  highlights: Highlight[] | null;
  insights: Insight[] | null;
  question_analysis: QuestionAnalysis[] | null;
  matched_requirements: string[] | null;
  missing_requirements: string[] | null;
  exceeded_requirements: string[] | null;
}