-- Create custom_job_knowledge_base_files table
create table "public"."custom_job_knowledge_base_files" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "custom_job_id" uuid not null,
    "coach_id" uuid not null,
    "display_name" text not null,
    "file_path" text not null,
    "bucket_name" text not null,
    "mime_type" text not null,
    "google_file_name" text not null,
    "google_file_uri" text not null
);

-- Enable RLS
alter table "public"."custom_job_knowledge_base_files" enable row level security;

-- Add primary key
CREATE UNIQUE INDEX custom_job_knowledge_base_files_pkey ON public.custom_job_knowledge_base_files USING btree (id);
alter table "public"."custom_job_knowledge_base_files" add constraint "custom_job_knowledge_base_files_pkey" PRIMARY KEY using index "custom_job_knowledge_base_files_pkey";

-- Add foreign key constraints
alter table "public"."custom_job_knowledge_base_files" add constraint "custom_job_knowledge_base_files_custom_job_id_fkey" FOREIGN KEY (custom_job_id) REFERENCES custom_jobs(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."custom_job_knowledge_base_files" validate constraint "custom_job_knowledge_base_files_custom_job_id_fkey";

alter table "public"."custom_job_knowledge_base_files" add constraint "custom_job_knowledge_base_files_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coaches(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."custom_job_knowledge_base_files" validate constraint "custom_job_knowledge_base_files_coach_id_fkey";

-- Grant permissions to anon
grant delete on table "public"."custom_job_knowledge_base_files" to "anon";
grant insert on table "public"."custom_job_knowledge_base_files" to "anon";
grant references on table "public"."custom_job_knowledge_base_files" to "anon";
grant select on table "public"."custom_job_knowledge_base_files" to "anon";
grant trigger on table "public"."custom_job_knowledge_base_files" to "anon";
grant truncate on table "public"."custom_job_knowledge_base_files" to "anon";
grant update on table "public"."custom_job_knowledge_base_files" to "anon";

-- Grant permissions to authenticated
grant delete on table "public"."custom_job_knowledge_base_files" to "authenticated";
grant insert on table "public"."custom_job_knowledge_base_files" to "authenticated";
grant references on table "public"."custom_job_knowledge_base_files" to "authenticated";
grant select on table "public"."custom_job_knowledge_base_files" to "authenticated";
grant trigger on table "public"."custom_job_knowledge_base_files" to "authenticated";
grant truncate on table "public"."custom_job_knowledge_base_files" to "authenticated";
grant update on table "public"."custom_job_knowledge_base_files" to "authenticated";

-- Grant permissions to service_role
grant delete on table "public"."custom_job_knowledge_base_files" to "service_role";
grant insert on table "public"."custom_job_knowledge_base_files" to "service_role";
grant references on table "public"."custom_job_knowledge_base_files" to "service_role";
grant select on table "public"."custom_job_knowledge_base_files" to "service_role";
grant trigger on table "public"."custom_job_knowledge_base_files" to "service_role";
grant truncate on table "public"."custom_job_knowledge_base_files" to "service_role";
grant update on table "public"."custom_job_knowledge_base_files" to "service_role";

-- RLS Policies

-- Policy 1: Coaches can manage files for their own custom jobs
CREATE POLICY "Coaches can manage knowledge base files for their custom jobs"
ON custom_job_knowledge_base_files
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM coaches c
        WHERE c.id = custom_job_knowledge_base_files.coach_id
        AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM coaches c
        WHERE c.id = custom_job_knowledge_base_files.coach_id
        AND c.user_id = auth.uid()
    )
);

-- Policy 2: Enrolled students can read knowledge base files for jobs they're enrolled in
CREATE POLICY "Enrolled students can read knowledge base files"
ON custom_job_knowledge_base_files
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_enrollments cje
        WHERE cje.custom_job_id = custom_job_knowledge_base_files.custom_job_id
        AND cje.user_id = auth.uid()
    )
);

-- Create storage bucket RLS policies for custom-job-knowledge-base-files bucket
-- Note: These policies give coaches full access to their own directory structure

-- Policy for coaches to upload files to their directory
CREATE POLICY "Coaches can upload knowledge base files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'custom-job-knowledge-base-files' AND
    EXISTS (
        SELECT 1
        FROM coaches c
        WHERE c.user_id = auth.uid()
        AND (storage.foldername(name))[1] = c.user_id::text
    )
);

-- Policy for coaches to update their own files
CREATE POLICY "Coaches can update their knowledge base files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'custom-job-knowledge-base-files' AND
    EXISTS (
        SELECT 1
        FROM coaches c
        WHERE c.user_id = auth.uid()
        AND (storage.foldername(name))[1] = c.user_id::text
    )
)
WITH CHECK (
    bucket_id = 'custom-job-knowledge-base-files' AND
    EXISTS (
        SELECT 1
        FROM coaches c
        WHERE c.user_id = auth.uid()
        AND (storage.foldername(name))[1] = c.user_id::text
    )
);

-- Policy for coaches to delete their own files
CREATE POLICY "Coaches can delete their knowledge base files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'custom-job-knowledge-base-files' AND
    EXISTS (
        SELECT 1
        FROM coaches c
        WHERE c.user_id = auth.uid()
        AND (storage.foldername(name))[1] = c.user_id::text
    )
);

-- Policy for coaches to read their own files
CREATE POLICY "Coaches can read their knowledge base files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'custom-job-knowledge-base-files' AND
    EXISTS (
        SELECT 1
        FROM coaches c
        WHERE c.user_id = auth.uid()
        AND (storage.foldername(name))[1] = c.user_id::text
    )
);

-- Policy for enrolled students to read files from programs they're enrolled in
CREATE POLICY "Enrolled students can read knowledge base files from storage"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'custom-job-knowledge-base-files' AND
    EXISTS (
        SELECT 1
        FROM custom_job_knowledge_base_files kbf
        JOIN custom_job_enrollments cje ON cje.custom_job_id = kbf.custom_job_id
        WHERE kbf.file_path = name
        AND cje.user_id = auth.uid()
    )
);