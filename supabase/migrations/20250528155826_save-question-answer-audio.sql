alter table "public"."custom_job_question_submissions" add column "audio_bucket" text;

alter table "public"."custom_job_question_submissions" add column "audio_file_path" text;

create policy "Allow read access to custom_job_question_sample_answers for use"
on "public"."custom_job_question_sample_answers"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM custom_job_questions
  WHERE (custom_job_questions.source_custom_job_question_id = custom_job_question_sample_answers.question_id))));



