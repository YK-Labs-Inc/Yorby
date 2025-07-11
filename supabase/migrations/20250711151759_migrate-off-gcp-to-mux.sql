drop policy "coach_read_access" on "public"."mock_interview_google_storage_metadata";

drop policy "user_all_access" on "public"."mock_interview_google_storage_metadata";

revoke delete on table "public"."mock_interview_google_storage_metadata" from "anon";

revoke insert on table "public"."mock_interview_google_storage_metadata" from "anon";

revoke references on table "public"."mock_interview_google_storage_metadata" from "anon";

revoke select on table "public"."mock_interview_google_storage_metadata" from "anon";

revoke trigger on table "public"."mock_interview_google_storage_metadata" from "anon";

revoke truncate on table "public"."mock_interview_google_storage_metadata" from "anon";

revoke update on table "public"."mock_interview_google_storage_metadata" from "anon";

revoke delete on table "public"."mock_interview_google_storage_metadata" from "authenticated";

revoke insert on table "public"."mock_interview_google_storage_metadata" from "authenticated";

revoke references on table "public"."mock_interview_google_storage_metadata" from "authenticated";

revoke select on table "public"."mock_interview_google_storage_metadata" from "authenticated";

revoke trigger on table "public"."mock_interview_google_storage_metadata" from "authenticated";

revoke truncate on table "public"."mock_interview_google_storage_metadata" from "authenticated";

revoke update on table "public"."mock_interview_google_storage_metadata" from "authenticated";

revoke delete on table "public"."mock_interview_google_storage_metadata" from "service_role";

revoke insert on table "public"."mock_interview_google_storage_metadata" from "service_role";

revoke references on table "public"."mock_interview_google_storage_metadata" from "service_role";

revoke select on table "public"."mock_interview_google_storage_metadata" from "service_role";

revoke trigger on table "public"."mock_interview_google_storage_metadata" from "service_role";

revoke truncate on table "public"."mock_interview_google_storage_metadata" from "service_role";

revoke update on table "public"."mock_interview_google_storage_metadata" from "service_role";

alter table "public"."mock_interview_google_storage_metadata" drop constraint "mock_interview_google_storage_metadata_id_fkey";

alter table "public"."mock_interview_google_storage_metadata" drop constraint "mock_interview_google_storage_metadata_pkey";

drop index if exists "public"."mock_interview_google_storage_metadata_pkey";

drop table "public"."mock_interview_google_storage_metadata";

create table "public"."mock_interview_mux_metadata" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "status" mux_status not null,
    "upload_id" text not null,
    "asset_id" text,
    "playback_id" text
);


alter table "public"."mock_interview_mux_metadata" enable row level security;

CREATE UNIQUE INDEX mock_interview_google_storage_metadata_pkey ON public.mock_interview_mux_metadata USING btree (id);

alter table "public"."mock_interview_mux_metadata" add constraint "mock_interview_google_storage_metadata_pkey" PRIMARY KEY using index "mock_interview_google_storage_metadata_pkey";

alter table "public"."mock_interview_mux_metadata" add constraint "mock_interview_google_storage_metadata_id_fkey" FOREIGN KEY (id) REFERENCES custom_job_mock_interviews(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."mock_interview_mux_metadata" validate constraint "mock_interview_google_storage_metadata_id_fkey";

grant delete on table "public"."mock_interview_mux_metadata" to "anon";

grant insert on table "public"."mock_interview_mux_metadata" to "anon";

grant references on table "public"."mock_interview_mux_metadata" to "anon";

grant select on table "public"."mock_interview_mux_metadata" to "anon";

grant trigger on table "public"."mock_interview_mux_metadata" to "anon";

grant truncate on table "public"."mock_interview_mux_metadata" to "anon";

grant update on table "public"."mock_interview_mux_metadata" to "anon";

grant delete on table "public"."mock_interview_mux_metadata" to "authenticated";

grant insert on table "public"."mock_interview_mux_metadata" to "authenticated";

grant references on table "public"."mock_interview_mux_metadata" to "authenticated";

grant select on table "public"."mock_interview_mux_metadata" to "authenticated";

grant trigger on table "public"."mock_interview_mux_metadata" to "authenticated";

grant truncate on table "public"."mock_interview_mux_metadata" to "authenticated";

grant update on table "public"."mock_interview_mux_metadata" to "authenticated";

grant delete on table "public"."mock_interview_mux_metadata" to "service_role";

grant insert on table "public"."mock_interview_mux_metadata" to "service_role";

grant references on table "public"."mock_interview_mux_metadata" to "service_role";

grant select on table "public"."mock_interview_mux_metadata" to "service_role";

grant trigger on table "public"."mock_interview_mux_metadata" to "service_role";

grant truncate on table "public"."mock_interview_mux_metadata" to "service_role";

grant update on table "public"."mock_interview_mux_metadata" to "service_role";

create policy "coach_read_access"
on "public"."mock_interview_mux_metadata"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ((custom_job_mock_interviews cjmi
     JOIN custom_jobs cj ON ((cjmi.custom_job_id = cj.id)))
     JOIN coaches c ON ((cj.coach_id = c.id)))
  WHERE ((cjmi.id = mock_interview_mux_metadata.id) AND (c.user_id = auth.uid())))));


create policy "user_all_access"
on "public"."mock_interview_mux_metadata"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM custom_job_mock_interviews cjmi
  WHERE ((cjmi.id = mock_interview_mux_metadata.id) AND (cjmi.user_id = auth.uid())))));



