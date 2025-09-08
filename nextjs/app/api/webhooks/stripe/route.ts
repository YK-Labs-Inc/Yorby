import { createAdminClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { AxiomRequest, Logger, withAxiom } from "next-axiom";
import { trackServerEvent } from "@/utils/tracking/serverUtils";
import * as SibApiV3Sdk from "@sendinblue/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const CREDITS_MAP: { [key: string]: number } = {
  [process.env.SINGLE_CREDIT_PRODUCT_ID!]: 1,
  [process.env.FIVE_CREDITS_PRODUCT_ID!]: 5,
  [process.env.TEN_CREDITS_PRODUCT_ID!]: 10,
};

async function handleSuccessfulPayment(
  session: Stripe.Checkout.Session,
  logger: Logger
) {
  const userId = session.metadata?.userId;
  let productId = "";
  let amountTotal = 0;
  try {
    const supabase = await createAdminClient();
    const isSubscription = session.metadata?.isSubscription === "true";
    const isRecruitingSubscription =
      session.metadata?.priceId ===
      process.env.STRIPE_RECRUITING_SUBSCRIPTION_PRICE_ID;

    if (!userId) {
      logger.error("No user ID in session metadata");
      return;
    }

    if (isRecruitingSubscription) {
      // Handle recruiting subscription
      if (!session.customer) {
        logger.error("No customer ID in session for recruiting subscription", {
          sessionId: session.id,
        });
        return;
      }

      const companyId = session.metadata?.companyId;
      if (!companyId) {
        logger.error(
          "No company ID in session metadata for recruiting subscription",
          { sessionId: session.id }
        );
        return;
      }

      await supabase.from("recruiting_subscriptions").insert({
        company_id: companyId,
        stripe_customer_id: session.customer.toString(),
      });
      logger.info("Created recruiting subscription entry", {
        userId,
        companyId,
        stripeCustomerId: session.customer.toString(),
      });
    } else if (isSubscription) {
      // For regular subscriptions, we need to store both the user ID and the Stripe customer ID
      if (!session.customer) {
        logger.error("No customer ID in session", { sessionId: session.id });
        return;
      }

      await supabase.from("subscriptions").insert({
        id: userId,
        stripe_customer_id: session.customer.toString(),
      });
      logger.info("Created subscription entry", {
        userId,
        stripeCustomerId: session.customer.toString(),
      });
    } else {
      // Handle one-time credit purchase
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id
      );
      productId = lineItems.data[0]?.price?.product as string;
      amountTotal = lineItems.data[0]?.amount_total;
      const credits = CREDITS_MAP[productId];

      if (!credits) {
        logger.error("Invalid product ID or no credits mapping found", {
          productId,
        });
        return;
      }

      // Check if user already has credits
      const { data: existingCredits } = await supabase
        .from("custom_job_credits")
        .select("number_of_credits")
        .eq("id", userId)
        .single();

      if (existingCredits) {
        // Update existing credits
        await supabase
          .from("custom_job_credits")
          .update({
            number_of_credits: existingCredits.number_of_credits + credits,
          })
          .eq("id", userId);
        logger.info("Updated credits", {
          userId,
          previousCredits: existingCredits.number_of_credits,
          addedCredits: credits,
        });
      } else {
        // Create new credits entry
        await supabase.from("custom_job_credits").insert({
          number_of_credits: credits,
          id: userId,
        });
        logger.info("Created new credits entry", { userId, credits });
      }
    }
    if (session.customer_email) {
      await addUserToBrevoPaidUserList({
        email: session.customer_email,
        logger,
      });
    }
  } catch (error) {
    logger.error("Error handling successful payment", { error });
  } finally {
    if (userId) {
      await trackServerEvent({
        eventName: "purchase_completed",
        userId,
        args: {
          priceId: productId,
          amountTotal,
        },
      });
    }
    await logger.flush();
  }
}

