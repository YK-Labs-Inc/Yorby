create table "public"."mock_interview_questions" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "question_id" uuid not null,
    "interview_id" uuid not null
);


alter table "public"."mock_interview_questions" enable row level security;

CREATE UNIQUE INDEX mock_interview_questions_pkey ON public.mock_interview_questions USING btree (id);

alter table "public"."mock_interview_questions" add constraint "mock_interview_questions_pkey" PRIMARY KEY using index "mock_interview_questions_pkey";

alter table "public"."mock_interview_questions" add constraint "mock_interview_questions_interview_id_fkey" FOREIGN KEY (interview_id) REFERENCES custom_job_mock_interviews(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."mock_interview_questions" validate constraint "mock_interview_questions_interview_id_fkey";

alter table "public"."mock_interview_questions" add constraint "mock_interview_questions_question_id_fkey" FOREIGN KEY (question_id) REFERENCES custom_job_questions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."mock_interview_questions" validate constraint "mock_interview_questions_question_id_fkey";

grant delete on table "public"."mock_interview_questions" to "anon";

grant insert on table "public"."mock_interview_questions" to "anon";

grant references on table "public"."mock_interview_questions" to "anon";

grant select on table "public"."mock_interview_questions" to "anon";

grant trigger on table "public"."mock_interview_questions" to "anon";

grant truncate on table "public"."mock_interview_questions" to "anon";

grant update on table "public"."mock_interview_questions" to "anon";

grant delete on table "public"."mock_interview_questions" to "authenticated";

grant insert on table "public"."mock_interview_questions" to "authenticated";

grant references on table "public"."mock_interview_questions" to "authenticated";

grant select on table "public"."mock_interview_questions" to "authenticated";

grant trigger on table "public"."mock_interview_questions" to "authenticated";

grant truncate on table "public"."mock_interview_questions" to "authenticated";

grant update on table "public"."mock_interview_questions" to "authenticated";

grant delete on table "public"."mock_interview_questions" to "service_role";

grant insert on table "public"."mock_interview_questions" to "service_role";

grant references on table "public"."mock_interview_questions" to "service_role";

grant select on table "public"."mock_interview_questions" to "service_role";

grant trigger on table "public"."mock_interview_questions" to "service_role";

grant truncate on table "public"."mock_interview_questions" to "service_role";

grant update on table "public"."mock_interview_questions" to "service_role";

create policy "Allow delete access to mock_interview_questions for users with "
on "public"."mock_interview_questions"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM (custom_job_mock_interviews cjm
     JOIN custom_jobs cj ON ((cjm.custom_job_id = cj.id)))
  WHERE ((cjm.id = mock_interview_questions.interview_id) AND (cj.user_id = auth.uid())))));


create policy "Allow insert access to mock_interview_questions for users with "
on "public"."mock_interview_questions"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM (custom_job_mock_interviews cjm
     JOIN custom_jobs cj ON ((cjm.custom_job_id = cj.id)))
  WHERE ((cjm.id = mock_interview_questions.interview_id) AND (cj.user_id = auth.uid())))));


create policy "Allow select access to mock_interview_questions for users with "
on "public"."mock_interview_questions"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (custom_job_mock_interviews cjm
     JOIN custom_jobs cj ON ((cjm.custom_job_id = cj.id)))
  WHERE ((cjm.id = mock_interview_questions.interview_id) AND (cj.user_id = auth.uid())))));


create policy "Allow update access to mock_interview_questions for users with "
on "public"."mock_interview_questions"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM (custom_job_mock_interviews cjm
     JOIN custom_jobs cj ON ((cjm.custom_job_id = cj.id)))
  WHERE ((cjm.id = mock_interview_questions.interview_id) AND (cj.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM (custom_job_mock_interviews cjm
     JOIN custom_jobs cj ON ((cjm.custom_job_id = cj.id)))
  WHERE ((cjm.id = mock_interview_questions.interview_id) AND (cj.user_id = auth.uid())))));



