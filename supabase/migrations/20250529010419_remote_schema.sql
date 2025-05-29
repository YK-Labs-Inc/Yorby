drop policy "Allow read access to custom_job_question_sample_answers for use" on "public"."custom_job_question_sample_answers";

alter table "public"."coaches" drop constraint "coaches_slug_key";

drop index if exists "public"."coaches_slug_key";

alter table "public"."coaches" drop column "slug";

alter table "public"."custom_job_question_submissions" drop column "audio_bucket";

alter table "public"."custom_job_question_submissions" drop column "audio_file_path";

alter table "public"."custom_job_questions" alter column "publication_status" set default 'published'::question_publication_status;


