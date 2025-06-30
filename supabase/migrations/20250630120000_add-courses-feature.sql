-- Add courses feature to custom_jobs
-- This migration adds support for courses with modules and lessons

-- Create enum for content types
CREATE TYPE "public"."course_content_type" AS ENUM (
    'text',
    'pdf',
    'video',
    'image'
);

-- Create courses table (1:1 with custom_jobs)
create table "public"."courses" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "custom_job_id" uuid not null,
    "title" text not null,
    "subtitle" text,
    "deletion_status" "public"."deletion_status" not null default 'not_deleted'::deletion_status
);

-- Enable RLS
alter table "public"."courses" enable row level security;

-- Add primary key
CREATE UNIQUE INDEX courses_pkey ON public.courses USING btree (id);
alter table "public"."courses" add constraint "courses_pkey" PRIMARY KEY using index "courses_pkey";

-- Add unique constraint on custom_job_id (one course per job)
CREATE UNIQUE INDEX courses_custom_job_id_key ON public.courses USING btree (custom_job_id);
alter table "public"."courses" add constraint "courses_custom_job_id_key" UNIQUE using index "courses_custom_job_id_key";

-- Add foreign key constraint
alter table "public"."courses" add constraint "courses_custom_job_id_fkey" FOREIGN KEY (custom_job_id) REFERENCES custom_jobs(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."courses" validate constraint "courses_custom_job_id_fkey";

-- Create course_modules table
create table "public"."course_modules" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "course_id" uuid not null,
    "title" text not null,
    "subtitle" text,
    "order_index" integer not null,
    "deletion_status" "public"."deletion_status" not null default 'not_deleted'::deletion_status
);

-- Enable RLS
alter table "public"."course_modules" enable row level security;

-- Add primary key
CREATE UNIQUE INDEX course_modules_pkey ON public.course_modules USING btree (id);
alter table "public"."course_modules" add constraint "course_modules_pkey" PRIMARY KEY using index "course_modules_pkey";

-- Add unique constraint on course_id and order_index
CREATE UNIQUE INDEX course_modules_course_id_order_index_key ON public.course_modules USING btree (course_id, order_index) WHERE deletion_status = 'not_deleted';

-- Add foreign key constraint
alter table "public"."course_modules" add constraint "course_modules_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."course_modules" validate constraint "course_modules_course_id_fkey";

-- Create course_lessons table
create table "public"."course_lessons" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "module_id" uuid not null,
    "title" text not null,
    "subtitle" text,
    "order_index" integer not null,
    "deletion_status" "public"."deletion_status" not null default 'not_deleted'::deletion_status
);

-- Enable RLS
alter table "public"."course_lessons" enable row level security;

-- Add primary key
CREATE UNIQUE INDEX course_lessons_pkey ON public.course_lessons USING btree (id);
alter table "public"."course_lessons" add constraint "course_lessons_pkey" PRIMARY KEY using index "course_lessons_pkey";

-- Add unique constraint on module_id and order_index
CREATE UNIQUE INDEX course_lessons_module_id_order_index_key ON public.course_lessons USING btree (module_id, order_index) WHERE deletion_status = 'not_deleted';

-- Add foreign key constraint
alter table "public"."course_lessons" add constraint "course_lessons_module_id_fkey" FOREIGN KEY (module_id) REFERENCES course_modules(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."course_lessons" validate constraint "course_lessons_module_id_fkey";

-- Create course_lesson_files table for PDF and image storage metadata
create table "public"."course_lesson_files" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "lesson_id" uuid not null,
    "coach_id" uuid not null,
    "display_name" text not null,
    "file_path" text not null,
    "bucket_name" text not null default 'course-files',
    "mime_type" text not null,
    "google_file_name" text,
    "google_file_uri" text
);

-- Enable RLS
alter table "public"."course_lesson_files" enable row level security;

-- Add primary key
CREATE UNIQUE INDEX course_lesson_files_pkey ON public.course_lesson_files USING btree (id);
alter table "public"."course_lesson_files" add constraint "course_lesson_files_pkey" PRIMARY KEY using index "course_lesson_files_pkey";

