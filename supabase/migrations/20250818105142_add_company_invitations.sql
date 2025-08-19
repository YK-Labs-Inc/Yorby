-- Add support for company member invitations

-- Make user_id nullable to support pending invitations
ALTER TABLE company_members 
ALTER COLUMN user_id DROP NOT NULL;

-- Add fields for invitation tracking
ALTER TABLE company_members 
ADD COLUMN invitation_email VARCHAR(255),
ADD COLUMN invitation_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN invitation_expires_at TIMESTAMP WITH TIME ZONE;

-- Add constraint: either user_id OR invitation_email must be present
ALTER TABLE company_members 
ADD CONSTRAINT check_user_or_invitation 
CHECK (user_id IS NOT NULL OR invitation_email IS NOT NULL);

-- Add unique constraint for pending invitations (can't invite same email twice to same company)
CREATE UNIQUE INDEX idx_company_invitation_email 
ON company_members(company_id, invitation_email) 
WHERE accepted_at IS NULL;

-- Add index for token lookups
CREATE INDEX idx_invitation_token ON company_members(invitation_token) 
WHERE invitation_token IS NOT NULL;

-- Update RLS policies to handle nullable user_id

-- Temporarily disable RLS to avoid recursion during policy updates
ALTER TABLE company_members DISABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Company members can view their own membership" ON company_members;
DROP POLICY IF EXISTS "Company members can view all members of their companies" ON company_members;

-- Create new policies that handle both active members and invitations

-- Allow users to view their own membership records
CREATE POLICY "Users can view their own membership" ON company_members
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Allow company members to view all members and invitations of their companies
-- Using the is_company_member function to avoid recursion
CREATE POLICY "Company members can view all members and invitations" ON company_members
    FOR SELECT USING (
        is_company_member(company_id, auth.uid())
    );

-- Re-enable RLS
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- Allow company admins/owners to create invitations
CREATE POLICY "Company admins can create invitations" ON company_members
    FOR INSERT WITH CHECK (
        -- Must be creating an invitation (not a direct member)
        user_id IS NULL 
        AND invitation_email IS NOT NULL
        AND is_company_owner_or_admin(company_id, auth.uid())
    );

-- Allow company admins/owners to update invitations (for cancel/resend)
CREATE POLICY "Company admins can update invitations" ON company_members
    FOR UPDATE USING (
        -- Must be an invitation
        user_id IS NULL 
        AND is_company_owner_or_admin(company_id, auth.uid())
    );

-- Allow company admins/owners to delete invitations (cancel)
CREATE POLICY "Company admins can delete invitations" ON company_members
    FOR DELETE USING (
        -- Must be an invitation (not an active member)
        user_id IS NULL 
        AND is_company_owner_or_admin(company_id, auth.uid())
    );

-- Allow users to accept their own invitations (update the record with their user_id)
CREATE POLICY "Users can accept their invitations" ON company_members
    FOR UPDATE USING (
        -- Invitation must be for user's email
        invitation_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND accepted_at IS NULL
        AND invitation_expires_at > NOW()
    );