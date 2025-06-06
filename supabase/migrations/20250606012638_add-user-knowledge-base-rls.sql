create policy "Allow read access to user_knowledge_base for users with coach a"
on "public"."user_knowledge_base"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (user_coach_access
     JOIN coaches ON ((user_coach_access.coach_id = coaches.id)))
  WHERE ((user_coach_access.user_id = auth.uid()) AND (user_knowledge_base.user_id = coaches.user_id)))));



