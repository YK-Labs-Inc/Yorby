import JobCreationComponent from "@/app/JobCreationComponent";
import { getServerUser } from "@/utils/auth/server";
import { Tables } from "@/utils/supabase/database.types";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getProducts } from "@/app/purchase/actions";
import { posthog } from "@/utils/tracking/serverUtils";
import { isWithin24Hours } from "@/app/purchase/utils";
import UpgradeCard from "./UpgradeCard";

export const maxDuration = 300;

const fetchJobs = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  const { data, error } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data;
};

const fetchHasSubscription = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data !== null;
};

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

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const errorMessage = (await searchParams).error as string;
  const newJob = (await searchParams).newJob === "true";
  let jobs: Tables<"custom_jobs">[] = [];
  if (!newJob) {
    jobs = await fetchJobs();
  }
  if (jobs.length > 0) {
    redirect(`/dashboard/jobs/${jobs[0].id}?error=${errorMessage}`);
  }

  const user = await getServerUser();
  if (!user) {
    redirect("/sign-in");
  }

  const showOnboarding =
    !user?.app_metadata.completed_interview_prep_onboarding;

  // Check subscription status and job count
  const hasSubscription = await fetchHasSubscription(user.id);
  const jobCount = await fetchJobCount(user.id);
  const FREE_JOB_LIMIT = 5;
  const hasReachedFreeLimit = !hasSubscription && jobCount >= FREE_JOB_LIMIT;

  // If user has reached the free limit and doesn't have a subscription, show upgrade UI
  if (hasReachedFreeLimit) {
    // Fetch products and pricing information
    const { products } = await getProducts(user.id);
    const isFlashPricingEnabled =
      (await posthog.getFeatureFlag("flash-pricing", user.id)) === "test";
    const userSignedUpWithin24Hours = isWithin24Hours(user.created_at);
    const showFlashPricingUI =
      isFlashPricingEnabled && userSignedUpWithin24Hours;
    const monthlyProduct = products.find((p: any) => p.months === 1);
    const baselineMonthlyPrice =
      typeof monthlyProduct?.increasedPrice === "number"
        ? monthlyProduct.increasedPrice
        : monthlyProduct?.totalPrice;

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

  // User has subscription or is under the free limit, show the job creation component
  return (
    <div className="w-full flex justify-center items-center p-8">
      <JobCreationComponent showOnboarding={showOnboarding} />
    </div>
  );
}
