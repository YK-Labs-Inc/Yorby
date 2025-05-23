alter table "public"."custom_job_question_submission_feedback" add column "confidence_score" numeric not null;

alter table "public"."custom_job_question_submission_feedback" add constraint "custom_job_question_submission_feedback_confidence_score_check" CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric))) not valid;

alter table "public"."custom_job_question_submission_feedback" validate constraint "custom_job_question_submission_feedback_confidence_score_check";


