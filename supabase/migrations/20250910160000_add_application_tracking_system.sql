-- Create application tracking system
-- Remove existing status field and add customizable stages per company

-- Create the company_application_stages table
CREATE TABLE company_application_stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    order_index integer NOT NULL,
    color text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_company_stage_name UNIQUE (company_id, name),
    CONSTRAINT unique_company_stage_order UNIQUE (company_id, order_index)
);

-- Add RLS to company_application_stages
ALTER TABLE company_application_stages ENABLE ROW LEVEL SECURITY;

-- RLS policy: Company members can manage their company's stages
CREATE POLICY "Company members can manage application stages" ON company_application_stages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_members.company_id = company_application_stages.company_id 
            AND company_members.user_id = auth.uid()
            AND company_members.accepted_at IS NOT NULL
        )
    );

-- Remove the old status field from company_job_candidates
ALTER TABLE company_job_candidates DROP COLUMN IF EXISTS status;

-- Add the new current_stage_id field (nullable)
ALTER TABLE company_job_candidates ADD COLUMN current_stage_id uuid NULL REFERENCES company_application_stages(id);

-- Create indexes for performance
CREATE INDEX idx_company_job_candidates_current_stage_id ON company_job_candidates(current_stage_id);
CREATE INDEX idx_company_application_stages_company_id ON company_application_stages(company_id);
CREATE INDEX idx_company_application_stages_order ON company_application_stages(company_id, order_index);

-- Insert default stages for all existing companies
INSERT INTO company_application_stages (company_id, name, description, order_index, color)
SELECT 
    companies.id,
    stage_data.name,
    stage_data.description,
    stage_data.order_index,
    stage_data.color
FROM companies
CROSS JOIN (
    VALUES 
        ('Applied', 'Candidate has submitted their application', 1, '#3B82F6'),
        ('Reviewing', 'Application is being reviewed by the team', 2, '#F59E0B'),
        ('Interviewing', 'Candidate is actively interviewing', 3, '#8B5CF6'),
        ('Offer Extended', 'Job offer has been extended to candidate', 4, '#059669'),
        ('Hired', 'Candidate has accepted the offer and been hired', 5, '#047857'),
        ('Offer Declined', 'Candidate declined the job offer', 6, '#F97316'),
        ('Rejected', 'Application has been rejected', 7, '#DC2626')
) AS stage_data(name, description, order_index, color);

-- Set all existing candidates to "Applied" stage by default
UPDATE company_job_candidates 
SET current_stage_id = (
    SELECT company_application_stages.id 
    FROM company_application_stages 
    WHERE company_application_stages.company_id = company_job_candidates.company_id 
    AND company_application_stages.name = 'Applied'
    LIMIT 1
)
WHERE current_stage_id IS NULL;

-- Keep current_stage_id nullable to allow flexible tracking

-- Create function to automatically add default stages for new companies
CREATE OR REPLACE FUNCTION create_default_application_stages()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default stages for the new company
    INSERT INTO company_application_stages (company_id, name, description, order_index, color)
    VALUES 
        (NEW.id, 'Applied', 'Candidate has submitted their application', 1, '#3B82F6'),
        (NEW.id, 'Reviewing', 'Application is being reviewed by the team', 2, '#F59E0B'),
        (NEW.id, 'Interviewing', 'Candidate is actively interviewing', 3, '#8B5CF6'),
        (NEW.id, 'Offer Extended', 'Job offer has been extended to candidate', 4, '#059669'),
        (NEW.id, 'Hired', 'Candidate has accepted the offer and been hired', 5, '#047857'),
        (NEW.id, 'Offer Declined', 'Candidate declined the job offer', 6, '#F97316'),
        (NEW.id, 'Rejected', 'Application has been rejected', 7, '#DC2626');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add default stages when a new company is created
CREATE TRIGGER trigger_create_default_application_stages
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION create_default_application_stages();