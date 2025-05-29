create policy "Give users access to coaches folder of a user 84ce0l_0"
on "storage"."objects"
as permissive
for select
to public
using (((bucket_id = 'user-files'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[3])));



