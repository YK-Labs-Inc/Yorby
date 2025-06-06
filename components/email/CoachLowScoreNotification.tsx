import * as React from "react";

export function CoachLowScoreNotification({
  studentName,
  jobTitle,
  questionText,
  score,
  reviewLink,
  pros = [],
  cons = [],
}: {
  studentName: string;
  jobTitle: string;
  questionText: string;
  score: number;
  reviewLink: string;
  pros?: string[];
  cons?: string[];
}) {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        color: "#222",
        background: "#f9fafb",
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
        <span style={{ fontSize: 22, lineHeight: 1 }}>⚠️</span>
        <span>Student Got a Low Correctness Score</span>
      </div>
      <p style={{ fontSize: 15, marginBottom: 10 }}>
        <strong>{studentName}</strong> received a low score (
        <strong>{score}</strong>) on the following question in{" "}
        <strong>{jobTitle}</strong>:
      </p>
      <blockquote
        style={{
          fontSize: 15,
          margin: "14px 0",
          paddingLeft: 12,
          borderLeft: "3px solid #eab308",
          background: "#fefce8",
        }}
      >
        {questionText}
      </blockquote>
      <p style={{ fontSize: 15, marginBottom: 12 }}>
        You can review their submission and provide feedback:
      </p>
      <a
        href={reviewLink}
        style={{
          display: "inline-block",
          padding: "10px 22px",
          background: "#2563eb",
          color: "#fff",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 15,
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#1d4ed8")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
      >
        Review Submission
      </a>
      <p style={{ fontSize: 13, color: "#6b7280", marginTop: 22 }}>
        This is an automated notification from Yorby.
      </p>
      {(pros.length > 0 || cons.length > 0) && (
        <div style={{ margin: "18px 0 10px 0", fontSize: 15 }}>
          {pros.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: "#15803d" }}>Pros:</span>
              <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                {pros.map((pro, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {cons.length > 0 && (
            <div>
              <span style={{ fontWeight: 600, color: "#b91c1c" }}>Cons:</span>
              <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                {cons.map((con, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
