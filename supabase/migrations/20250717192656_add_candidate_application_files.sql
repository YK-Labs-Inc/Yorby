-- Create junction table to link user files to job applications
CREATE TABLE IF NOT EXISTS public.candidate_application_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES public.company_job_candidates(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES public.user_files(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(candidate_id, file_id)
);

-- Add indexes for performance
CREATE INDEX idx_candidate_application_files_candidate_id ON public.candidate_application_files(candidate_id);
CREATE INDEX idx_candidate_application_files_file_id ON public.candidate_application_files(file_id);

-- Enable RLS
ALTER TABLE public.candidate_application_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for candidate_application_files
-- Allow candidates full access to their own application files
CREATE POLICY "Candidates can manage their own application files" ON public.candidate_application_files
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.company_job_candidates cjc
            WHERE cjc.id = candidate_id 
            AND cjc.candidate_user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_job_candidates cjc
            WHERE cjc.id = candidate_id 
            AND cjc.candidate_user_id = auth.uid()
        )
    );

-- Allow company members to view application files
CREATE POLICY "Company members can view application files" ON public.candidate_application_files
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 
            FROM public.company_job_candidates cjc
            JOIN public.company_members cm ON cjc.company_id = cm.company_id
            WHERE cjc.id = candidate_id 
            AND cm.user_id = auth.uid()
            AND cm.accepted_at IS NOT NULL
        )
    );
