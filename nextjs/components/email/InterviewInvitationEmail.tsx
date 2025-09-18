import * as React from "react";

interface InterviewInvitationEmailProps {
  candidateName?: string;
  companyName: string;
  jobTitle: string;
  interviewLink: string;
}

export default function InterviewInvitationEmail({
  candidateName,
  companyName,
  jobTitle,
  interviewLink,
}: InterviewInvitationEmailProps) {
  return (
    <div
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
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
          You've been invited to interview with us!
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
          {candidateName ? `Hi ${candidateName},` : "Hi there,"}
        </p>

        <p
          style={{
            fontSize: "16px",
            marginBottom: "24px",
            color: "#4a5568",
          }}
        >
          Thank you for applying for the <strong>{jobTitle}</strong> position at{" "}
          <strong>{companyName}</strong>. Most hiring stops at your resume, but
          we believe you're more than a piece of paper.
        </p>

        <p
          style={{
            fontSize: "16px",
            marginBottom: "24px",
            color: "#4a5568",
          }}
        >
          Take this optional assessment to showcase your experience, skills, and
          personality directly to the hiring team.
        </p>

        {/* Features Card */}
        <div
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "32px",
          }}
        >
          {/* Share Your Real Experience */}
          <div
            style={{
              marginBottom: "16px",
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                minWidth: "24px",
                height: "24px",
                backgroundColor: "#3b82f6",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
                marginTop: "2px",
              }}
            >
              <span style={{ color: "#ffffff", fontSize: "14px" }}>✓</span>
            </div>
            <div>
              <h3
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1e40af",
                }}
              >
                Share Your Real Experience
              </h3>
              <p
                style={{
                  margin: "0",
                  fontSize: "14px",
                  color: "#3730a3",
                }}
              >
                Discuss your work history, projects, and achievements in your
                own words
              </p>
            </div>
          </div>

          {/* Quick & Convenient */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                minWidth: "24px",
                height: "24px",
                backgroundColor: "#3b82f6",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
                marginTop: "2px",
              }}
            >
              <span style={{ color: "#ffffff", fontSize: "14px" }}>🎯</span>
            </div>
            <div>
              <h3
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1e40af",
                }}
              >
                Quick & Convenient
              </h3>
              <p
                style={{
                  margin: "0",
                  fontSize: "14px",
                  color: "#3730a3",
                }}
              >
                Complete in 15-20 minutes, anytime that works for you
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <a
            href={interviewLink}
            style={{
              display: "inline-block",
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              padding: "14px 36px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "16px",
            }}
          >
            Start Interview
          </a>
        </div>

        {/* Alternative Link */}
        <p
          style={{
            fontSize: "14px",
            color: "#718096",
            marginBottom: "8px",
            textAlign: "center",
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
            fontSize: "13px",
            color: "#4a5568",
            marginBottom: "24px",
          }}
        >
          {interviewLink}
        </div>

        {/* Note */}
        <p
          style={{
            fontSize: "13px",
            color: "#718096",
            textAlign: "center",
            marginBottom: "0",
          }}
        >
          You can always come back later to complete the assessment if you
          change your mind.
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: "0",
            fontSize: "12px",
            color: "#718096",
          }}
        >
          This is an optional assessment to help you stand out in your
          application.
        </p>
      </div>
    </div>
  );
}
