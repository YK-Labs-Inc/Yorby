create table "public"."company_interview_coding_question_metadata" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "time_limit" numeric not null
);


alter table "public"."company_interview_coding_question_metadata" enable row level security;

CREATE UNIQUE INDEX company_interview_coding_question_metadata_pkey ON public.company_interview_coding_question_metadata USING btree (id);

alter table "public"."company_interview_coding_question_metadata" add constraint "company_interview_coding_question_metadata_pkey" PRIMARY KEY using index "company_interview_coding_question_metadata_pkey";

alter table "public"."company_interview_coding_question_metadata" add constraint "company_interview_coding_question_metadata_id_fkey" FOREIGN KEY (id) REFERENCES company_interview_question_bank(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."company_interview_coding_question_metadata" validate constraint "company_interview_coding_question_metadata_id_fkey";

grant delete on table "public"."company_interview_coding_question_metadata" to "anon";

grant insert on table "public"."company_interview_coding_question_metadata" to "anon";

grant references on table "public"."company_interview_coding_question_metadata" to "anon";

grant select on table "public"."company_interview_coding_question_metadata" to "anon";

grant trigger on table "public"."company_interview_coding_question_metadata" to "anon";

grant truncate on table "public"."company_interview_coding_question_metadata" to "anon";

grant update on table "public"."company_interview_coding_question_metadata" to "anon";

grant delete on table "public"."company_interview_coding_question_metadata" to "authenticated";

grant insert on table "public"."company_interview_coding_question_metadata" to "authenticated";

grant references on table "public"."company_interview_coding_question_metadata" to "authenticated";

grant select on table "public"."company_interview_coding_question_metadata" to "authenticated";

grant trigger on table "public"."company_interview_coding_question_metadata" to "authenticated";

grant truncate on table "public"."company_interview_coding_question_metadata" to "authenticated";

grant update on table "public"."company_interview_coding_question_metadata" to "authenticated";

grant delete on table "public"."company_interview_coding_question_metadata" to "service_role";

grant insert on table "public"."company_interview_coding_question_metadata" to "service_role";

grant references on table "public"."company_interview_coding_question_metadata" to "service_role";

grant select on table "public"."company_interview_coding_question_metadata" to "service_role";

grant trigger on table "public"."company_interview_coding_question_metadata" to "service_role";

grant truncate on table "public"."company_interview_coding_question_metadata" to "service_role";

grant update on table "public"."company_interview_coding_question_metadata" to "service_role";


