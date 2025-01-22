import Stripe from "stripe";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import RedirectMessage from "./RedirectMessage";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export default async function PurchaseConfirmation({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const logger = new Logger();
  const sessionId = searchParams.session_id;

  if (!sessionId) {
    return <RedirectMessage success={false} redirectPath="/dashboard/jobs" />;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      logger.error("Payment not completed", {
        sessionId,
        paymentStatus: session.payment_status,
      });
      return (
        <RedirectMessage
          success={false}
          redirectPath="/purchase?error=payment_incomplete"
        />
      );
    }

    // Get user from metadata
    const userId = session.metadata?.userId;
    if (!userId) {
      logger.error("User ID not found in session metadata", { sessionId });
      return (
        <RedirectMessage
          success={false}
          redirectPath="/purchase?error=verification_failed"
        />
      );
    }

    logger.info("Session verified successfully", {
      sessionId,
      userId,
    });

    return <RedirectMessage success={true} redirectPath="/dashboard/jobs" />;
  } catch (error) {
    logger.error("Error verifying session", {
      error: error instanceof Error ? error.message : "Unknown error",
      sessionId,
    });
    return (
      <RedirectMessage
        success={false}
        redirectPath="/purchase?error=verification_failed"
      />
    );
  } finally {
    await logger.flush();
  }
}
