-- Create enum types for company interview system
CREATE TYPE job_interview_type AS ENUM ('general', 'coding');
CREATE TYPE job_interview_status AS ENUM ('pending', 'in_progress', 'completed');

-- 1. Company Interview Question Bank
CREATE TABLE company_interview_question_bank (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    question_type job_interview_type NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Job Interviews (Interview Rounds)
CREATE TABLE job_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_job_id UUID NOT NULL REFERENCES custom_jobs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    interview_type job_interview_type NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(custom_job_id, order_index)
);

-- 3. Job Interview Questions (Questions per Round)
CREATE TABLE job_interview_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL REFERENCES job_interviews(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES company_interview_question_bank(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(interview_id, question_id),
    UNIQUE(interview_id, order_index)
);

-- 4. Candidate Job Interviews (Candidate's Round Progress)
CREATE TABLE candidate_job_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES company_job_candidates(id) ON DELETE CASCADE,
    interview_id UUID NOT NULL REFERENCES job_interviews(id) ON DELETE CASCADE,
    status job_interview_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(candidate_id, interview_id)
);

-- 5. Job Interview Messages (Transcript)
CREATE TABLE job_interview_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_interview_id UUID NOT NULL REFERENCES candidate_job_interviews(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Job Interview Recordings (Video per Round)
CREATE TABLE job_interview_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_interview_id UUID NOT NULL REFERENCES candidate_job_interviews(id) ON DELETE CASCADE,
    upload_id TEXT,
    asset_id TEXT,
    playback_id TEXT,
    status mux_status NOT NULL DEFAULT 'preparing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 7. Job Interview Coding Submissions (For Coding Rounds)
CREATE TABLE job_interview_coding_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_interview_id UUID NOT NULL REFERENCES candidate_job_interviews(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES company_interview_question_bank(id) ON DELETE CASCADE,
    submission_text TEXT NOT NULL,
    submission_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_company_interview_question_bank_company_id ON company_interview_question_bank(company_id);
CREATE INDEX idx_job_interviews_custom_job_id ON job_interviews(custom_job_id);
CREATE INDEX idx_job_interview_questions_interview_id ON job_interview_questions(interview_id);
CREATE INDEX idx_job_interview_questions_question_id ON job_interview_questions(question_id);
CREATE INDEX idx_candidate_job_interviews_candidate_id ON candidate_job_interviews(candidate_id);
CREATE INDEX idx_candidate_job_interviews_interview_id ON candidate_job_interviews(interview_id);
CREATE INDEX idx_job_interview_messages_candidate_interview_id_created ON job_interview_messages(candidate_interview_id, created_at);
CREATE INDEX idx_job_interview_recordings_candidate_interview_id ON job_interview_recordings(candidate_interview_id);
CREATE INDEX idx_job_interview_coding_submissions_candidate_interview_id ON job_interview_coding_submissions(candidate_interview_id);
CREATE INDEX idx_job_interview_coding_submissions_question_id ON job_interview_coding_submissions(question_id);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_interview_question_bank_updated_at BEFORE UPDATE ON company_interview_question_bank
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_interviews_updated_at BEFORE UPDATE ON job_interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_job_interviews_updated_at BEFORE UPDATE ON candidate_job_interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_interview_recordings_updated_at BEFORE UPDATE ON job_interview_recordings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE company_interview_question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_job_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_interview_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_interview_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_interview_coding_submissions ENABLE ROW LEVEL SECURITY;

-- Company Interview Question Bank Policies
-- Company members can view their company's questions
CREATE POLICY "Company members can view their questions" ON company_interview_question_bank
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_members
            WHERE company_members.company_id = company_interview_question_bank.company_id
            AND company_members.user_id = auth.uid()
        )
    );

-- Only owners, admins, and recruiters can create/update/delete questions
CREATE POLICY "Company owners/admins/recruiters can manage questions" ON company_interview_question_bank
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM company_members
            WHERE company_members.company_id = company_interview_question_bank.company_id
            AND company_members.user_id = auth.uid()
            AND company_members.role IN ('owner', 'admin', 'recruiter')
        )
    );

-- Job Interviews Policies
-- Company members can view interviews for their company's jobs
CREATE POLICY "Company members can view job interviews" ON job_interviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM custom_jobs
            JOIN company_members ON company_members.company_id = custom_jobs.company_id
            WHERE custom_jobs.id = job_interviews.custom_job_id
            AND company_members.user_id = auth.uid()
        )
    );

-- Only owners, admins, and recruiters can manage interviews
CREATE POLICY "Company owners/admins/recruiters can manage interviews" ON job_interviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM custom_jobs
            JOIN company_members ON company_members.company_id = custom_jobs.company_id
            WHERE custom_jobs.id = job_interviews.custom_job_id
            AND company_members.user_id = auth.uid()
            AND company_members.role IN ('owner', 'admin', 'recruiter')
        )
    );

-- Job Interview Questions Policies
-- Company members can view interview questions
CREATE POLICY "Company members can view interview questions" ON job_interview_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_interviews
            JOIN custom_jobs ON custom_jobs.id = job_interviews.custom_job_id
            JOIN company_members ON company_members.company_id = custom_jobs.company_id
            WHERE job_interviews.id = job_interview_questions.interview_id
            AND company_members.user_id = auth.uid()
        )
    );

