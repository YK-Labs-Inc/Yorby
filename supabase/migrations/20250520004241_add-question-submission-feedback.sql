create type "public"."feedback_role" as enum ('ai', 'user');

create table "public"."custom_job_question_submission_feedback" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "submission_id" uuid not null,
    "pros" text[] not null,
    "cons" text[] not null,
    "feedback_role" feedback_role not null
);


alter table "public"."custom_job_question_submission_feedback" enable row level security;

CREATE UNIQUE INDEX custom_job_question_submission_feedback_pkey ON public.custom_job_question_submission_feedback USING btree (id);

alter table "public"."custom_job_question_submission_feedback" add constraint "custom_job_question_submission_feedback_pkey" PRIMARY KEY using index "custom_job_question_submission_feedback_pkey";

alter table "public"."custom_job_question_submission_feedback" add constraint "custom_job_question_submission_feedback_submission_id_fkey" FOREIGN KEY (submission_id) REFERENCES custom_job_question_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."custom_job_question_submission_feedback" validate constraint "custom_job_question_submission_feedback_submission_id_fkey";

grant delete on table "public"."custom_job_question_submission_feedback" to "anon";

grant insert on table "public"."custom_job_question_submission_feedback" to "anon";

grant references on table "public"."custom_job_question_submission_feedback" to "anon";

grant select on table "public"."custom_job_question_submission_feedback" to "anon";

grant trigger on table "public"."custom_job_question_submission_feedback" to "anon";

grant truncate on table "public"."custom_job_question_submission_feedback" to "anon";

grant update on table "public"."custom_job_question_submission_feedback" to "anon";

grant delete on table "public"."custom_job_question_submission_feedback" to "authenticated";

grant insert on table "public"."custom_job_question_submission_feedback" to "authenticated";

grant references on table "public"."custom_job_question_submission_feedback" to "authenticated";

grant select on table "public"."custom_job_question_submission_feedback" to "authenticated";

grant trigger on table "public"."custom_job_question_submission_feedback" to "authenticated";

grant truncate on table "public"."custom_job_question_submission_feedback" to "authenticated";

grant update on table "public"."custom_job_question_submission_feedback" to "authenticated";

grant delete on table "public"."custom_job_question_submission_feedback" to "service_role";

grant insert on table "public"."custom_job_question_submission_feedback" to "service_role";

grant references on table "public"."custom_job_question_submission_feedback" to "service_role";

grant select on table "public"."custom_job_question_submission_feedback" to "service_role";

grant trigger on table "public"."custom_job_question_submission_feedback" to "service_role";

grant truncate on table "public"."custom_job_question_submission_feedback" to "service_role";

grant update on table "public"."custom_job_question_submission_feedback" to "service_role";

create policy "Allow all access if user's coach_id matches parent custom_job's"
on "public"."custom_job_question_submission_feedback"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM (((custom_job_question_submissions
     JOIN custom_job_questions ON ((custom_job_question_submissions.custom_job_question_id = custom_job_questions.id)))
     JOIN custom_jobs ON ((custom_job_questions.custom_job_id = custom_jobs.id)))
     JOIN coaches ON ((custom_jobs.coach_id = coaches.id)))
  WHERE ((custom_job_question_submission_feedback.submission_id = custom_job_question_submissions.id) AND (coaches.user_id = ( SELECT auth.uid() AS uid))))));


create policy "Allow read access to custom_job_question_submission_feedback fo"
on "public"."custom_job_question_submission_feedback"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((custom_job_question_submissions
     JOIN custom_job_questions ON ((custom_job_question_submissions.custom_job_question_id = custom_job_questions.id)))
     JOIN custom_jobs ON ((custom_job_questions.custom_job_id = custom_jobs.id)))
  WHERE ((custom_job_question_submission_feedback.submission_id = custom_job_question_submissions.id) AND (custom_jobs.user_id = ( SELECT auth.uid() AS uid))))));



