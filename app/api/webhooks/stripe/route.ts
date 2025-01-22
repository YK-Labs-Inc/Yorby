import { createAdminClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { AxiomRequest, Logger, withAxiom } from "next-axiom";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
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
  try {
    const supabase = await createAdminClient();
    const userId = session.metadata?.userId;
    const isSubscription = session.metadata?.isSubscription === "true";

    if (!userId) {
      logger.error("No user ID in session metadata");
      return;
    }

    if (isSubscription) {
      // For subscriptions, we need to store both the user ID and the Stripe customer ID
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
      const productId = lineItems.data[0]?.price?.product as string;
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
  } catch (error) {
    logger.error("Error handling successful payment", { error });
  } finally {
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

    // Find and delete subscription entry using the Stripe customer ID
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
  } catch (error) {
    logger.error("Error handling subscription ended", { error });
  } finally {
    await logger.flush();
  }
}

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
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionEnded(
          event.data.object as Stripe.Subscription,
          logger
        );
        break;

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
