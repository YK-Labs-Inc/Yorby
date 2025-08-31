import { getTranslations } from "next-intl/server";
import { getProducts } from "./actions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import SignUpForm from "./components/SignUpForm";
import { posthog } from "@/utils/tracking/serverUtils";
import { isWithin24Hours } from "./utils";
import UpgradeCard from "../dashboard/jobs/UpgradeCard";
import { FREE_JOB_LIMIT } from "./constants";
import { getServerUser } from "@/utils/auth/server";

const fetchJobCount = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("custom_jobs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
  return count || 0;
};

export default async function PurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getServerUser();

  // If no user is found, show the sign-up form
  if (!user) {
    return (
      <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <div className="container max-w-md mx-auto">
          <SignUpForm />
        </div>
      </div>
    );
  }
  const isFlashPricingEnabled =
    (await posthog.getFeatureFlag("flash-pricing", user.id)) === "test";
  const userSignedUpWithin24Hours = isWithin24Hours(user.created_at);
  const showFlashPricingUI = isFlashPricingEnabled && userSignedUpWithin24Hours;
  const { products } = await getProducts(user.id);
  const monthlyProduct = products.find((p: any) => p.months === 1);
  const baselineMonthlyPrice =
    typeof monthlyProduct?.increasedPrice === "number"
      ? monthlyProduct.increasedPrice
      : undefined;

  const jobCount = await fetchJobCount(user.id);

  return (
    <UpgradeCard
      jobCount={jobCount}
      jobLimit={FREE_JOB_LIMIT}
      products={products}
      isFlashPricingEnabled={isFlashPricingEnabled}
      baselineMonthlyPrice={baselineMonthlyPrice}
      showFlashPricingUI={showFlashPricingUI}
      userSignedUpWithin24Hours={userSignedUpWithin24Hours}
      userSignUpTimestamp={user.created_at}
    />
  );
}
