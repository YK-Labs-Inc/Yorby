"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Sparkles,
  Shield,
  Rocket,
  Clock,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { createCheckoutSession, Product } from "@/app/purchase/actions";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface UpgradeCardProps {
  jobCount: number;
  jobLimit: number;
  products: Product[];
  isFlashPricingEnabled: boolean;
  baselineMonthlyPrice?: number;
  showFlashPricingUI: boolean;
  userSignedUpWithin24Hours: boolean;
  userSignUpTimestamp: string;
  hasReachedLimit: boolean;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

export default function UpgradeCard({
  jobCount,
  jobLimit,
  products,
  isFlashPricingEnabled,
  baselineMonthlyPrice,
  showFlashPricingUI,
  userSignedUpWithin24Hours,
  userSignUpTimestamp,
  hasReachedLimit,
}: UpgradeCardProps) {
  const t = useTranslations("purchase.upgradeCard");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!showFlashPricingUI || !userSignUpTimestamp) return;

    const calculateTimeLeft = () => {
      const signUpTime = new Date(userSignUpTimestamp).getTime();
      const endTime = signUpTime + 24 * 60 * 60 * 1000; // 24 hours after signup
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        return t("expired");
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [showFlashPricingUI, userSignUpTimestamp]);
  const [selectedProductIndex, setSelectedProductIndex] = useState(1); // Default to most popular (3-month plan)

  const handleCheckout = async (product: Product) => {
    setIsLoading(true);

    const formData = new FormData();
    // Determine which price to use based on flash pricing
    const priceId = isFlashPricingEnabled
      ? userSignedUpWithin24Hours
        ? product.prices[0].id
        : product.increasedPriceId || product.prices[0].id
      : product.prices[0].id;

    formData.append("priceId", priceId);
    formData.append("isSubscription", "true");
    formData.append("cancelledPurchaseRedirectUrl", "/dashboard/jobs");
    formData.append("successfulPurchaseRedirectUrl", "/purchase_confirmation");

    await createCheckoutSession(formData);
  };

  return (
    <div className="w-full min-h-screen flex justify-center items-start py-8 px-4 sm:px-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-[1000px] mt-8">
        {/* Header */}
        <div className="text-center mb-6">
          {hasReachedLimit && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-medium mb-4">
              <span className="text-base">😅</span>
              <span>{t("reachedLimit")}</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-3">
            {t("upgradeTitle")}
          </h1>

          {/* Upgrade Value Proposition - Redesigned */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Current Status */}
              <div className="text-center">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  {t("currentStatus")}
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {jobCount}
                  </span>
                  <span className="text-lg text-gray-600 dark:text-gray-400">
                    / {jobLimit}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t("jobs")}
                </div>
              </div>

              {/* Visual Separator */}
              <div className="hidden sm:flex items-center justify-center">
                <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
              </div>

              {/* Upgrade Arrow for Mobile */}
              <div className="sm:hidden">
                <svg
                  className="w-6 h-6 text-primary animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>

              {/* Upgrade To */}
              <div className="text-center">
                <div className="text-xs uppercase tracking-wider text-primary/70 mb-1">
                  {t("upgradeFor")}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                  <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {t("unlimited")}
                  </span>
                </div>
                <div className="text-sm text-primary/80 font-medium mt-1">
                  {t("interviewPrep")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="relative border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          {/* Decorative gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

          <CardContent className="relative p-6 sm:p-8 space-y-6">
            {/* Pricing Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {t("choosePlan")}
                </h3>
                {showFlashPricingUI &&
                  timeLeft &&
                  timeLeft !== t("expired") && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="h-3.5 w-3.5 text-orange-500" />
                      <span className="text-orange-600 dark:text-orange-400 font-medium">
                        {t("flashSaleEnds")} {timeLeft}
                      </span>
                    </div>
                  )}
              </div>

              <div className="grid gap-3">
                {products.map((product, idx) => {
                  const isPopular = idx === 1; // 3-month plan is most popular
                  const displayPrice = showFlashPricingUI
                    ? product.totalPrice
                    : product.increasedPrice || product.totalPrice;
                  const savings =
                    product.months && product.months > 1 && baselineMonthlyPrice
                      ? Math.round(
                          100 -
                            (displayPrice! /
                              product.months /
                              baselineMonthlyPrice) *
                              100
                        )
                      : 0;

                  return (
                    <div
                      key={product.prices[0].id}
                      className={`relative rounded-xl transition-all duration-200 ${
                        selectedProductIndex === idx
                          ? isPopular
                            ? "ring-2 ring-primary ring-offset-2 shadow-xl"
                            : "ring-2 ring-primary ring-offset-2 shadow-lg"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => setSelectedProductIndex(idx)}
                    >
                      <div
                        className={`
                        relative p-4 rounded-lg cursor-pointer
                        ${
                          selectedProductIndex === idx
                            ? isPopular
                              ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-2 border-primary"
                              : "bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-2 border-primary"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }
                      `}
                      >
                        {/* Compact Badges */}
                        {isPopular && (
                          <div className="absolute -top-2 right-4">
                            <div className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold rounded-full shadow-md flex items-center gap-0.5">
                              <TrendingUp className="h-2.5 w-2.5" />
                              {t("popular")}
                            </div>
                          </div>
                        )}

                        {savings > 0 && (
                          <div className="absolute -top-2 left-4">
                            <div className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold rounded-full shadow-md">
                              -{savings}%
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* Compact Radio Button */}
                            <div className="relative">
                              <input
                                type="radio"
                                checked={selectedProductIndex === idx}
                                onChange={() => setSelectedProductIndex(idx)}
                                className="sr-only"
                              />
                              <div
                                className={`
                                h-5 w-5 rounded-full border-2 transition-all
                                ${
                                  selectedProductIndex === idx
                                    ? "border-primary bg-primary shadow-md"
                                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                }
                              `}
                              >
                                {selectedProductIndex === idx && (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {product.months === 1
                                    ? t("monthly")
                                    : t("months", { count: product.months })}
                                </span>
                                {product.months === 6 && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] font-semibold rounded-full">
                                    <Rocket className="h-2.5 w-2.5" />
                                    {t("best")}
                                  </span>
                                )}
                              </div>
                              {product.months && product.months > 1 && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {formatPrice(displayPrice! / product.months)}
                                  {t("perMonth")}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            {showFlashPricingUI && product.increasedPrice ? (
                              <div>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                  {formatPrice(product.totalPrice || 0)}
                                </span>
                                <div className="text-xs line-through text-gray-400">
                                  {formatPrice(product.increasedPrice)}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                  {formatPrice(displayPrice || 0)}
                                </span>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {product.months === 1
                                    ? t("perMonthLabel")
                                    : t("total")}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Section */}
            <div className="space-y-4">
              {/* CTA Button */}
              <Button
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-200"
                onClick={() => handleCheckout(products[selectedProductIndex])}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("redirectingCheckout")}
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    {t("continueCheckout")}
                  </>
                )}
              </Button>

              {/* Trust indicators and secondary action */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-green-600" />
                    <span>{t("sslSecured")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>{t("cancelAnytime")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-green-600" />
                    <span>{t("guarantee")}</span>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline-offset-2 hover:underline transition-colors"
                >
                  {t("backToDashboard")}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testimonial */}
        <div className="mt-6 text-center pb-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">{t("testimonialPrefix")}</span>{" "}
            {t("testimonialSuffix")}
          </p>
        </div>
      </div>
    </div>
  );
}
