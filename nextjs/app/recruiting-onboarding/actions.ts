"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export interface RecruitingProduct {
  id: string;
  name: string;
  description: string;
  price: number | null;
  priceId: string | null;
  currency: string;
  interval: string | null;
  features: string[];
}

export async function getRecruitingProducts() {
  const logger = new Logger().with({
    function: "getRecruitingProducts",
  });

  try {
    const t = await getTranslations(
      "onboarding.recruitingOnboarding.steps.pricing"
    );
    const tErrors = await getTranslations(
      "onboarding.recruitingOnboarding.errors"
    );
    const recruitingPriceId =
      process.env.STRIPE_RECRUITING_SUBSCRIPTION_PRICE_ID;

    if (!recruitingPriceId) {
      logger.error("Recruiting subscription price ID not configured");
      await logger.flush();
      throw new Error(tErrors("subscriptionNotConfigured"));
    }

    // Fetch the paid tier price with expanded product data
    const paidPrice = await stripe.prices.retrieve(recruitingPriceId, {
      expand: ["product"],
    });

    const paidProduct = paidPrice.product as Stripe.Product;

    // Get localized feature arrays
    const freeFeatures = (t.raw("freeTier.features") as string[]) || [];
    const professionalFeatures =
      (t.raw("professionalTier.features") as string[]) || [];

    // Create product objects for free and paid tiers
    const products: RecruitingProduct[] = [
      {
        id: "free-tier",
        name: t("freeTier.name"),
        description: t("freeTier.description"),
        price: 0,
        priceId: null,
        currency: "usd",
        interval: null,
        features: freeFeatures,
      },
      {
        id: paidProduct.id,
        name: t("professionalTier.name"),
        description:
          paidProduct.description || t("professionalTier.description"),
        price: paidPrice.unit_amount ? paidPrice.unit_amount / 100 : null,
        priceId: paidPrice.id,
        currency: paidPrice.currency,
        interval: paidPrice.recurring?.interval || null,
        features: professionalFeatures,
      },
    ];

    return { products };
  } catch (error) {
    const tErrors = await getTranslations(
      "onboarding.recruitingOnboarding.errors"
    );
    logger.error("Error fetching recruiting products:", {
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
    await logger.flush();
    throw new Error(tErrors("failedToFetchProducts"));
  }
}

export const handleStartFreePlan = async (
  _prevState: { error: string },
  formData: FormData
) => {
  const logger = new Logger().with({
    function: "handleStartFreePlan",
  });
  try {
    await markOnboardingComplete();
  } catch (error) {
    const tErrors = await getTranslations(
      "onboarding.recruitingOnboarding.errors"
    );
    logger.error("Error marking onboarding complete:", {
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
    await logger.flush();
    return { error: tErrors("genericError") };
  } finally {
    await logger.flush();
    redirect("/recruiting");
  }
};

export async function markOnboardingComplete() {
  const logger = new Logger().with({
    function: "markOnboardingComplete",
  });

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.error("User not found");
      await logger.flush();
      return { error: "User not found" };
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        completed_onboarding_funnel: true,
      },
    });

    if (error) {
      logger.error("Failed to update user metadata", {
        error: error.message,
      });
      await logger.flush();
      return { error: error.message };
    }

    logger.info("Successfully marked onboarding as complete", {
      userId: user.id,
    });
    await logger.flush();
    return { success: true };
  } catch (error) {
    logger.error("Error marking onboarding complete:", {
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
    await logger.flush();
    return { error: "Failed to update onboarding status" };
  }
}

export async function createRecruitingCheckoutSession(
  _prevState: { error: string },
  formData: FormData
) {
  const priceId = formData.get("priceId") as string;
  const companyName = formData.get("companyName") as string;
  const teamSize = formData.get("teamSize") as string;
  const hiringVolume = formData.get("hiringVolume") as string;
  let stripeCheckoutUrl = "";

  const tErrors = await getTranslations(
    "onboarding.recruitingOnboarding.errors"
  );

  let logger = new Logger().with({
    function: "createRecruitingCheckoutSession",
    priceId,
    companyName,
    teamSize,
    hiringVolume,
  });

  const origin = (await headers()).get("origin");

  if (!priceId) {
    logger.error("Price ID not found");
    await logger.flush();
    return { error: tErrors("genericError") };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logger.error("User not found");
    await logger.flush();
    return { error: tErrors("signInRequired") };
  }

  // Mark onboarding as complete when starting checkout
  await markOnboardingComplete();

  const userId = user.id;
  const email = user.email;

  const metadata: { [key: string]: string } = {
    userId,
    priceId,
    isRecruiting: "true",
    companyName: companyName || "",
    teamSize: teamSize || "",
    hiringVolume: hiringVolume || "",
  };

  if (email) {
    metadata.userEmail = email;
  }

  try {
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/recruiting?welcome=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/recruiting-onboarding?step=pricing`,
      metadata,
      allow_promotion_codes: true,
      subscription_data: {
        metadata,
      },
    };

    if (email) {
      checkoutParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(checkoutParams);
    stripeCheckoutUrl = session.url || "";

    if (!stripeCheckoutUrl) {
      logger.error("Failed to create checkout session");
      await logger.flush();
      return {
        error: tErrors("genericError"),
      };
    }

    logger.info("Checkout session created successfully", {
      sessionId: session.id,
    });
    await logger.flush();
  } catch (error) {
    logger.error("Error creating checkout session:", {
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
    await logger.flush();
    return { error: tErrors("genericError") };
  } finally {
    await logger.flush();
    if (stripeCheckoutUrl) {
      redirect(stripeCheckoutUrl);
    }
  }
  return { error: tErrors("genericError") };
}
