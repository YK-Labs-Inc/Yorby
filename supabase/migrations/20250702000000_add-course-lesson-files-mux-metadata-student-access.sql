-- Add RLS policy for students to have SELECT access to course_lesson_files_mux_metadata table
-- if they are enrolled in the parent custom job

-- Policy: Students have SELECT access to mux metadata for course files in their enrolled programs
CREATE POLICY "Students can view course files mux metadata for enrolled programs"
ON course_lesson_files_mux_metadata
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM course_lesson_files clf
    JOIN course_lessons cl ON clf.lesson_id = cl.id
    JOIN course_modules cm ON cl.module_id = cm.id
    JOIN courses c ON cm.course_id = c.id
    JOIN custom_jobs cj ON c.custom_job_id = cj.id
    JOIN custom_job_enrollments cje ON cj.id = cje.custom_job_id
    WHERE clf.id = course_lesson_files_mux_metadata.id
    AND cje.user_id = auth.uid()
  )
);