async function handleSubscriptionEnded(
  subscription: Stripe.Subscription,
  logger: Logger
) {
  try {
    const supabase = await createAdminClient();
    const stripeCustomerId = subscription.customer as string;

    if (!stripeCustomerId) {
      logger.error("No customer ID in subscription");
      return;
    }

    // Check if it's a recruiting subscription by looking at the price ID
    const priceId = subscription.items.data[0]?.price?.id;
    const isRecruitingSubscription =
      priceId === process.env.STRIPE_RECRUITING_SUBSCRIPTION_PRICE_ID;

    if (isRecruitingSubscription) {
      const companyId = subscription.metadata.companyId;

      if (!companyId) {
        logger.error("No company ID in recruiting subscription metadata");
        return;
      }

      const { error: deleteError } = await supabase
        .from("recruiting_subscriptions")
        .delete()
        .eq("company_id", companyId);

      if (deleteError) {
        logger.error("Error deleting recruiting subscription", {
          stripeCustomerId,
          error: deleteError,
        });
        return;
      }

      logger.info("Deleted recruiting subscription entry", {
        companyId,
        stripeCustomerId,
      });
    } else {
      // Handle regular subscription deletion
      const { data: subscriptionData, error: fetchError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("stripe_customer_id", stripeCustomerId)
        .single();

      if (fetchError || !subscriptionData) {
        logger.error("Error finding subscription", {
          stripeCustomerId,
          error: fetchError,
        });
        return;
      }

      const { error: deleteError } = await supabase
        .from("subscriptions")
        .delete()
        .eq("stripe_customer_id", stripeCustomerId);

      if (deleteError) {
        logger.error("Error deleting subscription", {
          stripeCustomerId,
          error: deleteError,
        });
        return;
      }

      logger.info("Deleted subscription entry", {
        userId: subscriptionData.id,
        stripeCustomerId,
      });
    }
  } catch (error) {
    logger.error("Error handling subscription ended", { error });
  } finally {
    await logger.flush();
  }
}

const handleInvoiceCreated = async (
  invoice: Stripe.Invoice,
  logger: Logger
) => {
  logger.info("Invoice created", { invoiceId: invoice.id });
  const supabase = await createAdminClient();
  const stripeCustomerId = invoice.customer as string;

  if (!stripeCustomerId) {
    logger.error("No customer ID in invoice");
    return;
  }

  try {
    // Look up the company_id from recruiting_subscriptions using the stripe_customer_id
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("recruiting_subscriptions")
      .select("company_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (subscriptionError) {
      logger.error("Failed to find recruiting subscription", { 
        stripeCustomerId, 
        error: subscriptionError 
      });
      return;
    }

    const companyId = subscriptionData.company_id;

    // Upsert metered usage: reset to 0 if exists, create with 0 if doesn't exist
    const { error: upsertError } = await supabase
      .from("recruiting_subscriptions_metered_usage")
      .upsert({
        company_id: companyId,
        count: 0
      }, {
        onConflict: "company_id"
      });

    if (upsertError) {
      logger.error("Failed to upsert metered usage", { 
        companyId, 
        error: upsertError 
      });
      return;
    }

    logger.info("Reset metered usage count to 0", { companyId });
  } catch (error) {
    logger.error("Error handling invoice created", { error });
  }
};

export const POST = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    path: "/api/webhooks/stripe",
    method: "POST",
  });

  try {
    logger.info("Received Stripe webhook");
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      logger.error("No signature");
      return new NextResponse("No signature", { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    logger.info("Received Stripe webhook", { type: event.type });

    switch (event.type) {
      case "checkout.session.completed":
        await handleSuccessfulPayment(
          event.data.object as Stripe.Checkout.Session,
          logger
        );

      case "customer.subscription.deleted":
        await handleSubscriptionEnded(
          event.data.object as Stripe.Subscription,
          logger
        );

      case "invoice.created":
        await handleInvoiceCreated(event.data.object as Stripe.Invoice, logger);
      default:
        logger.info("Unhandled event type", { type: event.type });
    }

    await logger.flush();
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    logger.error("Error processing webhook", { error });
    await logger.flush();
    return new NextResponse("Webhook Error", { status: 400 });
  }
});

const addUserToBrevoPaidUserList = async ({
  email,
  logger,
}: {
  email: string;
  logger: Logger;
}) => {
  try {
    let apiInstance = new SibApiV3Sdk.ContactsApi();
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY is not set");
    }
    apiInstance.setApiKey(SibApiV3Sdk.ContactsApiApiKeys.apiKey, brevoApiKey);

    let updateContact = new SibApiV3Sdk.UpdateContact();

    updateContact.listIds = [6, 8];

    await apiInstance.updateContact(email, updateContact);
    logger.info("Added contact to paid user list");
  } catch (error: any) {
    logger.error("Failed to add user to Brevo", { error });
  }
};
