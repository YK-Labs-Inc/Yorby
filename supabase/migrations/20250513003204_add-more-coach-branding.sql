create table "public"."coach_branding" (
    "created_at" timestamp with time zone not null default now(),
    "coach_id" uuid not null,
    "primary_color_hex" text not null,
    "title" text not null
);


alter table "public"."coach_branding" enable row level security;

alter table "public"."coaches" drop column "branding_settings";

CREATE UNIQUE INDEX coach_branding_coach_id_key ON public.coach_branding USING btree (coach_id);

CREATE UNIQUE INDEX coach_branding_pkey ON public.coach_branding USING btree (coach_id);

alter table "public"."coach_branding" add constraint "coach_branding_pkey" PRIMARY KEY using index "coach_branding_pkey";

alter table "public"."coach_branding" add constraint "coach_branding_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coaches(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."coach_branding" validate constraint "coach_branding_coach_id_fkey";

alter table "public"."coach_branding" add constraint "coach_branding_coach_id_key" UNIQUE using index "coach_branding_coach_id_key";

grant delete on table "public"."coach_branding" to "anon";

grant insert on table "public"."coach_branding" to "anon";

grant references on table "public"."coach_branding" to "anon";

grant select on table "public"."coach_branding" to "anon";

grant trigger on table "public"."coach_branding" to "anon";

grant truncate on table "public"."coach_branding" to "anon";

grant update on table "public"."coach_branding" to "anon";

grant delete on table "public"."coach_branding" to "authenticated";

grant insert on table "public"."coach_branding" to "authenticated";

grant references on table "public"."coach_branding" to "authenticated";

grant select on table "public"."coach_branding" to "authenticated";

grant trigger on table "public"."coach_branding" to "authenticated";

grant truncate on table "public"."coach_branding" to "authenticated";

grant update on table "public"."coach_branding" to "authenticated";

grant delete on table "public"."coach_branding" to "service_role";

grant insert on table "public"."coach_branding" to "service_role";

grant references on table "public"."coach_branding" to "service_role";

grant select on table "public"."coach_branding" to "service_role";

grant trigger on table "public"."coach_branding" to "service_role";

grant truncate on table "public"."coach_branding" to "service_role";

grant update on table "public"."coach_branding" to "service_role";

create policy "Allow read access to coach_branding for users with coach access"
on "public"."coach_branding"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_coach_access
  WHERE ((user_coach_access.user_id = auth.uid()) AND (user_coach_access.coach_id = user_coach_access.coach_id)))));



