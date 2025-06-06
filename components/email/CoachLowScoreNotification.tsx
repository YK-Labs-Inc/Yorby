import * as React from "react";

export function CoachLowScoreNotification({
  studentName,
  jobTitle,
  questionText,
  score,
  reviewLink,
}: {
  studentName: string;
  jobTitle: string;
  questionText: string;
  score: number;
  reviewLink: string;
}) {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        color: "#222",
        background: "#f9fafb",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>
        ⚠️ Student Needs Attention
      </h1>
      <p style={{ fontSize: 16, marginBottom: 12 }}>
        <strong>{studentName}</strong> received a low score (
        <strong>{score}</strong>) on the following question in{" "}
        <strong>{jobTitle}</strong>:
      </p>
      <blockquote
        style={{
          fontSize: 16,
          margin: "16px 0",
          paddingLeft: 16,
          borderLeft: "4px solid #eab308",
          background: "#fffbe6",
        }}
      >
        {questionText}
      </blockquote>
      <p style={{ fontSize: 16, marginBottom: 12 }}>
        You can review their submission and provide feedback:
      </p>
      <a
        href={reviewLink}
        style={{
          display: "inline-block",
          padding: "10px 20px",
          background: "#2563eb",
          color: "#fff",
          borderRadius: 6,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        Review Submission
      </a>
      <p style={{ fontSize: 14, color: "#6b7280", marginTop: 24 }}>
        This is an automated notification from Perfect Interview.
      </p>
    </div>
  );
}
