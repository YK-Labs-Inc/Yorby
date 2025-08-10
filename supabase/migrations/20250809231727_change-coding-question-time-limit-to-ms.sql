alter table "public"."company_interview_coding_question_metadata" drop column "time_limit";

alter table "public"."company_interview_coding_question_metadata" add column "time_limit_ms" numeric not null;


