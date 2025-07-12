-- Create mock_interview_gcp_storage_metadata table
CREATE TABLE public.mock_interview_gcp_storage_metadata (
    id uuid PRIMARY KEY REFERENCES public.custom_job_mock_interviews(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    bucket_name text NOT NULL,
    file_path text NOT NULL
);

-- Enable RLS
ALTER TABLE public.mock_interview_gcp_storage_metadata ENABLE ROW LEVEL SECURITY;

-- RLS policy: Allow users full access if they own the parent mock interview
CREATE POLICY "Users can manage their own mock interview GCP storage metadata" ON public.mock_interview_gcp_storage_metadata
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.custom_job_mock_interviews cjmi
            WHERE cjmi.id = mock_interview_gcp_storage_metadata.id
            AND cjmi.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.custom_job_mock_interviews cjmi
            WHERE cjmi.id = mock_interview_gcp_storage_metadata.id
            AND cjmi.user_id = auth.uid()
        )
    );

-- RLS policy: Allow coaches to select mock interview GCP storage metadata for their students
CREATE POLICY "Coaches can view their students mock interview GCP storage metadata" ON public.mock_interview_gcp_storage_metadata
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.custom_job_mock_interviews cjmi
            JOIN public.custom_jobs cj ON cj.id = cjmi.custom_job_id
            JOIN public.coaches c ON c.id = cj.coach_id
            WHERE cjmi.id = mock_interview_gcp_storage_metadata.id
            AND c.user_id = auth.uid()
        )
    );