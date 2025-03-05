"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { posthog, trackServerEvent } from "@/utils/tracking/serverUtils";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export interface Product extends Omit<Stripe.Product, "description"> {
  description: string;
  prices: Stripe.Price[];
  pricePerCredit?: number;
  savings?: number;
  totalPrice?: number;
  credits?: number;
}

const CREDITS_MAP: { [key: string]: number } = {
  [process.env.SINGLE_CREDIT_PRODUCT_ID!]: 1,
  [process.env.SINGLE_CREDIT_PRODUCT_ID_2!]: 1,
  [process.env.FIVE_CREDITS_PRODUCT_ID!]: 5,
  [process.env.TEN_CREDITS_PRODUCT_ID!]: 10,
  [process.env.UNLIMITED_CREDITS_PRODUCT_ID!]: -1, // -1 represents unlimited
};

export async function getProducts(userId: string) {
  const logger = new Logger().with({
    function: "getProducts",
    userId,
  });
  try {
    const increasedPrice =
      (await posthog.getFeatureFlag("price-test-1", userId)) === "test";

    const stripeProductIds = [
      process.env.SINGLE_CREDIT_PRODUCT_ID!,
      process.env.FIVE_CREDITS_PRODUCT_ID!,
      process.env.TEN_CREDITS_PRODUCT_ID!,
      process.env.UNLIMITED_CREDITS_PRODUCT_ID!,
    ];

    const products = await stripe.products.list({
      active: true,
      ids: stripeProductIds,
    });

    let singleCreditPrice: number | null = null;

    const increasedSingleCreditPriceId =
      process.env.INCRERASED_SINGLE_CREDIT_PRICE_ID!;
    // First pass to get the single credit price
    for (const product of products.data) {
      if (
        product.id === process.env.SINGLE_CREDIT_PRODUCT_ID ||
        product.id === process.env.SINGLE_CREDIT_PRODUCT_ID_2
      ) {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        });
        if (increasedPrice) {
          // If increasedPrice is true, find the price with matching ID
          const increasedPriceData = prices.data.find(
            (price) => price.id === increasedSingleCreditPriceId
          );
          if (increasedPriceData) {
            singleCreditPrice = increasedPriceData.unit_amount! / 100;
          }
        } else {
          // If increasedPrice is false, find the price that doesn't match the increased price ID
          const regularPriceData = prices.data.find(
            (price) => price.id !== increasedSingleCreditPriceId
          );
          if (regularPriceData) {
            singleCreditPrice = regularPriceData.unit_amount! / 100;
          }
        }
        break;
      }
    }
    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        });

        const description = product.description || "";
        const credits = CREDITS_MAP[product.id];

        let selectedPrice;
        // Only apply increased price logic for single credit product
        if (product.id === process.env.SINGLE_CREDIT_PRODUCT_ID) {
          if (increasedPrice) {
            selectedPrice = prices.data.find(
              (price) => price.id === increasedSingleCreditPriceId
            );
          } else {
            selectedPrice = prices.data.find(
              (price) => price.id !== increasedSingleCreditPriceId
            );
          }
        } else {
          // For all other products, use the first available price
          selectedPrice = prices.data[0];
        }

        const price = selectedPrice?.unit_amount! / 100;
        const pricePerCredit = credits > 0 ? price / credits : null;

        let savings = null;
        if (singleCreditPrice && credits > 0) {
          const totalCostAtSinglePrice = singleCreditPrice * credits;
          savings =
            ((totalCostAtSinglePrice - price) / totalCostAtSinglePrice) * 100;
        }

        return {
          ...product,
          description,
          prices: [selectedPrice],
          credits,
          totalPrice: price,
          pricePerCredit: pricePerCredit,
          savings: savings,
        } as Product;
      })
    );

    // Sort products by number of credits (unlimited last)
    const sortedProducts = productsWithPrices.sort((a, b) => {
      if (a.credits === -1) return 1;
      if (b.credits === -1) return -1;
      return (a.credits || 0) - (b.credits || 0);
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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    logger.error("User not found", {
      message: "User not found",
    });
    await logger.flush();
    redirect(`${origin}/purchase?error=${t("errors.login")}`);
  }
  const userId = user.id;
  const email = user.email;
  const metadata: { [key: string]: string } = {
    userId: user.id,
    userEmail: email,
    priceId,
    isSubscription: isSubscription.toString(),
  };
  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    customer_email: email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${origin}/purchase_confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/purchase`,
    metadata,
    allow_promotion_codes: true,
    subscription_data: isSubscription
      ? {
          metadata: {
            userId: user.id,
            userEmail: email,
          },
        }
      : undefined,
  });
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
    },
  });
  redirect(sessionUrl);
}

export const redirectToStripeCustomerPortal = async () => {
  const logger = new Logger();
  logger.with({
    function: "redirectToStripeCustomerPortal",
  });
  const supabase = await createSupabaseServerClient();
  let sessionUrl = "";
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      return_url: `${(await headers()).get("origin")}/dashboard/jobs`,
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
