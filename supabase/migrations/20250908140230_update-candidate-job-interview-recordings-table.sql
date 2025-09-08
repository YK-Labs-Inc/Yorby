drop policy "Candidates can create/update recordings" on "public"."candidate_job_interview_recordings";

drop policy "Candidates can view their recordings" on "public"."candidate_job_interview_recordings";

drop policy "Company members can view recordings" on "public"."candidate_job_interview_recordings";

alter table "public"."candidate_job_interview_recordings" drop constraint "job_interview_recordings_candidate_interview_id_fkey";

alter table "public"."candidate_job_interview_recordings" drop constraint "job_interview_recordings_pkey";

drop index if exists "public"."job_interview_recordings_pkey";

drop index if exists "public"."idx_job_interview_recordings_candidate_interview_id";

alter table "public"."candidate_job_interview_recordings" drop column "candidate_interview_id";

alter table "public"."candidate_job_interview_recordings" alter column "id" drop default;

CREATE INDEX idx_job_interview_recordings_candidate_interview_id ON public.candidate_job_interview_recordings USING btree (id);

alter table "public"."candidate_job_interview_recordings" add constraint "job_interview_recordings_candidate_interview_id_fkey" FOREIGN KEY (id) REFERENCES candidate_job_interviews(id) ON DELETE CASCADE not valid;

alter table "public"."candidate_job_interview_recordings" validate constraint "job_interview_recordings_candidate_interview_id_fkey";


  create policy "Candidates can create/update recordings"
  on "public"."candidate_job_interview_recordings"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM (candidate_job_interviews
     JOIN company_job_candidates ON ((company_job_candidates.id = candidate_job_interviews.candidate_id)))
  WHERE ((candidate_job_interviews.id = candidate_job_interview_recordings.id) AND (company_job_candidates.candidate_user_id = auth.uid())))));



  create policy "Candidates can view their recordings"
  on "public"."candidate_job_interview_recordings"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (candidate_job_interviews
     JOIN company_job_candidates ON ((company_job_candidates.id = candidate_job_interviews.candidate_id)))
  WHERE ((candidate_job_interviews.id = candidate_job_interview_recordings.id) AND (company_job_candidates.candidate_user_id = auth.uid())))));



  create policy "Company members can view recordings"
  on "public"."candidate_job_interview_recordings"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM ((candidate_job_interviews
     JOIN company_job_candidates ON ((company_job_candidates.id = candidate_job_interviews.candidate_id)))
     JOIN company_members ON ((company_members.company_id = company_job_candidates.company_id)))
  WHERE ((candidate_job_interviews.id = candidate_job_interview_recordings.id) AND (company_members.user_id = auth.uid())))));



