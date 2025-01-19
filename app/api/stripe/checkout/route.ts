import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const priceId = formData.get("priceId") as string;

  if (!priceId) {
    return redirect("/purchase?error=missing-price");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/dashboard?success=true`,
      cancel_url: `${request.nextUrl.origin}/purchase?canceled=true`,
    });

    return redirect(session.url || "/purchase?error=no-checkout-url");
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return redirect("/purchase?error=checkout-failed");
  }
}
