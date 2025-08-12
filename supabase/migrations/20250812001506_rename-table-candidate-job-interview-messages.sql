drop policy "Candidates can create messages" on "public"."job_interview_messages";

drop policy "Candidates can view their messages" on "public"."job_interview_messages";

drop policy "Company members can view messages" on "public"."job_interview_messages";

revoke delete on table "public"."job_interview_messages" from "anon";

revoke insert on table "public"."job_interview_messages" from "anon";

revoke references on table "public"."job_interview_messages" from "anon";

revoke select on table "public"."job_interview_messages" from "anon";

revoke trigger on table "public"."job_interview_messages" from "anon";

revoke truncate on table "public"."job_interview_messages" from "anon";

revoke update on table "public"."job_interview_messages" from "anon";

revoke delete on table "public"."job_interview_messages" from "authenticated";

revoke insert on table "public"."job_interview_messages" from "authenticated";

revoke references on table "public"."job_interview_messages" from "authenticated";

revoke select on table "public"."job_interview_messages" from "authenticated";

revoke trigger on table "public"."job_interview_messages" from "authenticated";

revoke truncate on table "public"."job_interview_messages" from "authenticated";

revoke update on table "public"."job_interview_messages" from "authenticated";

revoke delete on table "public"."job_interview_messages" from "service_role";

revoke insert on table "public"."job_interview_messages" from "service_role";

revoke references on table "public"."job_interview_messages" from "service_role";

revoke select on table "public"."job_interview_messages" from "service_role";

revoke trigger on table "public"."job_interview_messages" from "service_role";

revoke truncate on table "public"."job_interview_messages" from "service_role";

revoke update on table "public"."job_interview_messages" from "service_role";

alter table "public"."job_interview_messages" drop constraint "job_interview_messages_candidate_interview_id_fkey";

alter table "public"."job_interview_messages" drop constraint "job_interview_messages_pkey";

drop index if exists "public"."idx_job_interview_messages_candidate_interview_id_created";

drop index if exists "public"."job_interview_messages_pkey";

drop table "public"."job_interview_messages";

create table "public"."candidate_job_interview_messages" (
    "id" uuid not null default uuid_generate_v4(),
    "candidate_interview_id" uuid not null,
    "role" message_role not null,
    "text" text not null,
    "created_at" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."candidate_job_interview_messages" enable row level security;

CREATE INDEX idx_job_interview_messages_candidate_interview_id_created ON public.candidate_job_interview_messages USING btree (candidate_interview_id, created_at);

CREATE UNIQUE INDEX job_interview_messages_pkey ON public.candidate_job_interview_messages USING btree (id);

alter table "public"."candidate_job_interview_messages" add constraint "job_interview_messages_pkey" PRIMARY KEY using index "job_interview_messages_pkey";

alter table "public"."candidate_job_interview_messages" add constraint "job_interview_messages_candidate_interview_id_fkey" FOREIGN KEY (candidate_interview_id) REFERENCES candidate_job_interviews(id) ON DELETE CASCADE not valid;

alter table "public"."candidate_job_interview_messages" validate constraint "job_interview_messages_candidate_interview_id_fkey";

grant delete on table "public"."candidate_job_interview_messages" to "anon";

grant insert on table "public"."candidate_job_interview_messages" to "anon";

grant references on table "public"."candidate_job_interview_messages" to "anon";

grant select on table "public"."candidate_job_interview_messages" to "anon";

grant trigger on table "public"."candidate_job_interview_messages" to "anon";

grant truncate on table "public"."candidate_job_interview_messages" to "anon";

grant update on table "public"."candidate_job_interview_messages" to "anon";

grant delete on table "public"."candidate_job_interview_messages" to "authenticated";

grant insert on table "public"."candidate_job_interview_messages" to "authenticated";

grant references on table "public"."candidate_job_interview_messages" to "authenticated";

grant select on table "public"."candidate_job_interview_messages" to "authenticated";

grant trigger on table "public"."candidate_job_interview_messages" to "authenticated";

grant truncate on table "public"."candidate_job_interview_messages" to "authenticated";

grant update on table "public"."candidate_job_interview_messages" to "authenticated";

grant delete on table "public"."candidate_job_interview_messages" to "service_role";

grant insert on table "public"."candidate_job_interview_messages" to "service_role";

grant references on table "public"."candidate_job_interview_messages" to "service_role";

grant select on table "public"."candidate_job_interview_messages" to "service_role";

grant trigger on table "public"."candidate_job_interview_messages" to "service_role";

grant truncate on table "public"."candidate_job_interview_messages" to "service_role";

grant update on table "public"."candidate_job_interview_messages" to "service_role";

create policy "Candidates can create messages"
on "public"."candidate_job_interview_messages"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM (candidate_job_interviews
     JOIN company_job_candidates ON ((company_job_candidates.id = candidate_job_interviews.candidate_id)))
  WHERE ((candidate_job_interviews.id = candidate_job_interview_messages.candidate_interview_id) AND (company_job_candidates.candidate_user_id = auth.uid())))));


create policy "Candidates can view their messages"
on "public"."candidate_job_interview_messages"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (candidate_job_interviews
     JOIN company_job_candidates ON ((company_job_candidates.id = candidate_job_interviews.candidate_id)))
  WHERE ((candidate_job_interviews.id = candidate_job_interview_messages.candidate_interview_id) AND (company_job_candidates.candidate_user_id = auth.uid())))));


create policy "Company members can view messages"
on "public"."candidate_job_interview_messages"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ((candidate_job_interviews
     JOIN company_job_candidates ON ((company_job_candidates.id = candidate_job_interviews.candidate_id)))
     JOIN company_members ON ((company_members.company_id = company_job_candidates.company_id)))
  WHERE ((candidate_job_interviews.id = candidate_job_interview_messages.candidate_interview_id) AND (company_members.user_id = auth.uid())))));