-- Only owners, admins, and recruiters can manage interview questions
CREATE POLICY "Company owners/admins/recruiters can manage interview questions" ON job_interview_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM job_interviews
            JOIN custom_jobs ON custom_jobs.id = job_interviews.custom_job_id
            JOIN company_members ON company_members.company_id = custom_jobs.company_id
            WHERE job_interviews.id = job_interview_questions.interview_id
            AND company_members.user_id = auth.uid()
            AND company_members.role IN ('owner', 'admin', 'recruiter')
        )
    );

-- Candidate Job Interviews Policies
-- Candidates can view their own interviews
CREATE POLICY "Candidates can view their own interviews" ON candidate_job_interviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_job_candidates
            WHERE company_job_candidates.id = candidate_job_interviews.candidate_id
            AND company_job_candidates.candidate_user_id = auth.uid()
        )
    );

-- Candidates can update their own interview status (start/complete)
CREATE POLICY "Candidates can update their interview status" ON candidate_job_interviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM company_job_candidates
            WHERE company_job_candidates.id = candidate_job_interviews.candidate_id
            AND company_job_candidates.candidate_user_id = auth.uid()
        )
    );

-- Company members can view candidate interviews
CREATE POLICY "Company members can view candidate interviews" ON candidate_job_interviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_job_candidates
            JOIN company_members ON company_members.company_id = company_job_candidates.company_id
            WHERE company_job_candidates.id = candidate_job_interviews.candidate_id
            AND company_members.user_id = auth.uid()
        )
    );

-- Company owners/admins/recruiters can manage candidate interviews
CREATE POLICY "Company owners/admins/recruiters can manage candidate interviews" ON candidate_job_interviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM company_job_candidates
            JOIN company_members ON company_members.company_id = company_job_candidates.company_id
            WHERE company_job_candidates.id = candidate_job_interviews.candidate_id
            AND company_members.user_id = auth.uid()
            AND company_members.role IN ('owner', 'admin', 'recruiter')
        )
    );

-- Job Interview Messages Policies
-- Candidates can view and create their own messages
CREATE POLICY "Candidates can view their messages" ON job_interview_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM candidate_job_interviews
            JOIN company_job_candidates ON company_job_candidates.id = candidate_job_interviews.candidate_id
            WHERE candidate_job_interviews.id = job_interview_messages.candidate_interview_id
            AND company_job_candidates.candidate_user_id = auth.uid()
        )
    );

CREATE POLICY "Candidates can create messages" ON job_interview_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM candidate_job_interviews
            JOIN company_job_candidates ON company_job_candidates.id = candidate_job_interviews.candidate_id
            WHERE candidate_job_interviews.id = job_interview_messages.candidate_interview_id
            AND company_job_candidates.candidate_user_id = auth.uid()
        )
    );

-- Company members can view messages
CREATE POLICY "Company members can view messages" ON job_interview_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM candidate_job_interviews
            JOIN company_job_candidates ON company_job_candidates.id = candidate_job_interviews.candidate_id
            JOIN company_members ON company_members.company_id = company_job_candidates.company_id
            WHERE candidate_job_interviews.id = job_interview_messages.candidate_interview_id
            AND company_members.user_id = auth.uid()
        )
    );

-- Job Interview Recordings Policies
-- Similar pattern as messages
CREATE POLICY "Candidates can view their recordings" ON job_interview_recordings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM candidate_job_interviews
            JOIN company_job_candidates ON company_job_candidates.id = candidate_job_interviews.candidate_id
            WHERE candidate_job_interviews.id = job_interview_recordings.candidate_interview_id
            AND company_job_candidates.candidate_user_id = auth.uid()
        )
    );

CREATE POLICY "Candidates can create/update recordings" ON job_interview_recordings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM candidate_job_interviews
            JOIN company_job_candidates ON company_job_candidates.id = candidate_job_interviews.candidate_id
            WHERE candidate_job_interviews.id = job_interview_recordings.candidate_interview_id
            AND company_job_candidates.candidate_user_id = auth.uid()
        )
    );

CREATE POLICY "Company members can view recordings" ON job_interview_recordings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM candidate_job_interviews
            JOIN company_job_candidates ON company_job_candidates.id = candidate_job_interviews.candidate_id
            JOIN company_members ON company_members.company_id = company_job_candidates.company_id
            WHERE candidate_job_interviews.id = job_interview_recordings.candidate_interview_id
            AND company_members.user_id = auth.uid()
        )
    );

-- Job Interview Coding Submissions Policies
CREATE POLICY "Candidates can manage their submissions" ON job_interview_coding_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM candidate_job_interviews
            JOIN company_job_candidates ON company_job_candidates.id = candidate_job_interviews.candidate_id
            WHERE candidate_job_interviews.id = job_interview_coding_submissions.candidate_interview_id
            AND company_job_candidates.candidate_user_id = auth.uid()
        )
    );

CREATE POLICY "Company members can view submissions" ON job_interview_coding_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM candidate_job_interviews
            JOIN company_job_candidates ON company_job_candidates.id = candidate_job_interviews.candidate_id
            JOIN company_members ON company_members.company_id = company_job_candidates.company_id
            WHERE candidate_job_interviews.id = job_interview_coding_submissions.candidate_interview_id
            AND company_members.user_id = auth.uid()
        )
    );