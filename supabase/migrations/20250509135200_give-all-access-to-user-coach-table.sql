drop policy "Students can create their own user_coach_access entries" on "public"."user_coach_access";

drop policy "Students can delete their own user_coach_access entries" on "public"."user_coach_access";

create policy "Enable all for users based on user_id"
on "public"."user_coach_access"
as permissive
for all
to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



