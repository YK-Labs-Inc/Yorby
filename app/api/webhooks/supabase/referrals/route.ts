import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import { AxiomRequest } from "next-axiom";
import { createAdminClient } from "@/utils/supabase/server";
import { Tables } from "@/utils/supabase/database.types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

// Define the webhook payload type
type InsertPayload = {
  type: "INSERT";
  table: string;
  schema: string;
  record: Tables<"referrals">;
  old_record: null;
};

// Verify the webhook request is legitimate by checking the Authorization header
const verifyWebhookRequest = (request: Request): boolean => {
  return (
    request.headers.get("authorization") ===
    `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET!}`
  );
};

export const POST = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    path: "/api/webhooks/supabase/referrals",
  });

  try {
    // Verify the webhook request
    if (!verifyWebhookRequest(request)) {
      logger.error("Invalid webhook request - authentication failed");
      return NextResponse.json(
        { error: "Invalid webhook request - authentication failed" },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload = (await request.json()) as InsertPayload;

    // Validate that this is an insert event for the referrals table
    if (payload.type !== "INSERT" || payload.table !== "referrals") {
      logger.error("Unexpected webhook payload", { payload });
      return NextResponse.json(
        { error: "Unexpected webhook payload" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Get the user's referral code
    const { data: referralCode, error: referralCodeError } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("id", payload.record.referral_code_id)
      .maybeSingle();

    if (referralCodeError || !referralCode) {
      logger.error("Error fetching referral code", {
        error: referralCodeError,
        referralCodeId: payload.record.referral_code_id,
      });
      return NextResponse.json(
        { error: "Error fetching referral code" },
        { status: 404 }
      );
    }

    // Count total referrals for this referral code
    const { count, error: countError } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referral_code_id", referralCode.id);

    if (countError) {
      logger.error("Error counting referrals", { error: countError });
      return NextResponse.json(
        { error: "Error counting referrals" },
        { status: 500 }
      );
    }

    const totalReferralCount = count || 0;

    // Get total redemptions for this user
    const { data: redemptions, error: redemptionsError } = await supabase
      .from("referral_redemptions")
      .select("referral_redemption_count")
      .eq("id", referralCode.user_id)
      .maybeSingle();

    if (redemptionsError) {
      logger.error("Error fetching redemptions", { error: redemptionsError });
      return NextResponse.json(
        { error: "Error fetching redemptions" },
        { status: 500 }
      );
    }

    const currentRedemptionCount = redemptions?.referral_redemption_count || 0;

    // Calculate how many new redemptions are available
    const totalPossibleRedemptions = Math.floor(totalReferralCount / 3);
    const newRedemptionsAvailable =
      totalPossibleRedemptions - currentRedemptionCount;

    if (newRedemptionsAvailable > 0) {
      // Check if user has an existing subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("id", referralCode.user_id)
        .maybeSingle();

      if (!subscription?.stripe_customer_id) {
        // Create new Stripe customer and trial subscription
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.admin.getUserById(referralCode.user_id);

        if (userError || !user?.email) {
          logger.error("Error fetching user", {
            error: userError,
            userId: referralCode.user_id,
          });
          return NextResponse.json(
            { error: "Error fetching user" },
            { status: 404 }
          );
        }

        try {
          // Create Stripe customer
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: {
              supabase_user_id: referralCode.user_id,
              referral_reward: "true",
            },
          });

          // Create trial subscription
          const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: process.env.STRIPE_MONTHLY_PRICE_ID }],
            trial_period_days: 30 * newRedemptionsAvailable,
            metadata: {
              source: "referral_reward",
              referral_count: totalReferralCount.toString(),
              redemptions_applied: newRedemptionsAvailable.toString(),
            },
          });

          // Store Stripe customer ID in Supabase
          const { error: subscriptionError } = await supabase
            .from("subscriptions")
            .insert({
              id: referralCode.user_id,
              stripe_customer_id: customer.id,
            });

          if (subscriptionError) {
            logger.error("Error storing subscription", {
              error: subscriptionError,
            });
          }

          // Record the redemption - use upsert to update or create
          const { error: redemptionError } = await supabase
            .from("referral_redemptions")
            .upsert({
              id: referralCode.user_id,
              referral_redemption_count:
                currentRedemptionCount + newRedemptionsAvailable,
            });

          if (redemptionError) {
            logger.error("Error recording redemption", {
              error: redemptionError,
            });
            return NextResponse.json(
              { error: "Error recording redemption" },
              { status: 500 }
            );
          }

          logger.info("Created new trial subscription for referral rewards", {
            userId: referralCode.user_id,
            stripeCustomerId: customer.id,
            subscriptionId: subscription.id,
            totalReferralCount,
            previousRedemptionCount: currentRedemptionCount,
            newRedemptionsApplied: newRedemptionsAvailable,
            totalRedemptionCount:
              currentRedemptionCount + newRedemptionsAvailable,
            trialDays: 30 * newRedemptionsAvailable,
          });
        } catch (stripeError) {
          logger.error("Stripe error", {
            error:
              stripeError instanceof Error
                ? stripeError.message
                : String(stripeError),
          });
          return NextResponse.json(
            { error: "Error processing Stripe subscription" },
            { status: 500 }
          );
        }
      } else {
        try {
          // Check for any subscription (active, cancelled, or expired)
          const subscriptions = await stripe.subscriptions.list({
            customer: subscription.stripe_customer_id,
            limit: 1,
            status: "all",
          });

          let currentSub = subscriptions.data[0];

          if (!currentSub) {
            // No subscription exists, create a new one
            currentSub = await stripe.subscriptions.create({
              customer: subscription.stripe_customer_id,
              items: [{ price: process.env.STRIPE_MONTHLY_PRICE_ID }],
              trial_period_days: 30 * newRedemptionsAvailable,
              metadata: {
                source: "referral_reward",
                referral_count: totalReferralCount.toString(),
                redemptions_applied: newRedemptionsAvailable.toString(),
              },
            });

            logger.info("Created new subscription for existing customer", {
              userId: referralCode.user_id,
              stripeCustomerId: subscription.stripe_customer_id,
              subscriptionId: currentSub.id,
              trialDays: 30 * newRedemptionsAvailable,
            });
          } else if (currentSub.status === "active") {
            // Extend active subscription
            const newEndDate = new Date(currentSub.current_period_end * 1000);
            newEndDate.setMonth(
              newEndDate.getMonth() + newRedemptionsAvailable
            );

            currentSub = await stripe.subscriptions.update(currentSub.id, {
              trial_end: Math.floor(newEndDate.getTime() / 1000),
              metadata: {
                extended_by_referral: "true",
                total_referral_count: totalReferralCount.toString(),
                new_redemptions_applied: newRedemptionsAvailable.toString(),
              },
            });

            logger.info("Extended existing active subscription", {
              userId: referralCode.user_id,
              subscriptionId: currentSub.id,
              newEndDate: newEndDate.toISOString(),
            });
          } else {
            // Reactivate cancelled/expired subscription with new trial
            currentSub = await stripe.subscriptions.create({
              customer: subscription.stripe_customer_id,
              items: [{ price: process.env.STRIPE_MONTHLY_PRICE_ID }],
              trial_period_days: 30 * newRedemptionsAvailable,
              metadata: {
                source: "referral_reward",
                referral_count: totalReferralCount.toString(),
                redemptions_applied: newRedemptionsAvailable.toString(),
                previous_subscription_id: currentSub.id,
              },
            });

            logger.info("Reactivated subscription with new trial", {
              userId: referralCode.user_id,
              oldSubscriptionId: subscriptions.data[0].id,
              newSubscriptionId: currentSub.id,
              trialDays: 30 * newRedemptionsAvailable,
            });
          }

          // Record the redemption - use upsert to update or create
          const { error: redemptionError } = await supabase
            .from("referral_redemptions")
            .upsert({
              id: referralCode.user_id,
              referral_redemption_count:
                currentRedemptionCount + newRedemptionsAvailable,
            });

          if (redemptionError) {
            logger.error("Error recording redemption", {
              error: redemptionError,
            });
            return NextResponse.json(
              { error: "Error recording redemption" },
              { status: 500 }
            );
          }

          logger.info("Successfully processed referral reward", {
            userId: referralCode.user_id,
            stripeCustomerId: subscription.stripe_customer_id,
            subscriptionId: currentSub.id,
            totalReferralCount,
            previousRedemptionCount: currentRedemptionCount,
            newRedemptionsApplied: newRedemptionsAvailable,
            totalRedemptionCount:
              currentRedemptionCount + newRedemptionsAvailable,
            subscriptionStatus: currentSub.status,
          });
        } catch (stripeError) {
          logger.error("Stripe error", {
            error:
              stripeError instanceof Error
                ? stripeError.message
                : String(stripeError),
          });
          return NextResponse.json(
            { error: "Error processing Stripe subscription" },
            { status: 500 }
          );
        }
      }
    } else {
      logger.info("No new rewards to redeem", {
        userId: referralCode.user_id,
        totalReferralCount,
        currentRedemptionCount,
        newRedemptionsAvailable,
      });
    }

    return NextResponse.json({
      success: true,
      totalReferralCount,
      currentRedemptionCount,
      newRedemptionsAvailable,
      rewardProcessed: newRedemptionsAvailable > 0,
    });
  } catch (error) {
    logger.error("Error processing referral reward:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
