-- Create ENUM types for the schema
CREATE TYPE company_member_role AS ENUM ('owner', 'admin', 'recruiter', 'viewer');

-- Create companies table to represent businesses using the platform
CREATE TABLE companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    website TEXT,
    industry TEXT,
    company_size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create company_members table to link users to companies with roles
CREATE TABLE company_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role company_member_role NOT NULL,
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(company_id, user_id)
);

-- Add company_id to existing custom_jobs table to link jobs to companies
ALTER TABLE custom_jobs ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Create index for company_id on custom_jobs
CREATE INDEX idx_custom_jobs_company_id ON custom_jobs(company_id);

-- Create company_job_candidates table to track candidate applications
CREATE TABLE company_job_candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    custom_job_id UUID NOT NULL REFERENCES custom_jobs(id) ON DELETE CASCADE,
    candidate_user_id UUID REFERENCES auth.users(id), -- If candidate has an account
    candidate_email TEXT NOT NULL,
    candidate_name TEXT NOT NULL,
    candidate_phone TEXT,
    resume_url TEXT,
    resume_data JSONB, -- Parsed resume data
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'interviewed', 'reviewing', 'offered', 'rejected', 'withdrawn')),
    notes TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(custom_job_id, candidate_email)
);

-- Add candidate_id to existing custom_job_mock_interviews table
ALTER TABLE custom_job_mock_interviews ADD COLUMN candidate_id UUID REFERENCES company_job_candidates(id) ON DELETE CASCADE;

-- Create index for candidate_id on mock interviews
CREATE INDEX idx_mock_interviews_candidate_id ON custom_job_mock_interviews(candidate_id);


-- Add indexes for performance
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_company_members_company_id ON company_members(company_id);
CREATE INDEX idx_company_members_user_id ON company_members(user_id);
CREATE INDEX idx_company_job_candidates_custom_job_id ON company_job_candidates(custom_job_id);
CREATE INDEX idx_company_job_candidates_candidate_email ON company_job_candidates(candidate_email);
CREATE INDEX idx_company_job_candidates_status ON company_job_candidates(status);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_job_candidates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies table
CREATE POLICY "Company members can view their company" ON companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM company_members 
            WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
        )
    );

CREATE POLICY "Company owners and admins can update their company" ON companies
    FOR UPDATE USING (
        id IN (
            SELECT company_id FROM company_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
            AND accepted_at IS NOT NULL
        )
    );

CREATE POLICY "Authenticated users can create companies" ON companies
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for company_members table
CREATE POLICY "Company members can view other members" ON company_members
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM company_members 
            WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
        )
    );

CREATE POLICY "Company owners and admins can manage members" ON company_members
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM company_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
            AND accepted_at IS NOT NULL
        )
    );

CREATE POLICY "Users can view their own invitations" ON company_members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can accept their own invitations" ON company_members
    FOR UPDATE USING (user_id = auth.uid() AND accepted_at IS NULL)
    WITH CHECK (user_id = auth.uid());

-- Update RLS policies for custom_jobs to support company access
CREATE POLICY "Company members can view their company jobs" ON custom_jobs
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM company_members 
            WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
        )
        OR user_id = auth.uid()
        OR coach_id IN (
            SELECT coach_id FROM custom_job_enrollments 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Company recruiters can manage company jobs" ON custom_jobs
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM company_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'recruiter')
            AND accepted_at IS NOT NULL
        )
        OR user_id = auth.uid()
    );

-- Update RLS policies for custom_job_mock_interviews to support candidate access
CREATE POLICY "Company members can view candidate interviews" ON custom_job_mock_interviews
    FOR SELECT USING (
        candidate_id IN (
            SELECT id FROM company_job_candidates
            WHERE company_id IN (
                SELECT company_id FROM company_members 
                WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
            )
        )
        OR user_id = auth.uid()
        OR custom_job_id IN (
            SELECT id FROM custom_jobs
            WHERE coach_id IN (
                SELECT coach_id FROM custom_job_enrollments 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "System can create candidate interviews" ON custom_job_mock_interviews
    FOR INSERT WITH CHECK (
        candidate_id IS NOT NULL 
        OR user_id = auth.uid()
    );

-- RLS Policies for company_job_candidates table
CREATE POLICY "Company members can view candidates" ON company_job_candidates
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM company_members 
            WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
        )
    );

CREATE POLICY "Candidates can view their own applications" ON company_job_candidates
    FOR SELECT USING (candidate_user_id = auth.uid());

CREATE POLICY "Anyone can apply to jobs" ON company_job_candidates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Company recruiters can manage candidates" ON company_job_candidates
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM company_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'recruiter')
            AND accepted_at IS NOT NULL
        )
    );


-- Create function to automatically add creator as owner when company is created
CREATE OR REPLACE FUNCTION add_company_owner()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO company_members (company_id, user_id, role, accepted_at)
    VALUES (NEW.id, auth.uid(), 'owner', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_company_created
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION add_company_owner();

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_job_candidates_updated_at BEFORE UPDATE ON company_job_candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();