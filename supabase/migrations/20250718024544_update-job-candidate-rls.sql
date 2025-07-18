drop policy "Company members can view their company" on "public"."companies";

drop policy "Company owners and admins can update their company" on "public"."companies";

create policy "All users can SELECT company"
on "public"."companies"
as permissive
for select
to public
using (true);


create policy "Company members have ALL access to their company"
on "public"."companies"
as permissive
for all
to public
using ((id IN ( SELECT company_members.company_id
   FROM company_members
  WHERE ((company_members.user_id = auth.uid()) AND (company_members.role = ANY (ARRAY['owner'::company_member_role, 'admin'::company_member_role])) AND (company_members.accepted_at IS NOT NULL)))))
with check ((id IN ( SELECT company_members.company_id
   FROM company_members
  WHERE ((company_members.user_id = auth.uid()) AND (company_members.role = ANY (ARRAY['owner'::company_member_role, 'admin'::company_member_role])) AND (company_members.accepted_at IS NOT NULL)))));


create policy "Allow all users SELECT access of company_id is not NULL"
on "public"."custom_jobs"
as permissive
for select
to public
using ((company_id IS NOT NULL));



