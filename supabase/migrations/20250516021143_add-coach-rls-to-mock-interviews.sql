create policy "Allow read access if user is coach of parent custom job"
on "public"."custom_job_mock_interview_feedback"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (custom_job_mock_interviews
     JOIN custom_jobs ON ((custom_job_mock_interviews.custom_job_id = custom_jobs.id)))
  WHERE ((custom_job_mock_interviews.id = custom_job_mock_interview_feedback.mock_interview_id) AND (custom_jobs.coach_id = ( SELECT coaches.id
           FROM coaches
          WHERE (coaches.user_id = auth.uid())))))));


create policy "Allow read access for users who are coaches of the parent custo"
on "public"."custom_job_mock_interviews"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM custom_jobs
  WHERE ((custom_jobs.id = custom_job_mock_interviews.custom_job_id) AND (custom_jobs.coach_id IN ( SELECT user_coach_access.coach_id
           FROM user_coach_access
          WHERE (user_coach_access.user_id = auth.uid())))))));


create policy "Allow read access if user is a coach of the parent custom job"
on "public"."custom_job_mock_interviews"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (custom_jobs
     JOIN coaches ON ((custom_jobs.coach_id = coaches.id)))
  WHERE ((custom_jobs.id = custom_job_mock_interviews.custom_job_id) AND (coaches.user_id = ( SELECT auth.uid() AS uid))))));


create policy "Allow read access if the user is a coach of parent custom job"
on "public"."mock_interview_messages"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ((custom_job_mock_interviews
     JOIN custom_jobs ON ((custom_job_mock_interviews.custom_job_id = custom_jobs.id)))
     JOIN coaches ON ((custom_jobs.coach_id = coaches.id)))
  WHERE ((custom_job_mock_interviews.id = mock_interview_messages.mock_interview_id) AND (coaches.user_id = auth.uid())))));


create policy "Allow read access if user is coach of parent custom job"
on "public"."mock_interview_question_feedback"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ((custom_job_mock_interviews
     JOIN custom_jobs ON ((custom_job_mock_interviews.custom_job_id = custom_jobs.id)))
     JOIN coaches ON ((custom_jobs.coach_id = coaches.id)))
  WHERE ((custom_job_mock_interviews.id = mock_interview_question_feedback.mock_interview_id) AND (coaches.user_id = auth.uid())))));



