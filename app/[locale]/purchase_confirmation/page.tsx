import Stripe from "stripe";
import { Logger } from "next-axiom";
import RedirectMessage from "./RedirectMessage";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export default async function PurchaseConfirmation({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const logger = new Logger();
  const sessionId = (await searchParams).session_id as string;

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

    logger.info("Session verified successfully", {
      sessionId,
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
