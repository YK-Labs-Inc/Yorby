"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { posthog, trackServerEvent } from "@/utils/tracking/serverUtils";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { getServerUser } from "@/utils/auth/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export interface Product extends Omit<Stripe.Product, "description"> {
  description: string;
  prices: Stripe.Price[];
  pricePerCredit?: number | null;
  savings?: number | null;
  totalPrice?: number;
  credits?: number;
  months?: number; // Added for subscription products
  increasedPrice?: number | null; // Added for flash sale pricing
  increasedPriceId?: string | null; // Added for flash sale pricing
}

const CREDIT_PRICES = {
  single: {
    priceId: process.env.STRIPE_SINGLE_CREDIT_PRICE_ID!,
    credits: 1,
  },
  five: {
    priceId: process.env.STRIPE_FIVE_CREDITS_PRICE_ID!,
    credits: 5,
  },
  ten: {
    priceId: process.env.STRIPE_TEN_CREDITS_PRICE_ID!,
    credits: 10,
  },
} as const;

const SUBSCRIPTION_PRICES = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    increasedPriceId: process.env.STRIPE_INCREASED_MONTHLY_PRICE_ID!,
    months: 1,
  },
  threeMonth: {
    priceId: process.env.STRIPE_3_MONTH_PRICE_ID!,
    increasedPriceId: process.env.STRIPE_INCREASED_3_MONTH_PRICE_ID!,
    months: 3,
  },
  sixMonth: {
    priceId: process.env.STRIPE_6_MONTH_PRICE_ID!,
    increasedPriceId: process.env.STRIPE_INCREASED_6_MONTH_PRICE_ID!,
    months: 6,
  },
} as const;

