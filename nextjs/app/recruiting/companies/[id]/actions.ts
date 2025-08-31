"use server";

import { Logger } from "next-axiom";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import Stripe from "stripe";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export const upgradeCompany = async (
  _prevState: { error?: string },
  formData: FormData
) => {
  const companyId = formData.get("company_id") as string;

  const upgradeCompanyLog = new Logger().with({
    function: "upgradeCompany",
    params: { companyId },
  });

  const t = await getTranslations("apply.upgradeCompany.errors");

  let sessionUrl: string | null = null;

  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const user = await getServerUser();

    if (!user) {
      upgradeCompanyLog.error("User not authenticated");
      await upgradeCompanyLog.flush();
      return { error: t("userNotAuthenticated") };
    }

    // Verify user has access to this company (must be owner or admin)
    const { data: memberData, error: memberError } = await supabase
      .from("company_members")
      .select("role")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData) {
      upgradeCompanyLog.error("User not authorized for this company", {
        userId: user.id,
        companyId,
        error: memberError,
      });
      await upgradeCompanyLog.flush();
      return { error: t("notAuthorized") };
    }

    if (memberData.role !== "owner" && memberData.role !== "admin") {
      upgradeCompanyLog.error("User lacks permission to upgrade", {
        userId: user.id,
        companyId,
        role: memberData.role,
      });
      await upgradeCompanyLog.flush();
      return { error: t("onlyOwnersAndAdmins") };
    }

    // Create Stripe checkout session
    const headersList = await headers();
    const origin = headersList.get("origin");
    const metadata = {
      userId: user.id,
      companyId,
      userEmail: user.email || "",
      priceId: process.env.STRIPE_RECRUITING_SUBSCRIPTION_PRICE_ID!,
    };

    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_RECRUITING_SUBSCRIPTION_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${origin}/recruiting/companies/${companyId}?upgraded=true`,
      cancel_url: `${origin}/recruiting/companies/${companyId}`,
      metadata,
      allow_promotion_codes: true,
      subscription_data: {
        metadata,
      },
    };

    if (user.email) {
      checkoutParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(checkoutParams);

    if (!session.url) {
      upgradeCompanyLog.error("Failed to create checkout session");
      await upgradeCompanyLog.flush();
      return { error: t("failedToCreateCheckoutSession") };
    }

    upgradeCompanyLog.info("Checkout session created successfully", {
      sessionId: session.id,
      userId: user.id,
      companyId,
    });

    await upgradeCompanyLog.flush();
    sessionUrl = session.url;
  } catch (error) {
    upgradeCompanyLog.error("Error creating checkout session", { error });
    await upgradeCompanyLog.flush();
    return { error: t("genericError") };
  }

  if (sessionUrl) {
    redirect(sessionUrl);
  }

  return { error: t("genericError") };
};

export const checkCompanySubscription = async (companyId: string) => {
  const checkSubscriptionLog = new Logger().with({
    function: "checkCompanySubscription",
    params: { companyId },
  });

  const t = await getTranslations("apply.upgradeCompany.errors");

  try {
    const supabase = await createSupabaseServerClient();

    // Check if company has a subscription
    const { data, error } = await supabase
      .from("recruiting_subscriptions")
      .select("*")
      .eq("company_id", companyId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      checkSubscriptionLog.error("Error checking subscription", { error });
      await checkSubscriptionLog.flush();
      return { success: false, hasSubscription: false, error: error.message };
    }

    const hasSubscription = !!data;

    checkSubscriptionLog.info("Subscription check completed", {
      companyId,
      hasSubscription,
    });
    await checkSubscriptionLog.flush();
    revalidatePath(`/recruiting/companies/${companyId}`);
    return { success: true, hasSubscription, error: null };
  } catch (error) {
    checkSubscriptionLog.error("Error checking subscription", { error });
    await checkSubscriptionLog.flush();
    return {
      success: false,
      hasSubscription: false,
      error: t("unexpectedError"),
    };
  }
};
