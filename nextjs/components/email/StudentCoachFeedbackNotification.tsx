import * as React from "react";

export function StudentCoachFeedbackNotification({
  coachName,
  jobTitle,
  questionText,
  pros,
  cons,
  reviewLink,
}: {
  coachName: string;
  jobTitle: string;
  questionText: string;
  pros: string[];
  cons: string[];
  reviewLink: string;
}) {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        color: "#111",
        background: "#fff",
        padding: 24,
        borderRadius: 12,
        maxWidth: 520,
        margin: "0 auto",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 500,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>You Received Coach Feedback!</span>
      </div>
      <p style={{ fontSize: 15, marginBottom: 10 }}>
        <strong>{coachName}</strong> has provided feedback on your answer for{" "}
        <strong>{jobTitle}</strong>:
      </p>
      <blockquote
        style={{
          fontSize: 15,
          margin: "14px 0",
          paddingLeft: 12,
          borderLeft: "3px solid #111",
          background: "#f3f4f6",
        }}
      >
        {questionText}
      </blockquote>
      <a
        href={reviewLink}
        style={{
          display: "inline-block",
          padding: "10px 22px",
          background: "#111",
          color: "#fff",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 15,
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#222")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#111")}
      >
        View Feedback
      </a>
      <p style={{ fontSize: 13, color: "#6b7280", marginTop: 22 }}>
        This is an automated notification from Yorby.
      </p>
      <div style={{ margin: "18px 0 10px 0", fontSize: 15 }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontWeight: 600, color: "#111" }}>Strengths:</span>
          <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
            {pros.length > 0 ? (
              pros.map((pro, i) => (
                <li key={i} style={{ marginBottom: 2 }}>
                  {pro}
                </li>
              ))
            ) : (
              <li style={{ marginBottom: 2 }}>None provided</li>
            )}
          </ul>
        </div>
        <div>
          <span style={{ fontWeight: 600, color: "#111" }}>
            Areas for Improvement:
          </span>
          <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
            {cons.length > 0 ? (
              cons.map((con, i) => (
                <li key={i} style={{ marginBottom: 2 }}>
                  {con}
                </li>
              ))
            ) : (
              <li style={{ marginBottom: 2 }}>None provided</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
