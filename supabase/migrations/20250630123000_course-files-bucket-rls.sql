-- Ensure course-files storage bucket exists and has proper RLS policies
-- This migration ensures the bucket and policies are properly configured

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Coaches can upload course files" ON storage.objects;
    DROP POLICY IF EXISTS "Coaches can update their course files" ON storage.objects;
    DROP POLICY IF EXISTS "Coaches can delete their course files" ON storage.objects;
    DROP POLICY IF EXISTS "Coaches can read their course files" ON storage.objects;
    DROP POLICY IF EXISTS "Enrolled students can read course files from storage" ON storage.objects;
END $$;

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
-- This policy allows students to access files that are referenced in course_lesson_files
-- and belong to courses they are enrolled in
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

-- Service role can perform all operations (for backend operations)
CREATE POLICY "Service role can manage all course files"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'course-files')
WITH CHECK (bucket_id = 'course-files');

-- Add comment to document the expected file structure
COMMENT ON POLICY "Coaches can upload course files" ON storage.objects IS 
'Files should be organized in the format: course-files/{coach_id}/{lesson_id}/{filename}';