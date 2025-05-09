create policy "Allow select access to custom_job_questions for users with coac"
on "public"."custom_job_questions"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_coach_access
  WHERE ((user_coach_access.user_id = auth.uid()) AND (user_coach_access.coach_id = ( SELECT custom_jobs.coach_id
           FROM custom_jobs
          WHERE (custom_jobs.id = custom_job_questions.custom_job_id)))))));


create policy "Allow select access to custom_jobs for users with coach access"
on "public"."custom_jobs"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_coach_access
  WHERE ((user_coach_access.user_id = auth.uid()) AND (user_coach_access.coach_id = custom_jobs.coach_id)))));



