import { getTranslations } from "next-intl/server";
import { getProducts } from "./actions";
import CreditUsageModal from "./components/CreditUsageModal";
import { FormMessage } from "@/components/form-message";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { posthog } from "@/utils/tracking/serverUtils";
import SignUpForm from "./components/SignUpForm";
import { CreditPricingCards } from "./CreditPricingCards";
import { SubscriptionPricingCard } from "./SubscriptionPricingCard";
import TrustBadges from "./components/TrustBadges";
import CountdownTimer from "./components/CountdownTimer";
import ProductVideoCarousel from "./components/ProductVideoCarousel";
import Testimonials from "./components/Testimonials";
import FAQSection from "./components/FAQSection";

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

  // Sanitize products for client components
  const plainProducts = JSON.parse(JSON.stringify(products));

  // Filter products based on experiment variant
  const filteredProducts = isSubscriptionVariant
    ? plainProducts.filter((product: any) => product.credits === -1)
    : plainProducts.filter((product: any) => product.credits !== -1);

  // Deduplicate by price id (first price in product.prices)
  const uniqueProducts = Array.from(
    new Map(filteredProducts.map((p: any) => [p.prices[0]?.id, p])).values()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 py-8 px-2">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-10 mt-8">
          <h1 className="text-5xl font-extrabold text-primary mb-4">
            {t("hero.title")}
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
            {t("hero.subtitle")}
          </p>
          <TrustBadges />
          {/* <CountdownTimer /> */}
        </div>

        {/* Pricing Cards */}
        <div className="mt-12">
          {error && <FormMessage message={{ error }} />}
          <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2">
            {isSubscriptionVariant ? (
              uniqueProducts.map((product: any, idx: number) => (
                <SubscriptionPricingCard
                  key={product.prices[0]?.id}
                  product={product}
                  highlight={idx === 1}
                  badge={idx === 1 ? t("mostPopularBadge") : undefined}
                />
              ))
            ) : (
              // Control variant: Show credit options
              <CreditPricingCards products={plainProducts} />
            )}
          </div>
        </div>

        {/* Product Visuals */}
        <ProductVideoCarousel />

        {/* Testimonials */}
        <Testimonials />

        {/* FAQ */}
        <FAQSection />
      </div>
    </div>
  );
}
