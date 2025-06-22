-- Add RLS policies for custom_job_enrollments table

-- Policy 1: Users have full access to their own enrollments
CREATE POLICY "Users can manage their own enrollments"
ON custom_job_enrollments
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Coaches have full access to enrollments in their programs
CREATE POLICY "Coaches can manage enrollments in their programs"
ON custom_job_enrollments
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM coaches
        WHERE coaches.id = custom_job_enrollments.coach_id
        AND coaches.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM coaches
        WHERE coaches.id = custom_job_enrollments.coach_id
        AND coaches.user_id = auth.uid()
    )
);