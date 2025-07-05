import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function GET(request: NextRequest) {
  const logger = new Logger();
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: "Session ID is required" },
      { status: 400 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      logger.error("Payment not completed", {
        sessionId,
        paymentStatus: session.payment_status,
      });
      return NextResponse.json(
        { success: false, error: "Payment not completed" },
        { status: 400 },
      );
    }

    // Get user from metadata
    const userId = session.metadata?.userId;
    if (!userId) {
      logger.error("User ID not found in session metadata", { sessionId });
      return NextResponse.json(
        { success: false, error: "User ID not found" },
        { status: 400 },
      );
    }

    // Update user credits in database if needed
    // This might be redundant if you're handling this in the webhook
    const supabase = await createSupabaseServerClient();

    logger.info("Session verified successfully", {
      sessionId,
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error verifying session", {
      error: error instanceof Error ? error.message : "Unknown error",
      sessionId,
    });
    return NextResponse.json(
      { success: false, error: "Failed to verify session" },
      { status: 500 },
    );
  } finally {
    await logger.flush();
  }
}
