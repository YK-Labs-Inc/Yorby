drop policy "Candidates can update their interview status" on "public"."candidate_job_interviews";

drop policy "Candidates can view their own interviews" on "public"."candidate_job_interviews";

drop policy "Company members can view job interviews" on "public"."job_interviews";

create policy "Candidates can manage their own interviews"
on "public"."candidate_job_interviews"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM company_job_candidates
  WHERE ((company_job_candidates.id = candidate_job_interviews.candidate_id) AND (company_job_candidates.candidate_user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM company_job_candidates
  WHERE ((company_job_candidates.id = candidate_job_interviews.candidate_id) AND (company_job_candidates.candidate_user_id = auth.uid())))));


create policy "Authenticated users can read interviews"
on "public"."job_interviews"
as permissive
for select
to authenticated
using (true);



