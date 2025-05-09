create policy "Enable read access for all users"
on "public"."coaches"
as permissive
for select
to public
using (true);



