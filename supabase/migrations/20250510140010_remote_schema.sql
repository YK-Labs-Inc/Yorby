create policy "Allow all operations to authenticated users 85hn0y_0"
on "storage"."objects"
as permissive
for insert
to authenticated
with check ((bucket_id = 'temp-audio-recordings'::text));


create policy "Allow all operations to authenticated users 85hn0y_1"
on "storage"."objects"
as permissive
for select
to authenticated
using ((bucket_id = 'temp-audio-recordings'::text));


create policy "Allow all operations to authenticated users 85hn0y_2"
on "storage"."objects"
as permissive
for update
to authenticated
using ((bucket_id = 'temp-audio-recordings'::text));


create policy "Allow all operations to authenticated users 85hn0y_3"
on "storage"."objects"
as permissive
for delete
to authenticated
using ((bucket_id = 'temp-audio-recordings'::text));


create policy "Allow select for admins 11qdz3b_0"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'mock_interviews'::text) AND (( SELECT (((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean AS bool) = true)));


create policy "Allow select for admins"
on "storage"."objects"
as permissive
for select
to authenticated
using ((( SELECT (((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean AS bool) = true));


create policy "Enable insert for public users 1bsg7ak_0"
on "storage"."objects"
as permissive
for insert
to public
with check ((bucket_id = 'interview_copilot_demo_files'::text));


create policy "Enable read for all 1bqp9qb_0"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'assets'::text));


create policy "Give users access to own folder 11qdz3b_0"
on "storage"."objects"
as permissive
for select
to public
using (((bucket_id = 'mock_interviews'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 11qdz3b_1"
on "storage"."objects"
as permissive
for update
to public
using (((bucket_id = 'mock_interviews'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 11qdz3b_2"
on "storage"."objects"
as permissive
for insert
to public
with check (((bucket_id = 'mock_interviews'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 11qdz3b_3"
on "storage"."objects"
as permissive
for delete
to public
using (((bucket_id = 'mock_interviews'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1422tk7_0"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'custom_job_files'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1422tk7_1"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'custom_job_files'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1422tk7_2"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'custom_job_files'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1422tk7_3"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'custom_job_files'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 75ffcj_0"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'interview_copilot_recordings'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 75ffcj_1"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'interview_copilot_recordings'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 75ffcj_2"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'interview_copilot_recordings'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 75ffcj_3"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'interview_copilot_recordings'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 84ce0l_0"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'user-files'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 84ce0l_1"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'user-files'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 84ce0l_2"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'user-files'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 84ce0l_3"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'user-files'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder m9avpi_0"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'interview_copilot_files'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder m9avpi_1"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'interview_copilot_files'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder m9avpi_2"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'interview_copilot_files'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder m9avpi_3"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'interview_copilot_files'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



