import * as React from "react";

export default function SuccessfulRewardRedemption() {
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
        🎉 You Earned a Free Month!
      </h1>
      <p style={{ fontSize: 16, marginBottom: 12 }}>
        Congratulations! You have successfully redeemed a free month of Perfect
        Interview for referring friends to our platform.
      </p>
      <p style={{ fontSize: 16, marginBottom: 12 }}>
        Thank you for sharing Perfect Interview with your network. For every 3
        successful referrals, you get 1 month free—keep spreading the word to
        earn even more rewards!
      </p>
      <p style={{ fontSize: 14, color: "#6b7280" }}>
        We appreciate your support and hope you enjoy your free month!
      </p>
    </div>
  );
}
