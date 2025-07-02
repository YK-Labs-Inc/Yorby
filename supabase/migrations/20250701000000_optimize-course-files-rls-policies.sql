-- Drop existing RLS policies for course-files bucket
DROP POLICY IF EXISTS "Coaches can upload course files" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can update their course files" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can delete their course files" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can read their course files" ON storage.objects;

-- Recreate RLS policies with optimized subquery check

-- Coaches can upload files to their directory
CREATE POLICY "Coaches can upload course files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'course-files' AND
    (( SELECT (c.id)::text AS id
       FROM coaches c
       WHERE (c.user_id = auth.uid())) = (storage.foldername(name))[1])
);

-- Coaches can update their own files
CREATE POLICY "Coaches can update their course files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'course-files' AND
    (( SELECT (c.id)::text AS id
       FROM coaches c
       WHERE (c.user_id = auth.uid())) = (storage.foldername(name))[1])
)
WITH CHECK (
    bucket_id = 'course-files' AND
    (( SELECT (c.id)::text AS id
       FROM coaches c
       WHERE (c.user_id = auth.uid())) = (storage.foldername(name))[1])
);

-- Coaches can delete their own files
CREATE POLICY "Coaches can delete their course files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'course-files' AND
    (( SELECT (c.id)::text AS id
       FROM coaches c
       WHERE (c.user_id = auth.uid())) = (storage.foldername(name))[1])
);

-- Coaches can read their own files
CREATE POLICY "Coaches can read their course files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'course-files' AND
    (( SELECT (c.id)::text AS id
       FROM coaches c
       WHERE (c.user_id = auth.uid())) = (storage.foldername(name))[1])
);