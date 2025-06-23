-- Add RLS policy to allow users full access to their own mock interviews
CREATE POLICY "Users can manage their own mock interviews"
ON "public"."custom_job_mock_interviews"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add RLS policy to allow coaches to SELECT mock interviews
-- for students who are enrolled in their custom jobs through custom_job_enrollments
CREATE POLICY "Coaches can view mock interviews from enrolled students"
ON "public"."custom_job_mock_interviews"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_enrollments cje
        JOIN custom_jobs cj ON cje.custom_job_id = cj.id
        JOIN coaches c ON cje.coach_id = c.id
        WHERE c.user_id = auth.uid()
        AND cj.id = custom_job_mock_interviews.custom_job_id
        AND cje.user_id = custom_job_mock_interviews.user_id
    )
);

-- Add RLS policy to allow users full access to mock_interview_questions for their own interviews
CREATE POLICY "Users can manage their own mock interview questions"
ON "public"."mock_interview_questions"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_mock_interviews cjmi
        WHERE cjmi.id = mock_interview_questions.interview_id
        AND cjmi.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM custom_job_mock_interviews cjmi
        WHERE cjmi.id = mock_interview_questions.interview_id
        AND cjmi.user_id = auth.uid()
    )
);

-- Add RLS policy to allow coaches to SELECT mock_interview_questions for enrolled students
CREATE POLICY "Coaches can view mock interview questions from enrolled students"
ON "public"."mock_interview_questions"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_mock_interviews cjmi
        JOIN custom_job_enrollments cje ON cje.custom_job_id = cjmi.custom_job_id
        JOIN coaches c ON cje.coach_id = c.id
        WHERE c.user_id = auth.uid()
        AND cjmi.id = mock_interview_questions.interview_id
        AND cje.user_id = cjmi.user_id
    )
);

-- Add RLS policy to allow users full access to mock_interview_question_feedback for their own interviews
CREATE POLICY "Users can manage their own mock interview question feedback"
ON "public"."mock_interview_question_feedback"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_mock_interviews cjmi
        WHERE cjmi.id = mock_interview_question_feedback.mock_interview_id
        AND cjmi.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM custom_job_mock_interviews cjmi
        WHERE cjmi.id = mock_interview_question_feedback.mock_interview_id
        AND cjmi.user_id = auth.uid()
    )
);

-- Add RLS policy to allow coaches to SELECT mock_interview_question_feedback for enrolled students
CREATE POLICY "Coaches can view mock interview question feedback from enrolled students"
ON "public"."mock_interview_question_feedback"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_mock_interviews cjmi
        JOIN custom_job_enrollments cje ON cje.custom_job_id = cjmi.custom_job_id
        JOIN coaches c ON cje.coach_id = c.id
        WHERE cjmi.id = mock_interview_question_feedback.mock_interview_id
        AND c.user_id = auth.uid()
        AND cje.user_id = cjmi.user_id
    )
);

-- Add RLS policy to allow users full access to mock_interview_messages for their own interviews
CREATE POLICY "Users can manage their own mock interview messages"
ON "public"."mock_interview_messages"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_mock_interviews cjmi
        WHERE cjmi.id = mock_interview_messages.mock_interview_id
        AND cjmi.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM custom_job_mock_interviews cjmi
        WHERE cjmi.id = mock_interview_messages.mock_interview_id
        AND cjmi.user_id = auth.uid()
    )
);

-- Add RLS policy to allow coaches to SELECT mock_interview_messages for enrolled students
CREATE POLICY "Coaches can view mock interview messages from enrolled students"
ON "public"."mock_interview_messages"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_mock_interviews cjmi
        JOIN custom_job_enrollments cje ON cje.custom_job_id = cjmi.custom_job_id
        JOIN coaches c ON cje.coach_id = c.id
        WHERE c.user_id = auth.uid()
        AND cjmi.id = mock_interview_messages.mock_interview_id
        AND cje.user_id = cjmi.user_id
    )
);

-- Add RLS policy to allow users full access to mock_interview_message_mux_metadata for their own interviews
CREATE POLICY "Users can manage their own mock interview message mux metadata"
ON "public"."mock_interview_message_mux_metadata"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM mock_interview_messages mim
        JOIN custom_job_mock_interviews cjmi ON cjmi.id = mim.mock_interview_id
        WHERE mim.id = mock_interview_message_mux_metadata.id
        AND cjmi.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM mock_interview_messages mim
        JOIN custom_job_mock_interviews cjmi ON cjmi.id = mim.mock_interview_id
        WHERE mim.id = mock_interview_message_mux_metadata.id
        AND cjmi.user_id = auth.uid()
    )
);

-- Add RLS policy to allow coaches to SELECT mock_interview_message_mux_metadata for enrolled students
CREATE POLICY "Coaches can view mock interview message mux metadata from enrolled students"
ON "public"."mock_interview_message_mux_metadata"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM mock_interview_messages mim
        JOIN custom_job_mock_interviews cjmi ON cjmi.id = mim.mock_interview_id
        JOIN custom_job_enrollments cje ON cje.custom_job_id = cjmi.custom_job_id
        JOIN coaches c ON cje.coach_id = c.id
        WHERE c.user_id = auth.uid()
        AND mim.id = mock_interview_message_mux_metadata.id
        AND cje.user_id = cjmi.user_id
    )
);

-- Add RLS policy to allow users full access to custom_job_mock_interview_feedback for their own interviews
CREATE POLICY "Users can manage their own custom job mock interview feedback"
ON "public"."custom_job_mock_interview_feedback"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_mock_interviews cjmi
        WHERE cjmi.id = custom_job_mock_interview_feedback.mock_interview_id
        AND cjmi.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM custom_job_mock_interviews cjmi
        WHERE cjmi.id = custom_job_mock_interview_feedback.mock_interview_id
        AND cjmi.user_id = auth.uid()
    )
);

-- Add RLS policy to allow coaches to SELECT custom_job_mock_interview_feedback for enrolled students
CREATE POLICY "Coaches can view custom job mock interview feedback from enrolled students"
ON "public"."custom_job_mock_interview_feedback"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_mock_interviews cjmi
        JOIN custom_job_enrollments cje ON cje.custom_job_id = cjmi.custom_job_id
        JOIN coaches c ON cje.coach_id = c.id
        WHERE c.user_id = auth.uid()
        AND cjmi.id = custom_job_mock_interview_feedback.mock_interview_id
        AND cje.user_id = cjmi.user_id
    )
);