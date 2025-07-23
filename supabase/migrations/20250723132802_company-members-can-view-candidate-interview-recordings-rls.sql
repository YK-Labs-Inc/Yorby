create policy "Company members can view candidate interview recordings"
on "public"."mock_interview_mux_metadata"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((custom_job_mock_interviews cjmi
     JOIN custom_jobs cj ON ((cjmi.custom_job_id = cj.id)))
     JOIN company_members cm ON ((cj.company_id = cm.company_id)))
  WHERE ((cjmi.id = mock_interview_mux_metadata.id) AND (cm.user_id = auth.uid())))));



