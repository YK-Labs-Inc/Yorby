import { getTranslations } from "next-intl/server";
import { getProducts } from "./actions";
import CreditUsageModal from "./components/CreditUsageModal";
import { FormMessage } from "@/components/form-message";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { posthog } from "@/utils/tracking/serverUtils";
import SignUpForm from "./components/SignUpForm";
import { CreditPricingCards } from "./CreditPricingCards";
import { SubscriptionPricingCard } from "./SubscriptionPricingCard";

export default async function PurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const error = (await searchParams).error as string;
  const t = await getTranslations("purchase");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // Get pricing experiment variant
  const isSubscriptionVariant =
    (await posthog.getFeatureFlag("subscription-price-test-1", user.id)) ===
    "test";

  let resumeBuilderEnabled = false;
  if (user) {
    resumeBuilderEnabled =
      (await posthog.isFeatureEnabled("enable-resume-builder", user.id)) ??
      false;
  }

  const { products } = await getProducts(user.id);

  // Filter products based on experiment variant
  const filteredProducts = isSubscriptionVariant
    ? products.filter((product) => product.credits === -1)
    : products.filter((product) => product.credits !== -1);

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              {isSubscriptionVariant ? t("subscriptionTitle") : t("title")}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {isSubscriptionVariant
                ? t("subscriptionDescription")
                : resumeBuilderEnabled
                  ? t("descriptionV3")
                  : t("descriptionV2")}
            </p>
            <div className="flex justify-center">
              {!isSubscriptionVariant && (
                <CreditUsageModal resumeBuilderEnabled={resumeBuilderEnabled} />
              )}
            </div>
          </div>
        </div>

        {error && <FormMessage message={{ error }} />}

        <div className="mt-8 grid gap-8 lg:grid-cols-3 md:grid-cols-2">
          {isSubscriptionVariant ? (
            filteredProducts.map((product) => (
              <SubscriptionPricingCard product={product} />
            ))
          ) : (
            // Control variant: Show credit options
            <CreditPricingCards products={products} />
          )}
        </div>
      </div>
    </div>
  );
}
