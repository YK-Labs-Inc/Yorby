create table "public"."coaches" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "custom_domain" text,
    "branding_settings" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone
);


alter table "public"."coaches" enable row level security;

create table "public"."user_coach_access" (
    "user_id" uuid not null,
    "coach_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."user_coach_access" enable row level security;

alter table "public"."custom_jobs" add column "coach_id" uuid;

CREATE UNIQUE INDEX coaches_custom_domain_key ON public.coaches USING btree (custom_domain);

CREATE UNIQUE INDEX coaches_pkey ON public.coaches USING btree (id);

CREATE UNIQUE INDEX coaches_user_id_key ON public.coaches USING btree (user_id);

CREATE UNIQUE INDEX user_coach_access_pkey ON public.user_coach_access USING btree (user_id, coach_id);

alter table "public"."coaches" add constraint "coaches_pkey" PRIMARY KEY using index "coaches_pkey";

alter table "public"."user_coach_access" add constraint "user_coach_access_pkey" PRIMARY KEY using index "user_coach_access_pkey";

alter table "public"."coaches" add constraint "coaches_custom_domain_key" UNIQUE using index "coaches_custom_domain_key";

alter table "public"."coaches" add constraint "coaches_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."coaches" validate constraint "coaches_user_id_fkey";

alter table "public"."coaches" add constraint "coaches_user_id_key" UNIQUE using index "coaches_user_id_key";

alter table "public"."custom_jobs" add constraint "custom_jobs_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE not valid;

alter table "public"."custom_jobs" validate constraint "custom_jobs_coach_id_fkey";

alter table "public"."user_coach_access" add constraint "user_coach_access_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE not valid;

alter table "public"."user_coach_access" validate constraint "user_coach_access_coach_id_fkey";

alter table "public"."user_coach_access" add constraint "user_coach_access_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_coach_access" validate constraint "user_coach_access_user_id_fkey";

grant delete on table "public"."coaches" to "anon";

grant insert on table "public"."coaches" to "anon";

grant references on table "public"."coaches" to "anon";

grant select on table "public"."coaches" to "anon";

grant trigger on table "public"."coaches" to "anon";

grant truncate on table "public"."coaches" to "anon";

grant update on table "public"."coaches" to "anon";

grant delete on table "public"."coaches" to "authenticated";

grant insert on table "public"."coaches" to "authenticated";

grant references on table "public"."coaches" to "authenticated";

grant select on table "public"."coaches" to "authenticated";

grant trigger on table "public"."coaches" to "authenticated";

grant truncate on table "public"."coaches" to "authenticated";

grant update on table "public"."coaches" to "authenticated";

grant delete on table "public"."coaches" to "service_role";

grant insert on table "public"."coaches" to "service_role";

grant references on table "public"."coaches" to "service_role";

grant select on table "public"."coaches" to "service_role";

grant trigger on table "public"."coaches" to "service_role";

grant truncate on table "public"."coaches" to "service_role";

grant update on table "public"."coaches" to "service_role";

grant delete on table "public"."user_coach_access" to "anon";

grant insert on table "public"."user_coach_access" to "anon";

grant references on table "public"."user_coach_access" to "anon";

grant select on table "public"."user_coach_access" to "anon";

grant trigger on table "public"."user_coach_access" to "anon";

grant truncate on table "public"."user_coach_access" to "anon";

grant update on table "public"."user_coach_access" to "anon";

grant delete on table "public"."user_coach_access" to "authenticated";

grant insert on table "public"."user_coach_access" to "authenticated";

grant references on table "public"."user_coach_access" to "authenticated";

grant select on table "public"."user_coach_access" to "authenticated";

grant trigger on table "public"."user_coach_access" to "authenticated";

grant truncate on table "public"."user_coach_access" to "authenticated";

grant update on table "public"."user_coach_access" to "authenticated";

grant delete on table "public"."user_coach_access" to "service_role";

grant insert on table "public"."user_coach_access" to "service_role";

grant references on table "public"."user_coach_access" to "service_role";

grant select on table "public"."user_coach_access" to "service_role";

grant trigger on table "public"."user_coach_access" to "service_role";

grant truncate on table "public"."user_coach_access" to "service_role";

grant update on table "public"."user_coach_access" to "service_role";

create policy "Coaches can manage their own coach record"
on "public"."coaches"
as permissive
for all
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Coaches can manage their B2B custom_jobs"
on "public"."custom_jobs"
as permissive
for all
to public
using (((coach_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = custom_jobs.coach_id) AND (c.user_id = auth.uid()))))))
with check (((coach_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = custom_jobs.coach_id) AND (c.user_id = auth.uid())))) AND (user_id = auth.uid())));


create policy "Coaches can manage user_coach_access entries for their coaching"
on "public"."user_coach_access"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = user_coach_access.coach_id) AND (c.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = user_coach_access.coach_id) AND (c.user_id = auth.uid())))));


create policy "Students can create their own user_coach_access entries"
on "public"."user_coach_access"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Students can delete their own user_coach_access entries"
on "public"."user_coach_access"
as permissive
for delete
to public
using ((auth.uid() = user_id));