-- Add foreign key constraints
alter table "public"."course_lesson_files" add constraint "course_lesson_files_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."course_lesson_files" validate constraint "course_lesson_files_lesson_id_fkey";

alter table "public"."course_lesson_files" add constraint "course_lesson_files_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coaches(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."course_lesson_files" validate constraint "course_lesson_files_coach_id_fkey";

-- Create course_lesson_blocks table for Notion-like content blocks
create table "public"."course_lesson_blocks" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "lesson_id" uuid not null,
    "block_type" "public"."course_content_type" not null,
    "order_index" integer not null,
    "text_content" text,
    "file_id" uuid,
    "mux_asset_id" text,
    "mux_playback_id" text,
    "deletion_status" "public"."deletion_status" not null default 'not_deleted'::deletion_status
);

-- Enable RLS
alter table "public"."course_lesson_blocks" enable row level security;

-- Add primary key
CREATE UNIQUE INDEX course_lesson_blocks_pkey ON public.course_lesson_blocks USING btree (id);
alter table "public"."course_lesson_blocks" add constraint "course_lesson_blocks_pkey" PRIMARY KEY using index "course_lesson_blocks_pkey";

-- Add unique constraint on lesson_id and order_index
CREATE UNIQUE INDEX course_lesson_blocks_lesson_id_order_index_key ON public.course_lesson_blocks USING btree (lesson_id, order_index) WHERE deletion_status = 'not_deleted';

-- Add foreign key constraints
alter table "public"."course_lesson_blocks" add constraint "course_lesson_blocks_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."course_lesson_blocks" validate constraint "course_lesson_blocks_lesson_id_fkey";

alter table "public"."course_lesson_blocks" add constraint "course_lesson_blocks_file_id_fkey" FOREIGN KEY (file_id) REFERENCES course_lesson_files(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;
alter table "public"."course_lesson_blocks" validate constraint "course_lesson_blocks_file_id_fkey";

-- Add check constraint to ensure appropriate content fields are filled
alter table "public"."course_lesson_blocks" add constraint "course_lesson_blocks_content_check" CHECK (
    CASE 
        WHEN block_type = 'text' THEN text_content IS NOT NULL
        WHEN block_type IN ('pdf', 'image') THEN file_id IS NOT NULL
        WHEN block_type = 'video' THEN mux_asset_id IS NOT NULL
        ELSE false
    END
);

-- Grant permissions to all tables for anon, authenticated, and service_role
DO $$ 
DECLARE
    table_name text;
    tables text[] := ARRAY['courses', 'course_modules', 'course_lessons', 'course_lesson_blocks', 'course_lesson_files'];
    role_name text;
    roles text[] := ARRAY['anon', 'authenticated', 'service_role'];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        FOREACH role_name IN ARRAY roles
        LOOP
            EXECUTE format('grant delete on table "public"."%I" to "%I"', table_name, role_name);
            EXECUTE format('grant insert on table "public"."%I" to "%I"', table_name, role_name);
            EXECUTE format('grant references on table "public"."%I" to "%I"', table_name, role_name);
            EXECUTE format('grant select on table "public"."%I" to "%I"', table_name, role_name);
            EXECUTE format('grant trigger on table "public"."%I" to "%I"', table_name, role_name);
            EXECUTE format('grant truncate on table "public"."%I" to "%I"', table_name, role_name);
            EXECUTE format('grant update on table "public"."%I" to "%I"', table_name, role_name);
        END LOOP;
    END LOOP;
END $$;

-- RLS Policies for courses table

-- Coaches can manage courses for their custom jobs
CREATE POLICY "Coaches can manage courses for their custom jobs"
ON courses
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM custom_jobs cj
        JOIN coaches c ON cj.coach_id = c.id
        WHERE cj.id = courses.custom_job_id
        AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM custom_jobs cj
        JOIN coaches c ON cj.coach_id = c.id
        WHERE cj.id = courses.custom_job_id
        AND c.user_id = auth.uid()
    )
);

