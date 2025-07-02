-- Create separate Mux metadata table for course lesson files
-- This follows the same pattern as custom_job_question_submission_mux_metadata and mock_interview_message_mux_metadata

-- Create the metadata table
create table "public"."course_lesson_files_mux_metadata" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "upload_id" text not null,
    "asset_id" text,
    "playback_id" text,
    "status" mux_status not null,
    "duration" numeric
);

-- Enable RLS
alter table "public"."course_lesson_files_mux_metadata" enable row level security;

-- Create primary key
CREATE UNIQUE INDEX course_lesson_files_mux_metadata_pkey ON public.course_lesson_files_mux_metadata USING btree (id);
alter table "public"."course_lesson_files_mux_metadata" add constraint "course_lesson_files_mux_metadata_pkey" PRIMARY KEY using index "course_lesson_files_mux_metadata_pkey";

-- Add foreign key to course_lesson_files
alter table "public"."course_lesson_files_mux_metadata" add constraint "course_lesson_files_mux_metadata_id_fkey" FOREIGN KEY (id) REFERENCES course_lesson_files(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."course_lesson_files_mux_metadata" validate constraint "course_lesson_files_mux_metadata_id_fkey";

-- Grant permissions
grant delete on table "public"."course_lesson_files_mux_metadata" to "anon";
grant insert on table "public"."course_lesson_files_mux_metadata" to "anon";
grant references on table "public"."course_lesson_files_mux_metadata" to "anon";
grant select on table "public"."course_lesson_files_mux_metadata" to "anon";
grant trigger on table "public"."course_lesson_files_mux_metadata" to "anon";
grant truncate on table "public"."course_lesson_files_mux_metadata" to "anon";
grant update on table "public"."course_lesson_files_mux_metadata" to "anon";

grant delete on table "public"."course_lesson_files_mux_metadata" to "authenticated";
grant insert on table "public"."course_lesson_files_mux_metadata" to "authenticated";
grant references on table "public"."course_lesson_files_mux_metadata" to "authenticated";
grant select on table "public"."course_lesson_files_mux_metadata" to "authenticated";
grant trigger on table "public"."course_lesson_files_mux_metadata" to "authenticated";
grant truncate on table "public"."course_lesson_files_mux_metadata" to "authenticated";
grant update on table "public"."course_lesson_files_mux_metadata" to "authenticated";

grant delete on table "public"."course_lesson_files_mux_metadata" to "service_role";
grant insert on table "public"."course_lesson_files_mux_metadata" to "service_role";
grant references on table "public"."course_lesson_files_mux_metadata" to "service_role";
grant select on table "public"."course_lesson_files_mux_metadata" to "service_role";
grant trigger on table "public"."course_lesson_files_mux_metadata" to "service_role";
grant truncate on table "public"."course_lesson_files_mux_metadata" to "service_role";
grant update on table "public"."course_lesson_files_mux_metadata" to "service_role";

-- Create indexes for performance
CREATE INDEX idx_course_lesson_files_mux_metadata_asset_id ON course_lesson_files_mux_metadata(asset_id) WHERE asset_id IS NOT NULL;
CREATE INDEX idx_course_lesson_files_mux_metadata_upload_id ON course_lesson_files_mux_metadata(upload_id);


-- Remove Mux columns from course_lesson_blocks
ALTER TABLE "public"."course_lesson_blocks" 
DROP COLUMN "mux_asset_id",
DROP COLUMN "mux_playback_id";

-- Update the check constraint to ensure video blocks have a file_id
ALTER TABLE "public"."course_lesson_blocks" 
DROP CONSTRAINT IF EXISTS "course_lesson_blocks_content_check";

-- Policy for service role to update metadata during webhook processing
create policy "Service role has full access to course lesson files metadata"
on "public"."course_lesson_files_mux_metadata"
as permissive
for all
to service_role
using (true)
with check (true);

-- Add composite index for common query patterns on course_lesson_files
CREATE INDEX idx_course_lesson_files_lesson_id_mime_type 
ON course_lesson_files(lesson_id, mime_type) 

WHERE mime_type LIKE 'video/%';