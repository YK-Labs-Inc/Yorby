create policy "Company members can view candidate files"
on "public"."user_files"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ((candidate_application_files caf
     JOIN company_job_candidates cjc ON ((caf.candidate_id = cjc.id)))
     JOIN company_members cm ON ((cjc.company_id = cm.company_id)))
  WHERE ((caf.file_id = user_files.id) AND (cm.user_id = auth.uid())))));



