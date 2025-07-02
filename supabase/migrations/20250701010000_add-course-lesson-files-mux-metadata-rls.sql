-- Add RLS policies for course_lesson_files_mux_metadata table

-- Enable RLS
ALTER TABLE course_lesson_files_mux_metadata ENABLE ROW LEVEL SECURITY;

-- Policy 1: Coaches have ALL operations on mux metadata for their course files
CREATE POLICY "Coaches have full access to their course files mux metadata"
ON course_lesson_files_mux_metadata
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM course_lesson_files clf
    JOIN course_lessons cl ON clf.lesson_id = cl.id
    JOIN course_modules cm ON cl.module_id = cm.id
    JOIN courses c ON cm.course_id = c.id
    JOIN custom_jobs cj ON c.custom_job_id = cj.id
    JOIN coaches co ON cj.coach_id = co.id
    WHERE clf.id = course_lesson_files_mux_metadata.id
    AND co.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM course_lesson_files clf
    JOIN course_lessons cl ON clf.lesson_id = cl.id
    JOIN course_modules cm ON cl.module_id = cm.id
    JOIN courses c ON cm.course_id = c.id
    JOIN custom_jobs cj ON c.custom_job_id = cj.id
    JOIN coaches co ON cj.coach_id = co.id
    WHERE clf.id = course_lesson_files_mux_metadata.id
    AND co.user_id = auth.uid()
  )
);