create table "public"."custom_job_question_sample_answers" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "answer" text not null,
    "question_id" uuid not null
);


alter table "public"."custom_job_question_sample_answers" enable row level security;

CREATE UNIQUE INDEX custom_job_question_sample_answers_pkey ON public.custom_job_question_sample_answers USING btree (id);

alter table "public"."custom_job_question_sample_answers" add constraint "custom_job_question_sample_answers_pkey" PRIMARY KEY using index "custom_job_question_sample_answers_pkey";

alter table "public"."custom_job_question_sample_answers" add constraint "custom_job_question_sample_answers_question_id_fkey" FOREIGN KEY (question_id) REFERENCES custom_job_questions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."custom_job_question_sample_answers" validate constraint "custom_job_question_sample_answers_question_id_fkey";

grant delete on table "public"."custom_job_question_sample_answers" to "anon";

grant insert on table "public"."custom_job_question_sample_answers" to "anon";

grant references on table "public"."custom_job_question_sample_answers" to "anon";

grant select on table "public"."custom_job_question_sample_answers" to "anon";

grant trigger on table "public"."custom_job_question_sample_answers" to "anon";

grant truncate on table "public"."custom_job_question_sample_answers" to "anon";

grant update on table "public"."custom_job_question_sample_answers" to "anon";

grant delete on table "public"."custom_job_question_sample_answers" to "authenticated";

grant insert on table "public"."custom_job_question_sample_answers" to "authenticated";

grant references on table "public"."custom_job_question_sample_answers" to "authenticated";

grant select on table "public"."custom_job_question_sample_answers" to "authenticated";

grant trigger on table "public"."custom_job_question_sample_answers" to "authenticated";

grant truncate on table "public"."custom_job_question_sample_answers" to "authenticated";

grant update on table "public"."custom_job_question_sample_answers" to "authenticated";

grant delete on table "public"."custom_job_question_sample_answers" to "service_role";

grant insert on table "public"."custom_job_question_sample_answers" to "service_role";

grant references on table "public"."custom_job_question_sample_answers" to "service_role";

grant select on table "public"."custom_job_question_sample_answers" to "service_role";

grant trigger on table "public"."custom_job_question_sample_answers" to "service_role";

grant truncate on table "public"."custom_job_question_sample_answers" to "service_role";

grant update on table "public"."custom_job_question_sample_answers" to "service_role";


