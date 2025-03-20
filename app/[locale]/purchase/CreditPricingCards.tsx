"use client";

import { useTranslations } from "next-intl";
import { createCheckoutSession, Product } from "./actions";
// import { formatPrice } from "./page";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

declare global {
  interface Window {
    fbq: any;
  }
}

const PRICE_KEYS = {
  [process.env.SINGLE_CREDIT_PRICE_ID!]: "oneCredit",
  [process.env.FIVE_CREDITS_PRICE_ID!]: "fiveCredits",
  [process.env.TEN_CREDITS_PRICE_ID!]: "tenCredits",
  [process.env.UNLIMITED_CREDITS_PRICE_ID!]: "unlimited",
} as const;

export const CreditPricingCards = ({ products }: { products: Product[] }) => {
  const t = useTranslations("purchase");

  const handleSubmit = async (data: FormData, product: Product) => {
    // Track InitiateCheckout event
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "InitiateCheckout", {
        currency: "USD",
        value: product.totalPrice || 0,
        content_ids: [product.prices[0].id],
        num_items: product.credits || 1,
      });
    }

    // Create form data and submit
    await createCheckoutSession(data);
  };

  return (
    <>
      {products.map((product, index) => {
        // Find the first price ID that matches a key in PRICE_KEYS
        const priceId = product.prices.find((price) =>
          Object.keys(PRICE_KEYS).includes(price.id)
        )?.id;

        // Use the matching price ID or fallback based on credits
        let productKey: string;
        if (priceId && priceId in PRICE_KEYS) {
          productKey = PRICE_KEYS[priceId as keyof typeof PRICE_KEYS];
        } else {
          // Fallback based on credits
          if (product.credits === 1) {
            productKey = "oneCredit";
          } else if (product.credits === 5) {
            productKey = "fiveCredits";
          } else if (product.credits === 10) {
            productKey = "tenCredits";
          } else if (product.credits === -1) {
            productKey = "unlimited";
          } else {
            productKey = "oneCredit"; // Default fallback
          }
        }

        const isUnlimited = product.credits === -1;
        return (
          <div
            key={index}
            className={`relative flex flex-col rounded-2xl ${
              product.credits === 10
                ? "border-2 border-indigo-600 dark:border-indigo-400"
                : "border border-gray-200 dark:border-gray-700"
            } bg-white dark:bg-gray-800 p-8 shadow-sm`}
          >
            {product.credits === 10 && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 dark:bg-indigo-500 px-4 py-1 text-sm font-semibold text-white">
                {t("cta.mostPopular")}
              </div>
            )}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t(`products.${productKey}.titleV2`)}
              </h3>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                {t(`products.${productKey}.description`)}
              </p>
            </div>

            <div className="mb-8">
              <div className="flex flex-col items-start text-gray-900 dark:text-white">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold tracking-tight">
                    {formatPrice(product.totalPrice || 0)}
                  </span>
                </div>
                <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {isUnlimited
                    ? t("pricing.quarterlySubscription")
                    : t("pricing.oneTime")}
                </span>
              </div>
              {!isUnlimited && product.credits !== 1 && (
                <>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {formatPrice(product.pricePerCredit || 0)}{" "}
                    {t("pricing.perInterview")}
                  </p>
                  {product.savings && product.savings > 0 && (
                    <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
                      {t("pricing.savingsV2", {
                        savings: Math.round(product.savings),
                      })}
                    </p>
                  )}
                </>
              )}
              {isUnlimited && (
                <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
                  {formatPrice((product.totalPrice || 0) / 3)}{" "}
                  {t("pricing.perMonth")}
                </p>
              )}
            </div>

            <div className="mb-8 flex-1">
              <div className="flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700/50 px-4 py-3">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t(`products.${productKey}.highlight`)}
                </span>
              </div>
            </div>

            <form action={(data) => handleSubmit(data, product)}>
              <input
                type="hidden"
                name="priceId"
                value={product.prices[0].id}
              />
              <input
                type="hidden"
                name="isSubscription"
                value={product.credits === -1 ? "true" : "false"}
              />
              <button
                type="submit"
                className={`mt-8 block w-full rounded-md px-3 py-3 text-center text-sm font-semibold text-white ${
                  product.credits === 10
                    ? "bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    : "bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
                }`}
              >
                {t("cta.select")}
              </button>
            </form>
          </div>
        );
      })}
    </>
  );
};
