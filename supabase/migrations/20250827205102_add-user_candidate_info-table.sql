
  create table "public"."user_candidate_info" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "candidate_info" text not null
      );


alter table "public"."user_candidate_info" enable row level security;

CREATE UNIQUE INDEX user_candidate_info_pkey ON public.user_candidate_info USING btree (id);

alter table "public"."user_candidate_info" add constraint "user_candidate_info_pkey" PRIMARY KEY using index "user_candidate_info_pkey";

alter table "public"."user_candidate_info" add constraint "user_candidate_info_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."user_candidate_info" validate constraint "user_candidate_info_id_fkey";

grant delete on table "public"."user_candidate_info" to "anon";

grant insert on table "public"."user_candidate_info" to "anon";

grant references on table "public"."user_candidate_info" to "anon";

grant select on table "public"."user_candidate_info" to "anon";

grant trigger on table "public"."user_candidate_info" to "anon";

grant truncate on table "public"."user_candidate_info" to "anon";

grant update on table "public"."user_candidate_info" to "anon";

grant delete on table "public"."user_candidate_info" to "authenticated";

grant insert on table "public"."user_candidate_info" to "authenticated";

grant references on table "public"."user_candidate_info" to "authenticated";

grant select on table "public"."user_candidate_info" to "authenticated";

grant trigger on table "public"."user_candidate_info" to "authenticated";

grant truncate on table "public"."user_candidate_info" to "authenticated";

grant update on table "public"."user_candidate_info" to "authenticated";

grant delete on table "public"."user_candidate_info" to "service_role";

grant insert on table "public"."user_candidate_info" to "service_role";

grant references on table "public"."user_candidate_info" to "service_role";

grant select on table "public"."user_candidate_info" to "service_role";

grant trigger on table "public"."user_candidate_info" to "service_role";

grant truncate on table "public"."user_candidate_info" to "service_role";

grant update on table "public"."user_candidate_info" to "service_role";


  create policy "Enable all for users based on user_id"
  on "public"."user_candidate_info"
  as permissive
  for all
  to public
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));



