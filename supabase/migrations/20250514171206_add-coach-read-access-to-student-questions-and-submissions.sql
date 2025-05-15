create policy "Allow user read access if they are coach of the parent custom j"
on "public"."custom_job_question_submissions"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ((custom_job_questions
     JOIN custom_jobs ON ((custom_job_questions.custom_job_id = custom_jobs.id)))
     JOIN coaches ON ((custom_jobs.coach_id = coaches.id)))
  WHERE ((custom_job_questions.id = custom_job_question_submissions.custom_job_question_id) AND (coaches.user_id = auth.uid())))));


create policy "Allow user to select question if they are the coach of the pare"
on "public"."custom_job_questions"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (custom_jobs
     JOIN coaches ON ((custom_jobs.coach_id = coaches.id)))
  WHERE ((custom_jobs.id = custom_job_questions.custom_job_id) AND (coaches.user_id = ( SELECT auth.uid() AS uid))))));



