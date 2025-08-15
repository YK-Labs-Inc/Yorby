create or replace view "public"."coding_interview_analysis_view" as  SELECT cji.id AS candidate_interview_id,
    cji.candidate_id,
    cji.interview_id,
    cji.status AS interview_status,
    cji.started_at,
    cji.completed_at,
    ciqb.id AS question_id,
    ciqb.question AS question_text,
    ciqb.answer AS question_answer,
    ciqb.question_type,
    ( SELECT jics.submission_text
           FROM job_interview_coding_submissions jics
          WHERE ((jics.candidate_interview_id = cji.id) AND (jics.question_id = ciqb.id))
          ORDER BY jics.created_at DESC
         LIMIT 1) AS user_last_submission,
    ria.id AS analysis_id,
    ria.hiring_verdict,
    ria.verdict_summary,
    ria.overall_match_score,
    ria.model_used,
    ria.processing_duration_ms,
    ria.created_at AS analysis_created_at,
    COALESCE(( SELECT json_agg(json_build_object('id', ris.id, 'title', ris.title, 'evidence', ris.evidence, 'relevance', ris.relevance, 'display_order', ris.display_order) ORDER BY ris.display_order, ris.created_at) AS json_agg
           FROM recruiter_interview_strengths ris
          WHERE (ris.analysis_id = ria.id)), '[]'::json) AS interview_strengths,
    COALESCE(( SELECT json_agg(json_build_object('id', ric.id, 'title', ric.title, 'description', ric.description, 'evidence', ric.evidence) ORDER BY ric.created_at) AS json_agg
           FROM recruiter_interview_concerns ric
          WHERE (ric.analysis_id = ria.id)), '[]'::json) AS interview_weaknesses
   FROM ((((candidate_job_interviews cji
     JOIN job_interviews ji ON ((ji.id = cji.interview_id)))
     JOIN job_interview_questions jiq ON ((jiq.interview_id = ji.id)))
     JOIN company_interview_question_bank ciqb ON ((ciqb.id = jiq.question_id)))
     LEFT JOIN recruiter_interview_analysis ria ON ((ria.candidate_interview_id = cji.id)))
  WHERE (ji.interview_type = 'coding'::job_interview_type)
  ORDER BY cji.created_at DESC, jiq.order_index;



