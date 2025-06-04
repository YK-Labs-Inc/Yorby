create policy "Give coach access to a user's recordings 1909oor_0"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'mock-interview-messages'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[3])));


create policy "Give users access to own folder 1909oor_0"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'mock-interview-messages'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1909oor_1"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'mock-interview-messages'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1909oor_2"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'mock-interview-messages'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1909oor_3"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'mock-interview-messages'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



