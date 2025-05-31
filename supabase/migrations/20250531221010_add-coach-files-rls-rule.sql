create policy "Allow authenticated users to read files 1yykfpu_0"
on "storage"."objects"
as permissive
for select
to authenticated
using ((bucket_id = 'coach_files'::text));



