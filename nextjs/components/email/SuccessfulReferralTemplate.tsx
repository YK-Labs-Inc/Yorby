import * as React from "react";

export function SuccessfulReferralTemplate() {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        color: "#222",
        background: "#f9fafb",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>🎉 Congratulations!</h1>
      <p style={{ fontSize: 16, marginBottom: 12 }}>
        You have successfully referred someone to{" "}
        <strong>Perfect Interview</strong>.
      </p>
      <p style={{ fontSize: 16, marginBottom: 12 }}>
        Keep referring friends and colleagues to earn more rewards and extend
        your free months! Remember, for every 3 referrals, you get 1 month free.
      </p>
      <p style={{ fontSize: 14, color: "#6b7280" }}>
        Thank you for helping others discover Perfect Interview.
      </p>
    </div>
  );
}