-- Enrolled students can read courses
CREATE POLICY "Enrolled students can read courses"
ON courses
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_enrollments cje
        WHERE cje.custom_job_id = courses.custom_job_id
        AND cje.user_id = auth.uid()
    )
);

-- RLS Policies for course_modules table

-- Coaches can manage modules for their courses
CREATE POLICY "Coaches can manage course modules"
ON course_modules
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM courses co
        JOIN custom_jobs cj ON co.custom_job_id = cj.id
        JOIN coaches c ON cj.coach_id = c.id
        WHERE co.id = course_modules.course_id
        AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM courses co
        JOIN custom_jobs cj ON co.custom_job_id = cj.id
        JOIN coaches c ON cj.coach_id = c.id
        WHERE co.id = course_modules.course_id
        AND c.user_id = auth.uid()
    )
);

-- Enrolled students can read course modules
CREATE POLICY "Enrolled students can read course modules"
ON course_modules
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM courses co
        JOIN custom_job_enrollments cje ON cje.custom_job_id = co.custom_job_id
        WHERE co.id = course_modules.course_id
        AND cje.user_id = auth.uid()
    )
);

-- RLS Policies for course_lessons table

-- Coaches can manage lessons for their modules
CREATE POLICY "Coaches can manage course lessons"
ON course_lessons
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM course_modules cm
        JOIN courses co ON cm.course_id = co.id
        JOIN custom_jobs cj ON co.custom_job_id = cj.id
        JOIN coaches c ON cj.coach_id = c.id
        WHERE cm.id = course_lessons.module_id
        AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM course_modules cm
        JOIN courses co ON cm.course_id = co.id
        JOIN custom_jobs cj ON co.custom_job_id = cj.id
        JOIN coaches c ON cj.coach_id = c.id
        WHERE cm.id = course_lessons.module_id
        AND c.user_id = auth.uid()
    )
);

-- Enrolled students can read course lessons
CREATE POLICY "Enrolled students can read course lessons"
ON course_lessons
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM course_modules cm
        JOIN courses co ON cm.course_id = co.id
        JOIN custom_job_enrollments cje ON cje.custom_job_id = co.custom_job_id
        WHERE cm.id = course_lessons.module_id
        AND cje.user_id = auth.uid()
    )
);

-- RLS Policies for course_lesson_blocks table

-- Coaches can manage blocks for their lessons
CREATE POLICY "Coaches can manage course lesson blocks"
ON course_lesson_blocks
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM course_lessons cl
        JOIN course_modules cm ON cl.module_id = cm.id
        JOIN courses co ON cm.course_id = co.id
        JOIN custom_jobs cj ON co.custom_job_id = cj.id
        JOIN coaches c ON cj.coach_id = c.id
        WHERE cl.id = course_lesson_blocks.lesson_id
        AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM course_lessons cl
        JOIN course_modules cm ON cl.module_id = cm.id
        JOIN courses co ON cm.course_id = co.id
        JOIN custom_jobs cj ON co.custom_job_id = cj.id
        JOIN coaches c ON cj.coach_id = c.id
        WHERE cl.id = course_lesson_blocks.lesson_id
        AND c.user_id = auth.uid()
    )
);

-- Enrolled students can read course lesson blocks
CREATE POLICY "Enrolled students can read course lesson blocks"
ON course_lesson_blocks
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM course_lessons cl
        JOIN course_modules cm ON cl.module_id = cm.id
        JOIN courses co ON cm.course_id = co.id
        JOIN custom_job_enrollments cje ON cje.custom_job_id = co.custom_job_id
        WHERE cl.id = course_lesson_blocks.lesson_id
        AND cje.user_id = auth.uid()
    )
);

-- RLS Policies for course_lesson_files table

-- Coaches can manage files for their lessons
CREATE POLICY "Coaches can manage course lesson files"
ON course_lesson_files
FOR ALL
TO authenticated
USING (
    coach_id IN (
        SELECT id FROM coaches WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    coach_id IN (
        SELECT id FROM coaches WHERE user_id = auth.uid()
    )
);

-- Enrolled students can read lesson files
CREATE POLICY "Enrolled students can read course lesson files"
ON course_lesson_files
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM course_lessons cl
        JOIN course_modules cm ON cl.module_id = cm.id
        JOIN courses co ON cm.course_id = co.id
        JOIN custom_job_enrollments cje ON cje.custom_job_id = co.custom_job_id
        WHERE cl.id = course_lesson_files.lesson_id
        AND cje.user_id = auth.uid()
    )
);

