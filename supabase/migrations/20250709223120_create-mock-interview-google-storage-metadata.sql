create table "public"."mock_interview_google_storage_metadata" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "raw_bucket" text not null,
    "raw_file_path" text not null,
    "transcoded_bucket" text not null,
    "transcoded_file_path" text not null,
    "status" mux_status not null
);


alter table "public"."mock_interview_google_storage_metadata" enable row level security;

alter table "public"."courses" add column "deletion_status" deletion_status not null default 'not_deleted'::deletion_status;

CREATE INDEX idx_courses_custom_job_id ON public.courses USING btree (custom_job_id) WHERE (deletion_status = 'not_deleted'::deletion_status);

CREATE UNIQUE INDEX mock_interview_google_storage_metadata_pkey ON public.mock_interview_google_storage_metadata USING btree (id);

alter table "public"."mock_interview_google_storage_metadata" add constraint "mock_interview_google_storage_metadata_pkey" PRIMARY KEY using index "mock_interview_google_storage_metadata_pkey";

alter table "public"."mock_interview_google_storage_metadata" add constraint "mock_interview_google_storage_metadata_id_fkey" FOREIGN KEY (id) REFERENCES custom_job_mock_interviews(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."mock_interview_google_storage_metadata" validate constraint "mock_interview_google_storage_metadata_id_fkey";

grant delete on table "public"."mock_interview_google_storage_metadata" to "anon";

grant insert on table "public"."mock_interview_google_storage_metadata" to "anon";

grant references on table "public"."mock_interview_google_storage_metadata" to "anon";

grant select on table "public"."mock_interview_google_storage_metadata" to "anon";

grant trigger on table "public"."mock_interview_google_storage_metadata" to "anon";

grant truncate on table "public"."mock_interview_google_storage_metadata" to "anon";

grant update on table "public"."mock_interview_google_storage_metadata" to "anon";

grant delete on table "public"."mock_interview_google_storage_metadata" to "authenticated";

grant insert on table "public"."mock_interview_google_storage_metadata" to "authenticated";

grant references on table "public"."mock_interview_google_storage_metadata" to "authenticated";

grant select on table "public"."mock_interview_google_storage_metadata" to "authenticated";

grant trigger on table "public"."mock_interview_google_storage_metadata" to "authenticated";

grant truncate on table "public"."mock_interview_google_storage_metadata" to "authenticated";

grant update on table "public"."mock_interview_google_storage_metadata" to "authenticated";

grant delete on table "public"."mock_interview_google_storage_metadata" to "service_role";

grant insert on table "public"."mock_interview_google_storage_metadata" to "service_role";

grant references on table "public"."mock_interview_google_storage_metadata" to "service_role";

grant select on table "public"."mock_interview_google_storage_metadata" to "service_role";

grant trigger on table "public"."mock_interview_google_storage_metadata" to "service_role";

grant truncate on table "public"."mock_interview_google_storage_metadata" to "service_role";

grant update on table "public"."mock_interview_google_storage_metadata" to "service_role";
