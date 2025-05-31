alter table "public"."custom_job_question_submission_feedback" add column "correctness_score" numeric;

alter table "public"."custom_job_question_submission_feedback" add constraint "custom_job_question_submission_feedback_correctness_score_check" CHECK (((correctness_score >= (0)::numeric) AND (correctness_score <= (100)::numeric))) not valid;

alter table "public"."custom_job_question_submission_feedback" validate constraint "custom_job_question_submission_feedback_correctness_score_check";


