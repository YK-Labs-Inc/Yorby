drop trigger if exists "update_job_interview_recordings_updated_at" on "public"."job_interview_recordings";

drop policy "Candidates can create/update recordings" on "public"."job_interview_recordings";

drop policy "Candidates can view their recordings" on "public"."job_interview_recordings";

drop policy "Company members can view recordings" on "public"."job_interview_recordings";

revoke delete on table "public"."job_interview_recordings" from "anon";

revoke insert on table "public"."job_interview_recordings" from "anon";

revoke references on table "public"."job_interview_recordings" from "anon";

revoke select on table "public"."job_interview_recordings" from "anon";

revoke trigger on table "public"."job_interview_recordings" from "anon";

revoke truncate on table "public"."job_interview_recordings" from "anon";

revoke update on table "public"."job_interview_recordings" from "anon";

revoke delete on table "public"."job_interview_recordings" from "authenticated";

revoke insert on table "public"."job_interview_recordings" from "authenticated";

revoke references on table "public"."job_interview_recordings" from "authenticated";

revoke select on table "public"."job_interview_recordings" from "authenticated";

revoke trigger on table "public"."job_interview_recordings" from "authenticated";

revoke truncate on table "public"."job_interview_recordings" from "authenticated";

revoke update on table "public"."job_interview_recordings" from "authenticated";

revoke delete on table "public"."job_interview_recordings" from "service_role";

revoke insert on table "public"."job_interview_recordings" from "service_role";

revoke references on table "public"."job_interview_recordings" from "service_role";

revoke select on table "public"."job_interview_recordings" from "service_role";

revoke trigger on table "public"."job_interview_recordings" from "service_role";

revoke truncate on table "public"."job_interview_recordings" from "service_role";

revoke update on table "public"."job_interview_recordings" from "service_role";

alter table "public"."job_interview_recordings" drop constraint "job_interview_recordings_candidate_interview_id_fkey";

alter table "public"."job_interview_recordings" drop constraint "job_interview_recordings_pkey";

drop index if exists "public"."idx_job_interview_recordings_candidate_interview_id";

drop index if exists "public"."job_interview_recordings_pkey";

drop table "public"."job_interview_recordings";

create table "public"."candidate_job_interview_recordings" (
    "id" uuid not null default uuid_generate_v4(),
    "candidate_interview_id" uuid not null,
    "upload_id" text,
    "asset_id" text,
    "playback_id" text,
    "status" mux_status not null default 'preparing'::mux_status,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."candidate_job_interview_recordings" enable row level security;

CREATE INDEX idx_job_interview_recordings_candidate_interview_id ON public.candidate_job_interview_recordings USING btree (candidate_interview_id);

CREATE UNIQUE INDEX job_interview_recordings_pkey ON public.candidate_job_interview_recordings USING btree (id);

alter table "public"."candidate_job_interview_recordings" add constraint "job_interview_recordings_pkey" PRIMARY KEY using index "job_interview_recordings_pkey";

alter table "public"."candidate_job_interview_recordings" add constraint "job_interview_recordings_candidate_interview_id_fkey" FOREIGN KEY (candidate_interview_id) REFERENCES candidate_job_interviews(id) ON DELETE CASCADE not valid;

alter table "public"."candidate_job_interview_recordings" validate constraint "job_interview_recordings_candidate_interview_id_fkey";

grant delete on table "public"."candidate_job_interview_recordings" to "anon";

grant insert on table "public"."candidate_job_interview_recordings" to "anon";

grant references on table "public"."candidate_job_interview_recordings" to "anon";

grant select on table "public"."candidate_job_interview_recordings" to "anon";

grant trigger on table "public"."candidate_job_interview_recordings" to "anon";

grant truncate on table "public"."candidate_job_interview_recordings" to "anon";

grant update on table "public"."candidate_job_interview_recordings" to "anon";

grant delete on table "public"."candidate_job_interview_recordings" to "authenticated";

grant insert on table "public"."candidate_job_interview_recordings" to "authenticated";

grant references on table "public"."candidate_job_interview_recordings" to "authenticated";

grant select on table "public"."candidate_job_interview_recordings" to "authenticated";

grant trigger on table "public"."candidate_job_interview_recordings" to "authenticated";

grant truncate on table "public"."candidate_job_interview_recordings" to "authenticated";

grant update on table "public"."candidate_job_interview_recordings" to "authenticated";

grant delete on table "public"."candidate_job_interview_recordings" to "service_role";

grant insert on table "public"."candidate_job_interview_recordings" to "service_role";

grant references on table "public"."candidate_job_interview_recordings" to "service_role";

grant select on table "public"."candidate_job_interview_recordings" to "service_role";

grant trigger on table "public"."candidate_job_interview_recordings" to "service_role";

grant truncate on table "public"."candidate_job_interview_recordings" to "service_role";

grant update on table "public"."candidate_job_interview_recordings" to "service_role";

create policy "Candidates can create/update recordings"
on "public"."candidate_job_interview_recordings"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (candidate_job_interviews
     JOIN company_job_candidates ON ((company_job_candidates.id = candidate_job_interviews.candidate_id)))
  WHERE ((candidate_job_interviews.id = candidate_job_interview_recordings.candidate_interview_id) AND (company_job_candidates.candidate_user_id = auth.uid())))));


create policy "Candidates can view their recordings"
on "public"."candidate_job_interview_recordings"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (candidate_job_interviews
     JOIN company_job_candidates ON ((company_job_candidates.id = candidate_job_interviews.candidate_id)))
  WHERE ((candidate_job_interviews.id = candidate_job_interview_recordings.candidate_interview_id) AND (company_job_candidates.candidate_user_id = auth.uid())))));


create policy "Company members can view recordings"
on "public"."candidate_job_interview_recordings"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ((candidate_job_interviews
     JOIN company_job_candidates ON ((company_job_candidates.id = candidate_job_interviews.candidate_id)))
     JOIN company_members ON ((company_members.company_id = company_job_candidates.company_id)))
  WHERE ((candidate_job_interviews.id = candidate_job_interview_recordings.candidate_interview_id) AND (company_members.user_id = auth.uid())))));


CREATE TRIGGER update_job_interview_recordings_updated_at BEFORE UPDATE ON public.candidate_job_interview_recordings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


