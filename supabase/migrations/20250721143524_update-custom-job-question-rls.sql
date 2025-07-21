create policy "Provide user SELECT access if they are a candidate to the paren"
on "public"."custom_job_questions"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM company_job_candidates
  WHERE ((company_job_candidates.custom_job_id = custom_job_questions.custom_job_id) AND (company_job_candidates.candidate_user_id = auth.uid())))));



