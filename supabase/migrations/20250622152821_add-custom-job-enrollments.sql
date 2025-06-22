create table "public"."custom_job_enrollments" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "coach_id" uuid not null,
    "custom_job_id" uuid not null
);


alter table "public"."custom_job_enrollments" enable row level security;

CREATE UNIQUE INDEX custom_job_enrollments_pkey ON public.custom_job_enrollments USING btree (id);

alter table "public"."custom_job_enrollments" add constraint "custom_job_enrollments_pkey" PRIMARY KEY using index "custom_job_enrollments_pkey";

CREATE UNIQUE INDEX custom_job_enrollments_user_id_custom_job_id_key ON public.custom_job_enrollments USING btree (user_id, custom_job_id);

alter table "public"."custom_job_enrollments" add constraint "custom_job_enrollments_user_id_custom_job_id_key" UNIQUE using index "custom_job_enrollments_user_id_custom_job_id_key";

alter table "public"."custom_job_enrollments" add constraint "custom_job_enrollments_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coaches(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."custom_job_enrollments" validate constraint "custom_job_enrollments_coach_id_fkey";

alter table "public"."custom_job_enrollments" add constraint "custom_job_enrollments_custom_job_id_fkey" FOREIGN KEY (custom_job_id) REFERENCES custom_jobs(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."custom_job_enrollments" validate constraint "custom_job_enrollments_custom_job_id_fkey";

alter table "public"."custom_job_enrollments" add constraint "custom_job_enrollments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."custom_job_enrollments" validate constraint "custom_job_enrollments_user_id_fkey";

grant delete on table "public"."custom_job_enrollments" to "anon";

grant insert on table "public"."custom_job_enrollments" to "anon";

grant references on table "public"."custom_job_enrollments" to "anon";

grant select on table "public"."custom_job_enrollments" to "anon";

grant trigger on table "public"."custom_job_enrollments" to "anon";

grant truncate on table "public"."custom_job_enrollments" to "anon";

grant update on table "public"."custom_job_enrollments" to "anon";

grant delete on table "public"."custom_job_enrollments" to "authenticated";

grant insert on table "public"."custom_job_enrollments" to "authenticated";

grant references on table "public"."custom_job_enrollments" to "authenticated";

grant select on table "public"."custom_job_enrollments" to "authenticated";

grant trigger on table "public"."custom_job_enrollments" to "authenticated";

grant truncate on table "public"."custom_job_enrollments" to "authenticated";

grant update on table "public"."custom_job_enrollments" to "authenticated";

grant delete on table "public"."custom_job_enrollments" to "service_role";

grant insert on table "public"."custom_job_enrollments" to "service_role";

grant references on table "public"."custom_job_enrollments" to "service_role";

grant select on table "public"."custom_job_enrollments" to "service_role";

grant trigger on table "public"."custom_job_enrollments" to "service_role";

grant truncate on table "public"."custom_job_enrollments" to "service_role";

grant update on table "public"."custom_job_enrollments" to "service_role";


