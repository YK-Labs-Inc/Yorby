-- Remove deletion_status columns from course-related tables
-- and switch from soft deletes to hard deletes

-- Drop deletion_status column from courses
ALTER TABLE courses
DROP COLUMN IF EXISTS deletion_status;

-- Drop deletion_status column from course_modules
ALTER TABLE course_modules 
DROP COLUMN IF EXISTS deletion_status;

-- Drop deletion_status column from course_lessons
ALTER TABLE course_lessons 
DROP COLUMN IF EXISTS deletion_status;

-- Drop deletion_status column from course_lesson_blocks
ALTER TABLE course_lesson_blocks 
DROP COLUMN IF EXISTS deletion_status;

-- Note: The cascade deletion rules are already properly set up:
-- - When a course is deleted, modules are cascade deleted
-- - When a module is deleted, lessons are cascade deleted  
-- - When a lesson is deleted, blocks are cascade deleted
-- This ensures referential integrity is maintained with hard deletes