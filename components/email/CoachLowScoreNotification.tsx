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
          borderLeft: "3px solid #111",
          background: "#f3f4f6",
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
        Review Submission
      </a>
      <p style={{ fontSize: 13, color: "#6b7280", marginTop: 22 }}>
        This is an automated notification from Yorby.
      </p>
      {(pros.length > 0 || cons.length > 0) && (
        <div style={{ margin: "18px 0 10px 0", fontSize: 15 }}>
          {pros.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: "#111" }}>Pros:</span>
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
              <span style={{ fontWeight: 600, color: "#111" }}>Cons:</span>
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
