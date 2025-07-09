-- RLS policies for mock_interview_google_storage_metadata table

-- Policy 1: Give users ALL access if their user_id == the parent custom_job_mock_interviews.user_id field
create policy "user_all_access"
on "public"."mock_interview_google_storage_metadata"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM custom_job_mock_interviews cjmi
  WHERE ((cjmi.id = mock_interview_google_storage_metadata.id) AND (cjmi.user_id = auth.uid())))));

-- Policy 2: Give user READ access if their coaches.id field == the parent custom_jobs.coach_id field
create policy "coach_read_access"
on "public"."mock_interview_google_storage_metadata"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ((custom_job_mock_interviews cjmi
     JOIN custom_jobs cj ON ((cjmi.custom_job_id = cj.id)))
     JOIN coaches c ON ((cj.coach_id = c.id)))
  WHERE ((cjmi.id = mock_interview_google_storage_metadata.id) AND (c.user_id = auth.uid())))));