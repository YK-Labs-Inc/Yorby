export const generateReferralLink = (code: string) => {
  if (!code) return null;
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://perfectinterview.com";
  return `${baseUrl}?ref=${encodeURIComponent(code)}`;
};

export const getReferralCodeFromUrl = () => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("ref");
};

export const setReferralCookie = (code: string) => {
  if (typeof window === "undefined") return;
  const expires = new Date();
  expires.setDate(expires.getDate() + 30); // 30 days expiration
  document.cookie = `referral_code=${code}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
};

export const getReferralCookie = () => {
  if (typeof window === "undefined") return null;
  const cookies = document.cookie.split(";");
  const referralCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("referral_code=")
  );
  return referralCookie ? referralCookie.split("=")[1] : null;
};