-- Create indexes for performance
CREATE INDEX idx_courses_custom_job_id ON courses(custom_job_id) WHERE deletion_status = 'not_deleted';
CREATE INDEX idx_course_modules_course_id ON course_modules(course_id) WHERE deletion_status = 'not_deleted';
CREATE INDEX idx_course_lessons_module_id ON course_lessons(module_id) WHERE deletion_status = 'not_deleted';
CREATE INDEX idx_course_lesson_blocks_lesson_id ON course_lesson_blocks(lesson_id) WHERE deletion_status = 'not_deleted';
CREATE INDEX idx_course_lesson_blocks_file_id ON course_lesson_blocks(file_id) WHERE file_id IS NOT NULL;
CREATE INDEX idx_course_lesson_files_lesson_id ON course_lesson_files(lesson_id);
CREATE INDEX idx_course_lesson_files_coach_id ON course_lesson_files(coach_id);

-- Add composite indexes for common query patterns
CREATE INDEX idx_course_modules_course_id_order ON course_modules(course_id, order_index) WHERE deletion_status = 'not_deleted';
CREATE INDEX idx_course_lessons_module_id_order ON course_lessons(module_id, order_index) WHERE deletion_status = 'not_deleted';
CREATE INDEX idx_course_lesson_blocks_lesson_id_order ON course_lesson_blocks(lesson_id, order_index) WHERE deletion_status = 'not_deleted';

-- Add triggers to update updated_at timestamp
CREATE TRIGGER set_courses_updated_at BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_course_modules_updated_at BEFORE UPDATE ON course_modules
FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_course_lessons_updated_at BEFORE UPDATE ON course_lessons
FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_course_lesson_blocks_updated_at BEFORE UPDATE ON course_lesson_blocks
FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Create storage bucket for course files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket RLS policies for course-files bucket

-- Coaches can upload files to their directory
CREATE POLICY "Coaches can upload course files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'course-files' AND
    EXISTS (
        SELECT 1
        FROM coaches c
        WHERE c.user_id = auth.uid()
        AND (storage.foldername(name))[1] = c.id::text
    )
);

-- Coaches can update their own files
CREATE POLICY "Coaches can update their course files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'course-files' AND
    EXISTS (
        SELECT 1
        FROM coaches c
        WHERE c.user_id = auth.uid()
        AND (storage.foldername(name))[1] = c.id::text
    )
)
WITH CHECK (
    bucket_id = 'course-files' AND
    EXISTS (
        SELECT 1
        FROM coaches c
        WHERE c.user_id = auth.uid()
        AND (storage.foldername(name))[1] = c.id::text
    )
);

-- Coaches can delete their own files
CREATE POLICY "Coaches can delete their course files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'course-files' AND
    EXISTS (
        SELECT 1
        FROM coaches c
        WHERE c.user_id = auth.uid()
        AND (storage.foldername(name))[1] = c.id::text
    )
);

-- Coaches can read their own files
CREATE POLICY "Coaches can read their course files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'course-files' AND
    EXISTS (
        SELECT 1
        FROM coaches c
        WHERE c.user_id = auth.uid()
        AND (storage.foldername(name))[1] = c.id::text
    )
);

-- Enrolled students can read course files
CREATE POLICY "Enrolled students can read course files from storage"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'course-files' AND
    EXISTS (
        SELECT 1
        FROM course_lesson_files clf
        JOIN course_lessons cl ON clf.lesson_id = cl.id
        JOIN course_modules cm ON cl.module_id = cm.id
        JOIN courses co ON cm.course_id = co.id
        JOIN custom_job_enrollments cje ON cje.custom_job_id = co.custom_job_id
        WHERE clf.file_path = name
        AND cje.user_id = auth.uid()
    )
);