import OnboardingV2 from "./OnboardingV2";
import { getProducts } from "@/app/[locale]/purchase/actions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { posthog } from "@/utils/tracking/serverUtils";
import { redirect } from "next/navigation";
import { isWithin24Hours } from "@/app/[locale]/purchase/utils";

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
