import { getTranslations } from "next-intl/server";
import { getProducts } from "./actions";
import { FormMessage } from "@/components/form-message";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import SignUpForm from "./components/SignUpForm";
import { SubscriptionPricingCard } from "./SubscriptionPricingCard";
import TrustBadges from "./components/TrustBadges";
import ProductVideoCarousel from "./components/ProductVideoCarousel";
import Testimonials from "./components/Testimonials";
import FAQSection from "./components/FAQSection";
import { posthog } from "@/utils/tracking/serverUtils";
import { isWithin24Hours } from "./utils";

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
          {showFlashPricingUI && (
            <div className="mb-6">
              <div className="inline-block bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-2 rounded-full text-sm font-semibold">
                {t("flashSale.limitedTimeOffer")}
              </div>
            </div>
          )}
          <TrustBadges />
        </div>

        {/* Pricing Cards */}
        <div className="mt-12">
          {error && <FormMessage message={{ error }} />}
          <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2">
            {products.map((product: any, idx: number) => (
              <SubscriptionPricingCard
                key={product.prices[0]?.id}
                product={JSON.parse(JSON.stringify(product))}
                highlight={idx === 1}
                badge={idx === 1 ? t("mostPopularBadge") : undefined}
                isFlashPricingEnabled={isFlashPricingEnabled}
                baselineMonthlyPrice={baselineMonthlyPrice}
                showFlashPricingUI={showFlashPricingUI}
                userSignedUpWithin24Hours={userSignedUpWithin24Hours}
                userSignUpTimestamp={user.created_at}
              />
            ))}
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
