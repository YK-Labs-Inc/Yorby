create policy "Company members can view candidate mock interview messages"
on "public"."mock_interview_messages"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ((custom_job_mock_interviews cjmi
     JOIN custom_jobs cj ON ((cjmi.custom_job_id = cj.id)))
     JOIN company_members cm ON ((cj.company_id = cm.company_id)))
  WHERE ((cjmi.id = mock_interview_messages.mock_interview_id) AND (cm.user_id = auth.uid()) AND (cm.accepted_at IS NOT NULL) AND (cjmi.candidate_id IS NOT NULL)))));



