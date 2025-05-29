create policy "Allow read access to custom_job_questions for users with coach "
on "public"."custom_job_questions"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_coach_access
  WHERE ((user_coach_access.user_id = auth.uid()) AND (user_coach_access.coach_id = ( SELECT custom_jobs.coach_id
           FROM custom_jobs
          WHERE (custom_jobs.id = custom_job_questions.custom_job_id)))))));



