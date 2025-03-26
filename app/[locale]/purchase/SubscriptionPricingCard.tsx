"use client";

import { useTranslations } from "next-intl";
import { createCheckoutSession, Product } from "./actions";

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

export const SubscriptionPricingCard = ({ product }: { product: Product }) => {
  const isPopular = product.months === 3;
  const monthlyPrice = product.totalPrice! / (product.months || 1);
  const t = useTranslations("purchase");

  const handleSubmit = async (data: FormData) => {
    // Track InitiateCheckout event
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "InitiateCheckout", {
        currency: "USD",
        value: product.totalPrice || 0,
        num_items: product.months || 1,
      });
    }

    // Create form data and submit
    await createCheckoutSession(data);
  };

  return (
    <div
      key={product.totalPrice}
      className={`relative flex flex-col rounded-2xl ${
        isPopular
          ? "border-2 border-indigo-600 dark:border-indigo-400"
          : "border border-gray-200 dark:border-gray-700"
      } bg-white dark:bg-gray-800 p-8 shadow-sm`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 dark:bg-indigo-500 px-4 py-1 text-sm font-semibold text-white">
          {t("cta.mostPopular")}
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {product.months === 1 ? "Monthly" : `${product.months} Months`}{" "}
        </h3>
      </div>

      <div className="mb-8">
        <div className="flex flex-col items-start text-gray-900 dark:text-white">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold tracking-tight">
              {formatPrice(product.totalPrice || 0)}
            </span>
          </div>
          <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {product.months === 1
              ? "Monthly subscription"
              : `${product.months}-month subscription`}
          </span>
        </div>
        {/* Only show per month price for multi-month subscriptions */}
        {(product.months || 0) > 1 && (
          <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
            {formatPrice(monthlyPrice)} per month
          </p>
        )}
        {product.savings && product.savings > 0 && (
          <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
            Save {Math.round(product.savings)}%
          </p>
        )}
      </div>

      <div className="mb-8 flex-1">
        <div className="flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700/50 px-4 py-3">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t(`products.unlimited.highlight`)}
          </span>
        </div>
      </div>

      <form action={handleSubmit}>
        <input type="hidden" name="priceId" value={product.prices[0].id} />
        <input type="hidden" name="isSubscription" value="true" />
        <button
          type="submit"
          className={`mt-8 block w-full rounded-md px-3 py-3 text-center text-sm font-semibold text-white ${
            isPopular
              ? "bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              : "bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
          }`}
        >
          {t("cta.select")}
        </button>
      </form>
    </div>
  );
};
