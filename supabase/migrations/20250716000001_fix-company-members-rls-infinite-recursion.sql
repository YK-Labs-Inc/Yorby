-- Drop the existing RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Company members can view other members" ON company_members;
DROP POLICY IF EXISTS "Company owners and admins can manage members" ON company_members;

-- Create a function to check if a user is a member of a company
-- This avoids the infinite recursion by using a SECURITY DEFINER function
CREATE OR REPLACE FUNCTION is_company_member(p_company_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM company_members 
        WHERE company_id = p_company_id 
        AND user_id = p_user_id 
        AND accepted_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is an owner or admin of a company
CREATE OR REPLACE FUNCTION is_company_owner_or_admin(p_company_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM company_members 
        WHERE company_id = p_company_id 
        AND user_id = p_user_id 
        AND role IN ('owner', 'admin')
        AND accepted_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the RLS policies using the helper functions
CREATE POLICY "Company members can view other members" ON company_members
    FOR SELECT USING (
        is_company_member(company_id, auth.uid())
    );

CREATE POLICY "Company owners and admins can manage members" ON company_members
    FOR ALL USING (
        is_company_owner_or_admin(company_id, auth.uid())
    );