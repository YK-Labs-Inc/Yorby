create policy "Company members can view candidate files 84ce0l_0"
on "storage"."objects"
as permissive
for select
to public
using (((bucket_id = 'user-files'::text) AND (EXISTS ( SELECT 1
   FROM (((user_files uf
     JOIN candidate_application_files caf ON ((caf.file_id = uf.id)))
     JOIN company_job_candidates cjc ON ((caf.candidate_id = cjc.id)))
     JOIN company_members cm ON ((cjc.company_id = cm.company_id)))
  WHERE ((uf.file_path = objects.name) AND (uf.bucket_name = 'user-files'::text) AND (cm.user_id = auth.uid()))))));



