-- Fix RLS policy to allow users to view invitations sent to their email

-- Add policy allowing users to view invitations sent to their email address
CREATE POLICY "Users can view invitations sent to their email" ON company_members
    FOR SELECT USING (
        -- Check if the invitation_email matches the authenticated user's email
        invitation_email = auth.email()
        AND accepted_at IS NULL  -- Only for pending invitations
    );

-- Also update the accept invitation policy to handle both SELECT and UPDATE
DROP POLICY IF EXISTS "Users can accept their invitations" ON company_members;

CREATE POLICY "Users can accept their invitations" ON company_members
    FOR UPDATE USING (
        -- Invitation must be for user's email
        invitation_email = auth.email()
        AND accepted_at IS NULL
    )
    WITH CHECK (
        -- When accepting, must be setting user_id to their own ID
        user_id = auth.uid() OR user_id IS NULL
    );