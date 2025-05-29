alter table "public"."coaches" add column "slug" text not null;

alter table "public"."custom_job_question_submissions" add column "audio_bucket" text;

alter table "public"."custom_job_question_submissions" add column "audio_file_path" text;

alter table "public"."custom_job_question_submissions" add column "audio_recording_duration" numeric;

alter table "public"."custom_job_questions" alter column "publication_status" set default 'draft'::question_publication_status;

CREATE UNIQUE INDEX coaches_slug_key ON public.coaches USING btree (slug);

alter table "public"."coaches" add constraint "coaches_slug_key" UNIQUE using index "coaches_slug_key";

create policy "Allow read access to custom_job_question_sample_answers for use"
on "public"."custom_job_question_sample_answers"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM custom_job_questions
  WHERE (custom_job_questions.source_custom_job_question_id = custom_job_question_sample_answers.question_id))));


create policy "Allow insert if user owns parent custom job"
on "public"."custom_job_question_submission_feedback"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM ((custom_job_question_submissions
     JOIN custom_job_questions ON ((custom_job_question_submissions.custom_job_question_id = custom_job_questions.id)))
     JOIN custom_jobs ON ((custom_job_questions.custom_job_id = custom_jobs.id)))
  WHERE ((custom_job_question_submission_feedback.submission_id = custom_job_question_submissions.id) AND (custom_jobs.user_id = ( SELECT auth.uid() AS uid))))));



