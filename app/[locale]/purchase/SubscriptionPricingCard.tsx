"use client";

import { useTranslations } from "next-intl";
import { createCheckoutSession, Product } from "./actions";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { isWithin24Hours } from "./utils";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

const formatTimeRemaining = (endTime: Date) => {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();

  if (diff <= 0) return "00:00:00";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

declare global {
  interface Window {
    fbq: any;
  }
}

export const SubscriptionPricingCard = ({
  product,
  highlight = false,
  badge,
  cancelledPurchaseRedirectUrl,
  isFlashPricingEnabled,
  baselineMonthlyPrice,
  showFlashPricingUI,
  userSignedUpWithin24Hours,
  userSignUpTimestamp,
}: {
  product: Product;
  highlight?: boolean;
  badge?: string;
  cancelledPurchaseRedirectUrl?: string;
  isFlashPricingEnabled: boolean;
  baselineMonthlyPrice: number | undefined;
  showFlashPricingUI: boolean;
  userSignedUpWithin24Hours: boolean;
  userSignUpTimestamp: string;
}) => {
  const isPopular = highlight || product.months === 3;
  const t = useTranslations("purchase");
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [signupTime, setSignupTime] = useState<Date | null>(null);

  useEffect(() => {
    if (isFlashPricingEnabled && userSignUpTimestamp) {
      const signupDate = new Date(userSignUpTimestamp);
      const endTime = new Date(signupDate.getTime() + 24 * 60 * 60 * 1000);
      setSignupTime(endTime);
    }
  }, [isFlashPricingEnabled, userSignUpTimestamp]);

  useEffect(() => {
    if (!signupTime) return;

    const updateTimer = () => {
      setTimeRemaining(formatTimeRemaining(signupTime));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [signupTime]);

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

  const calculateDiscount = () => {
    if (!product.increasedPrice) return null;
    const discount =
      ((product.increasedPrice - product.totalPrice!) /
        product.increasedPrice) *
      100;
    return Math.round(discount);
  };

  // Determine which price to show and which price ID to use
  const displayPrice = showFlashPricingUI
    ? product.totalPrice
    : product.increasedPrice || product.totalPrice;
  const priceId = isFlashPricingEnabled
    ? userSignedUpWithin24Hours
      ? product.prices[0].id
      : product.increasedPriceId || product.prices[0].id
    : product.prices[0].id;

  // Only show savings for multi-month plans
  const showSavings = (product.months || 0) > 1 && baselineMonthlyPrice;
  const savingsPercent = showSavings
    ? Math.round(
        ((baselineMonthlyPrice! * (product.months || 1) - displayPrice!) /
          (baselineMonthlyPrice! * (product.months || 1))) *
          100
      )
    : null;

  return (
    <div
      key={product.totalPrice}
      className={`relative flex flex-col rounded-2xl ${
        isPopular
          ? "border-4 border-indigo-600 dark:border-indigo-400 shadow-2xl scale-105 z-10"
          : "border border-gray-200 dark:border-gray-700"
      } bg-white dark:bg-gray-800 p-8 shadow-sm transition-all duration-200`}
    >
      {(badge || isPopular) && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 dark:bg-indigo-500 px-4 py-1 text-sm font-semibold text-white shadow-lg">
          {badge || t("cta.mostPopular")}
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {product.months === 1
            ? t("subscriptionCard.monthly")
            : t("subscriptionCard.nMonths", { count: product.months })}
        </h3>
      </div>

      <div className="mb-4">
        <div className="flex flex-col items-start text-gray-900 dark:text-white">
          <div className="flex items-baseline">
            {showFlashPricingUI && product.increasedPrice ? (
              <>
                <span className="text-4xl font-bold tracking-tight">
                  {formatPrice(product.totalPrice || 0)}
                </span>
                <span className="ml-2 text-lg line-through text-gray-500">
                  {formatPrice(product.increasedPrice)}
                </span>
              </>
            ) : (
              <span className="text-4xl font-bold tracking-tight">
                {formatPrice(displayPrice || 0)}
              </span>
            )}
          </div>
          <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {product.months === 1
              ? t("subscriptionCard.monthlySubscription")
              : t("subscriptionCard.nMonthSubscription", {
                  count: product.months,
                })}
          </span>
        </div>
        {/* Only show per month price and percent saved for multi-month subscriptions */}
        {(product.months || 0) > 1 && baselineMonthlyPrice && (
          <>
            <p className="mt-1 text-sm font-bold text-green-600 dark:text-green-400">
              {formatPrice(displayPrice! / (product.months || 1))}{" "}
              {t("subscriptionCard.perMonth")}
            </p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              {t("subscriptionCard.savePercentPerMonth", {
                percent: Math.round(
                  100 -
                    (displayPrice! /
                      (product.months || 1) /
                      baselineMonthlyPrice) *
                      100
                ),
              })}
            </p>
          </>
        )}
        {/* Only show discount lines for monthly plan */}
        {product.months === 1 && (
          <>
            {showSavings && savingsPercent && savingsPercent > 0 && (
              <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
                {t("subscriptionCard.savePercent", {
                  percent: savingsPercent,
                })}
              </p>
            )}
            {showFlashPricingUI && product.increasedPrice && (
              <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
                {t("subscriptionCard.savePercentFor24Hours", {
                  percent: calculateDiscount(),
                })}
              </p>
            )}
          </>
        )}
      </div>

      {showFlashPricingUI && timeRemaining && (
        <div className="mb-4 flex flex-col items-center">
          <div className="w-full flex justify-center">
            <span className="font-mono text-base font-bold text-red-600 flex gap-x-4 whitespace-nowrap">
              {t("subscriptionCard.timeRemaining")}
              <span className="whitespace-nowrap">{timeRemaining}</span>
            </span>
          </div>
          {/* Flash Sale badge inside the card, under the timer */}
          <div className="mt-2 mb-2 rounded-full bg-red-600 dark:bg-red-500 px-4 py-1 text-sm font-semibold text-white shadow-lg animate-jiggle">
            {t("subscriptionCard.flashSale")}
          </div>
        </div>
      )}

      <div className="mb-8 flex-1">
        <ul className="flex flex-col gap-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 px-4 list-disc list-inside">
          {(
            t.raw("products.unlimited.highlights") as string[] | undefined
          )?.map((highlight, idx) => (
            <li
              key={idx}
              className="text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              {highlight}
            </li>
          ))}
        </ul>
      </div>

      <form action={handleSubmit}>
        {cancelledPurchaseRedirectUrl && (
          <input
            type="hidden"
            name="cancelledPurchaseRedirectUrl"
            value={cancelledPurchaseRedirectUrl}
          />
        )}
        <input type="hidden" name="priceId" value={priceId} />
        <input type="hidden" name="isSubscription" value="true" />
        <input
          type="hidden"
          name="cancelledPurchaseRedirectUrl"
          value={cancelledPurchaseRedirectUrl || "purchase"}
        />
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
