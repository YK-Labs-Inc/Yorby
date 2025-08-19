import * as React from "react";

interface CompanyInvitationTemplateProps {
  companyName: string;
  inviterName?: string;
  role: string;
  invitationLink: string;
  expiresIn?: string;
}

export function CompanyInvitationTemplate({
  companyName,
  inviterName,
  role,
  invitationLink,
  expiresIn = "7 days",
}: CompanyInvitationTemplateProps) {
  const getRoleDescription = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator - Manage company settings, members, and job postings";
      case "recruiter":
        return "Recruiter - Create and manage job postings and review candidates";
      case "viewer":
        return "Viewer - View job postings and candidate information";
      default:
        return role;
    }
  };

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        lineHeight: "1.6",
        color: "#333",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          borderRadius: "8px 8px 0 0",
          padding: "32px 24px",
          textAlign: "center",
          borderBottom: "3px solid #3b82f6",
        }}
      >
        <h1
          style={{
            margin: "0",
            fontSize: "28px",
            fontWeight: "600",
            color: "#1a202c",
          }}
        >
          You're Invited to Join {companyName}
        </h1>
      </div>

      {/* Body */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "32px 24px",
          borderLeft: "1px solid #e2e8f0",
          borderRight: "1px solid #e2e8f0",
          borderBottom: "1px solid #e2e8f0",
          borderRadius: "0 0 8px 8px",
        }}
      >
        <p
          style={{
            fontSize: "16px",
            marginBottom: "24px",
            color: "#4a5568",
          }}
        >
          {inviterName
            ? `${inviterName} has invited you`
            : "You've been invited"}{" "}
          to join <strong>{companyName}</strong> as a team member.
        </p>

        {/* Role Card */}
        <div
          style={{
            backgroundColor: "#f7fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              margin: "0 0 8px 0",
              fontSize: "14px",
              color: "#718096",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Your Role
          </p>
          <p
            style={{
              margin: "0 0 8px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "#2d3748",
            }}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </p>
          <p
            style={{
              margin: "0",
              fontSize: "14px",
              color: "#4a5568",
            }}
          >
            {getRoleDescription(role)}
          </p>
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <a
            href={invitationLink}
            style={{
              display: "inline-block",
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              padding: "12px 32px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "16px",
            }}
          >
            Accept Invitation
          </a>
        </div>

        {/* Alternative Link */}
        <p
          style={{
            fontSize: "14px",
            color: "#718096",
            marginBottom: "16px",
          }}
        >
          Or copy and paste this link into your browser:
        </p>
        <div
          style={{
            backgroundColor: "#f7fafc",
            padding: "12px",
            borderRadius: "4px",
            wordBreak: "break-all",
            fontSize: "14px",
            color: "#4a5568",
            marginBottom: "24px",
          }}
        >
          {invitationLink}
        </div>

        {/* Expiration Notice */}
        <div
          style={{
            backgroundColor: "#fef5e7",
            border: "1px solid #f9c74f",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              margin: "0",
              fontSize: "14px",
              color: "#92400e",
            }}
          >
            ⏰ <strong>Note:</strong> This invitation will expire in{" "}
            {expiresIn}. Please accept it before it expires.
          </p>
        </div>

        {/* Next Steps */}
        <div style={{ marginBottom: "24px" }}>
          <p
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "12px",
              color: "#2d3748",
            }}
          >
            What happens next?
          </p>
          <ol
            style={{
              margin: "0",
              paddingLeft: "20px",
              color: "#4a5568",
              fontSize: "14px",
            }}
          >
            <li style={{ marginBottom: "8px" }}>
              Click the invitation link above
            </li>
            <li style={{ marginBottom: "8px" }}>
              Create your account or sign in if you already have one
            </li>
            <li style={{ marginBottom: "8px" }}>
              You'll automatically be added to {companyName}
            </li>
            <li>Start collaborating with your team!</li>
          </ol>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #e2e8f0",
            paddingTop: "24px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0",
              fontSize: "14px",
              color: "#718096",
            }}
          >
            If you didn't expect this invitation, you can safely ignore this
            email.
          </p>
        </div>
      </div>
    </div>
  );
}