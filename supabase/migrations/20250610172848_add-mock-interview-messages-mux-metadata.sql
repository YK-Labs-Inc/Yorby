create type "public"."mux_status" as enum ('preparing', 'ready', 'errored');

create table "public"."mock_interview_message_mux_metadata" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "upload_id" text not null,
    "asset_id" text,
    "playback_id" text,
    "status" mux_status not null,
    "duration" numeric
);


alter table "public"."mock_interview_message_mux_metadata" enable row level security;

CREATE UNIQUE INDEX mock_interview_message_mux_metadata_pkey ON public.mock_interview_message_mux_metadata USING btree (id);

alter table "public"."mock_interview_message_mux_metadata" add constraint "mock_interview_message_mux_metadata_pkey" PRIMARY KEY using index "mock_interview_message_mux_metadata_pkey";

alter table "public"."mock_interview_message_mux_metadata" add constraint "mock_interview_message_mux_metadata_id_fkey" FOREIGN KEY (id) REFERENCES mock_interview_messages(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."mock_interview_message_mux_metadata" validate constraint "mock_interview_message_mux_metadata_id_fkey";

grant delete on table "public"."mock_interview_message_mux_metadata" to "anon";

grant insert on table "public"."mock_interview_message_mux_metadata" to "anon";

grant references on table "public"."mock_interview_message_mux_metadata" to "anon";

grant select on table "public"."mock_interview_message_mux_metadata" to "anon";

grant trigger on table "public"."mock_interview_message_mux_metadata" to "anon";

grant truncate on table "public"."mock_interview_message_mux_metadata" to "anon";

grant update on table "public"."mock_interview_message_mux_metadata" to "anon";

grant delete on table "public"."mock_interview_message_mux_metadata" to "authenticated";

grant insert on table "public"."mock_interview_message_mux_metadata" to "authenticated";

grant references on table "public"."mock_interview_message_mux_metadata" to "authenticated";

grant select on table "public"."mock_interview_message_mux_metadata" to "authenticated";

grant trigger on table "public"."mock_interview_message_mux_metadata" to "authenticated";

grant truncate on table "public"."mock_interview_message_mux_metadata" to "authenticated";

grant update on table "public"."mock_interview_message_mux_metadata" to "authenticated";

grant delete on table "public"."mock_interview_message_mux_metadata" to "service_role";

grant insert on table "public"."mock_interview_message_mux_metadata" to "service_role";

grant references on table "public"."mock_interview_message_mux_metadata" to "service_role";

grant select on table "public"."mock_interview_message_mux_metadata" to "service_role";

grant trigger on table "public"."mock_interview_message_mux_metadata" to "service_role";

grant truncate on table "public"."mock_interview_message_mux_metadata" to "service_role";

grant update on table "public"."mock_interview_message_mux_metadata" to "service_role";

create policy "All users all access if they own parent custom job"
on "public"."mock_interview_message_mux_metadata"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM ((mock_interview_messages mim
     JOIN custom_job_mock_interviews cjmi ON ((mim.mock_interview_id = cjmi.id)))
     JOIN custom_jobs cj ON ((cjmi.custom_job_id = cj.id)))
  WHERE ((mim.id = mock_interview_message_mux_metadata.id) AND (cj.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM ((mock_interview_messages mim
     JOIN custom_job_mock_interviews cjmi ON ((mim.mock_interview_id = cjmi.id)))
     JOIN custom_jobs cj ON ((cjmi.custom_job_id = cj.id)))
  WHERE ((mim.id = mock_interview_message_mux_metadata.id) AND (cj.user_id = auth.uid())))));


create policy "Give user read access if they are coach of parent job"
on "public"."mock_interview_message_mux_metadata"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (((mock_interview_messages mim
     JOIN custom_job_mock_interviews cjmi ON ((mim.mock_interview_id = cjmi.id)))
     JOIN custom_jobs cj ON ((cjmi.custom_job_id = cj.id)))
     JOIN coaches coach ON ((cj.coach_id = coach.id)))
  WHERE ((mim.id = mock_interview_message_mux_metadata.id) AND (coach.user_id = auth.uid())))));



