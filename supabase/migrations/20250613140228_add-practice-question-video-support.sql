create table "public"."custom_job_question_submission_mux_metadata" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "upload_id" text not null,
    "asset_id" text,
    "playback_id" text,
    "status" mux_status not null,
    "duration" numeric
);


alter table "public"."custom_job_question_submission_mux_metadata" enable row level security;

CREATE UNIQUE INDEX custom_job_question_submission_mux_metadata_pkey ON public.custom_job_question_submission_mux_metadata USING btree (id);

alter table "public"."custom_job_question_submission_mux_metadata" add constraint "custom_job_question_submission_mux_metadata_pkey" PRIMARY KEY using index "custom_job_question_submission_mux_metadata_pkey";

alter table "public"."custom_job_question_submission_mux_metadata" add constraint "custom_job_question_submission_mux_metadata_id_fkey" FOREIGN KEY (id) REFERENCES custom_job_question_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."custom_job_question_submission_mux_metadata" validate constraint "custom_job_question_submission_mux_metadata_id_fkey";

grant delete on table "public"."custom_job_question_submission_mux_metadata" to "anon";

grant insert on table "public"."custom_job_question_submission_mux_metadata" to "anon";

grant references on table "public"."custom_job_question_submission_mux_metadata" to "anon";

grant select on table "public"."custom_job_question_submission_mux_metadata" to "anon";

grant trigger on table "public"."custom_job_question_submission_mux_metadata" to "anon";

grant truncate on table "public"."custom_job_question_submission_mux_metadata" to "anon";

grant update on table "public"."custom_job_question_submission_mux_metadata" to "anon";

grant delete on table "public"."custom_job_question_submission_mux_metadata" to "authenticated";

grant insert on table "public"."custom_job_question_submission_mux_metadata" to "authenticated";

grant references on table "public"."custom_job_question_submission_mux_metadata" to "authenticated";

grant select on table "public"."custom_job_question_submission_mux_metadata" to "authenticated";

grant trigger on table "public"."custom_job_question_submission_mux_metadata" to "authenticated";

grant truncate on table "public"."custom_job_question_submission_mux_metadata" to "authenticated";

grant update on table "public"."custom_job_question_submission_mux_metadata" to "authenticated";

grant delete on table "public"."custom_job_question_submission_mux_metadata" to "service_role";

grant insert on table "public"."custom_job_question_submission_mux_metadata" to "service_role";

grant references on table "public"."custom_job_question_submission_mux_metadata" to "service_role";

grant select on table "public"."custom_job_question_submission_mux_metadata" to "service_role";

grant trigger on table "public"."custom_job_question_submission_mux_metadata" to "service_role";

grant truncate on table "public"."custom_job_question_submission_mux_metadata" to "service_role";

grant update on table "public"."custom_job_question_submission_mux_metadata" to "service_role";

create policy "Provide user SELECT access if they are coach of parent custom_j"
on "public"."custom_job_question_submission_mux_metadata"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (((custom_job_question_submissions cjqs
     JOIN custom_job_questions cjq ON ((cjqs.custom_job_question_id = cjq.id)))
     JOIN custom_jobs cj ON ((cjq.custom_job_id = cj.id)))
     JOIN coaches c ON ((cj.coach_id = c.id)))
  WHERE ((cjqs.id = custom_job_question_submission_mux_metadata.id) AND (c.user_id = auth.uid())))));


create policy "Provide user with all access if they are owner of the parent cu"
on "public"."custom_job_question_submission_mux_metadata"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM ((custom_job_question_submissions cjqs
     JOIN custom_job_questions cjq ON ((cjqs.custom_job_question_id = cjq.id)))
     JOIN custom_jobs cj ON ((cjq.custom_job_id = cj.id)))
  WHERE ((cjqs.id = custom_job_question_submission_mux_metadata.id) AND (cj.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM ((custom_job_question_submissions cjqs
     JOIN custom_job_questions cjq ON ((cjqs.custom_job_question_id = cjq.id)))
     JOIN custom_jobs cj ON ((cjq.custom_job_id = cj.id)))
  WHERE ((cjqs.id = custom_job_question_submission_mux_metadata.id) AND (cj.user_id = auth.uid())))));



