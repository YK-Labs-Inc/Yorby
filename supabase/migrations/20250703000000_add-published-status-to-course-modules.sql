-- Add published status to course_modules table
-- This allows coaches to work on course content in draft mode before publishing to students

-- Add published column to course_modules table
ALTER TABLE course_modules 
ADD COLUMN published BOOLEAN NOT NULL DEFAULT false;

-- Set all existing modules to published by default to maintain current behavior
UPDATE course_modules 
SET published = true;

-- Add index for efficient filtering of published modules
CREATE INDEX idx_course_modules_published ON course_modules(course_id, published) 
WHERE published = true;

-- Update RLS policies to respect published status for students
-- The existing "Coaches can manage course modules" policy already provides full access to coaches
-- We only need to update the student access policy

-- Drop the existing student read policy
DROP POLICY IF EXISTS "Enrolled students can read course modules" ON course_modules;

-- Create new student policy that respects published status
CREATE POLICY "Enrolled students can read published course modules" ON course_modules
  FOR SELECT
  USING (
    published = true AND
    EXISTS (
      SELECT 1 FROM courses c
      JOIN custom_job_enrollments e ON e.custom_job_id = c.custom_job_id
      WHERE c.id = course_modules.course_id
      AND e.user_id = auth.uid()
    )
  );

-- Note: When a module is unpublished, all its lessons and blocks remain intact
-- but are effectively hidden from students due to the module-level filter