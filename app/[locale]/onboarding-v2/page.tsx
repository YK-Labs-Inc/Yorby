import OnboardingV2 from "./OnboardingV2";
import { getProducts } from "@/app/[locale]/purchase/actions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { posthog } from "@/utils/tracking/serverUtils";
import { redirect } from "next/navigation";
import { isWithin24Hours } from "@/app/[locale]/purchase/utils";
import { cookies } from "next/headers";
import { Logger } from "next-axiom";
import { User } from "@supabase/supabase-js";

async function handleReferralCode(user: User, referralCode: string) {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    page: "OnboardingV2Page",
    action: "handleReferralCode",
    userId: user.id,
    referralCode,
  });
  try {
    // Check if referral already exists
    const { data: existingReferral, error: checkError } = await supabase
      .from("referrals")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (checkError) {
      logger.error("Error checking existing referral:", { error: checkError });
      await logger.flush();
      return;
    }

    if (existingReferral) {
      logger.info("Referral already exists for user");
      await logger.flush();
      return;
    }

    const { error } = await supabase.from("referrals").insert({
      id: user.id,
      referral_code_id: referralCode,
    });

    if (error) {
      logger.error("Error inserting referral:", { error });
      await logger.flush();
      return;
    }

    logger.info("Successfully recorded referral");
  } catch (error) {
    logger.error("Unexpected error handling referral:", { error });
  } finally {
    await logger.flush();
  }
}

export default async function OnboardingV2Page() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const isFlashPricingEnabled =
    (await posthog.getFeatureFlag("flash-pricing", user.id)) === "test";
  const userSignedUpWithin24Hours = isWithin24Hours(user.created_at);
  const showFlashPricingUI = isFlashPricingEnabled && userSignedUpWithin24Hours;
  const { products } = await getProducts(user.id);
  const cookiesStore = await cookies();
  const referralCode = cookiesStore.get("perfect_interview_referral_code") as {
    name: string;
    value: string;
  } | null;

  // Handle referral code if present
  if (referralCode?.value) {
    await handleReferralCode(user, referralCode.value);
  }

  return (
    <OnboardingV2
      products={JSON.parse(JSON.stringify(products))}
      isFlashPricingEnabled={isFlashPricingEnabled}
      showFlashPricingUI={showFlashPricingUI}
      userSignedUpWithin24Hours={userSignedUpWithin24Hours}
      userSignUpTimestamp={user.created_at}
    />
  );
}
