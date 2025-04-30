"use server";

import { cookies } from "next/headers";

export async function setReferralCode(referralCode: string) {
  const cookieStore = await cookies();
  cookieStore.set("perfect_interview_referral_code", referralCode, {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
    sameSite: "lax",
  });
}
