alter table "public"."custom_job_questions" add column "source_custom_job_question_id" uuid;

alter table "public"."custom_job_questions" add constraint "custom_job_questions_source_custom_job_question_id_fkey" FOREIGN KEY (source_custom_job_question_id) REFERENCES custom_job_questions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."custom_job_questions" validate constraint "custom_job_questions_source_custom_job_question_id_fkey";


