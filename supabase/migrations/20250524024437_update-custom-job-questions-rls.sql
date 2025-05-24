create type "public"."question_publication_status" as enum ('draft', 'published');

drop policy "Allow select access to custom_job_questions for users with coac" on "public"."custom_job_questions";

drop policy "Allow user to select question if they are the coach of the pare" on "public"."custom_job_questions";

alter table "public"."custom_job_questions" add column "publication_status" question_publication_status not null default 'draft'::question_publication_status;

create policy "Allow user all access if they are coach of the parent custom jo"
on "public"."custom_job_questions"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (custom_jobs
     JOIN coaches ON ((custom_jobs.coach_id = coaches.id)))
  WHERE ((custom_jobs.id = custom_job_questions.custom_job_id) AND (coaches.user_id = ( SELECT auth.uid() AS uid))))))
with check ((EXISTS ( SELECT 1
   FROM (custom_jobs
     JOIN coaches ON ((custom_jobs.coach_id = coaches.id)))
  WHERE ((custom_jobs.id = custom_job_questions.custom_job_id) AND (coaches.user_id = ( SELECT auth.uid() AS uid))))));