export async function getProducts(userId: string) {
  const logger = new Logger().with({
    function: "getProducts",
    userId,
  });

  try {
    const isTestVariant =
      (await posthog.getFeatureFlag("subscription-price-test-1", userId)) ===
      "test";
    const isFlashPricing =
      (await posthog.getFeatureFlag("flash-pricing", userId)) === "test";

    // Determine which price IDs to fetch based on the variant
    const priceIds = isTestVariant
      ? Object.values(SUBSCRIPTION_PRICES).map(({ priceId }) => priceId)
      : Object.values(CREDIT_PRICES).map(({ priceId }) => priceId);

    // If flash pricing is enabled, also fetch the increased prices
    const additionalPriceIds = isFlashPricing
      ? Object.values(SUBSCRIPTION_PRICES).map(
          ({ increasedPriceId }) => increasedPriceId
        )
      : [];

    // Fetch all prices in parallel with expanded product data
    const prices = await Promise.all(
      [...priceIds, ...additionalPriceIds].map((priceId) =>
        stripe.prices.retrieve(priceId, { expand: ["product"] })
      )
    );

    let productsWithPrices: Product[] = [];

    if (isTestVariant) {
      // Get monthly price as base price for calculating savings
      const monthlyPrice = prices.find(
        (p) => p.id === SUBSCRIPTION_PRICES.monthly.priceId
      )!;
      const monthlyAmount = monthlyPrice.unit_amount! / 100;

      // Create subscription products
      productsWithPrices = Object.entries(SUBSCRIPTION_PRICES).map(
        ([key, { months, increasedPriceId }]) => {
          const price = prices.find(
            (p) =>
              p.id ===
              SUBSCRIPTION_PRICES[key as keyof typeof SUBSCRIPTION_PRICES]
                .priceId
          )!;
          const product = price.product as Stripe.Product;
          const totalPrice = price.unit_amount! / 100;

          // If flash pricing is enabled, get the increased price
          let increasedPrice = null;
          if (isFlashPricing) {
            increasedPrice = prices.find((p) => p.id === increasedPriceId)!;
          }

          // Calculate savings compared to paying month-by-month
          let savings = null;
          if (months > 1) {
            const totalCostAtMonthly = monthlyAmount * months;
            savings =
              ((totalCostAtMonthly - totalPrice) / totalCostAtMonthly) * 100;
          }

          return {
            ...product,
            description: product.description || "",
            credits: -1, // Unlimited
            prices: [JSON.parse(JSON.stringify(price))],
            totalPrice,
            pricePerCredit: null,
            savings,
            months,
            increasedPrice: increasedPrice
              ? increasedPrice.unit_amount! / 100
              : null,
            increasedPriceId,
          } as Product;
        }
      );
    } else {
      // Get single credit price as base price for calculating savings
      const singleCreditPrice =
        prices.find((p) => p.id === CREDIT_PRICES.single.priceId)!
          .unit_amount! / 100;

      // Create credit products
      productsWithPrices = Object.entries(CREDIT_PRICES).map(
        ([key, { credits }]) => {
          const price = prices.find(
            (p) =>
              p.id === CREDIT_PRICES[key as keyof typeof CREDIT_PRICES].priceId
          )!;
          const product = price.product as Stripe.Product;
          const totalPrice = price.unit_amount! / 100;

          // Calculate savings compared to buying single credits
          let savings = null;
          if (credits > 1) {
            const totalCostAtSinglePrice = singleCreditPrice * credits;
            savings =
              ((totalCostAtSinglePrice - totalPrice) / totalCostAtSinglePrice) *
              100;
          }

          return {
            ...product,
            description: product.description || "",
            credits,
            prices: [JSON.parse(JSON.stringify(price))],
            totalPrice,
            pricePerCredit: totalPrice / credits,
            savings,
            increasedPriceId: null,
          } as Product;
        }
      );
    }

    // Sort products
    const sortedProducts = productsWithPrices.sort((a, b) => {
      if (isTestVariant) {
        // Sort by subscription duration
        return (a.months || 0) - (b.months || 0);
      } else {
        // Sort by number of credits
        return (a.credits || 0) - (b.credits || 0);
      }
    });

    return { products: sortedProducts };
  } catch (error) {
    logger.error("Error fetching products:", {
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
    await logger.flush();
    throw new Error("Failed to fetch products");
  }
}

export async function createCheckoutSession(formData: FormData) {
  const priceId = formData.get("priceId") as string;
  const isSubscription = (formData.get("isSubscription") as string) === "true";
  const cancelledPurchaseRedirectUrl = formData.get(
    "cancelledPurchaseRedirectUrl"
  ) as string;
  const successfulPurchaseRedirectUrl = formData.get(
    "successfulPurchaseRedirectUrl"
  ) as string;
  const t = await getTranslations("purchase");
  let logger = new Logger().with({
    priceId,
    isSubscription,
  });
  const origin = (await headers()).get("origin");
  if (!priceId) {
    logger.error("Price ID not found");
    await logger.flush();
    redirect(`${origin}/purchase?error=${t("errors.generic")}`);
  }
  const user = await getServerUser();
  if (!user) {
    logger.error("User not found", {
      message: "User not found",
    });
    await logger.flush();
    redirect(`${origin}/purchase?error=${t("errors.login")}`);
  }
  const supabase = await createSupabaseServerClient();
  const userId = user.id;
  const email = user.email;
  const metadata: { [key: string]: string } = {
    userId: user.id,
    priceId,
    isSubscription: isSubscription.toString(),
  };
  if (email) {
    metadata.userEmail = email;
  }
  const checkoutParams: Stripe.Checkout.SessionCreateParams = {
    mode: isSubscription ? "subscription" : "payment",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${origin}${successfulPurchaseRedirectUrl}${
      successfulPurchaseRedirectUrl.includes("?") ? "&" : "?"
    }session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${cancelledPurchaseRedirectUrl}`,
    metadata,
    allow_promotion_codes: true,
    subscription_data: isSubscription
      ? {
          metadata,
        }
      : undefined,
  };
  if (email) {
    checkoutParams.customer_email = email;
  }
  const session = await stripe.checkout.sessions.create(checkoutParams);
  const sessionUrl = session.url;
  if (!sessionUrl) {
    logger.error("Failed to create checkout session");
    await logger.flush();
    redirect(`${origin}/purchase?error=${t("errors.generic")}`);
  }
  await trackServerEvent({
    eventName: "purchase_started",
    userId,
    args: {
      priceId,
      purchaseSource: cancelledPurchaseRedirectUrl ?? "/purchase",
    },
  });
  redirect(sessionUrl);
}

export const redirectToStripeCustomerPortal = async (returnUrl: string) => {
  const logger = new Logger();
  logger.with({
    function: "redirectToStripeCustomerPortal",
  });
  const supabase = await createSupabaseServerClient();
  const origin = (await headers()).get("origin");
  let sessionUrl = "";
  try {
    const user = await getServerUser();
    const userId = user?.id;
    if (!userId) {
      throw new Error("User not found");
    }
    logger.info("Starting function");
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    const stripeCustomerId = subscription?.stripe_customer_id;
    if (!stripeCustomerId) {
      throw new Error("Stripe customer ID not found");
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}${returnUrl}`,
    });
    if (session.url) {
      sessionUrl = session.url;
    }
    logger.info("Completed function");
    await logger.flush();
  } catch (error) {
    logger.error("Error on endpoint", {
      error: error instanceof Error ? error.message : JSON.stringify(error),
      message: "Error creating stripe customer portal session",
    });
    await logger.flush();
    throw error;
  }
  if (sessionUrl) {
    redirect(sessionUrl);
  }
};
