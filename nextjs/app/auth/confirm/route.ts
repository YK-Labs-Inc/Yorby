import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { withAxiom, AxiomRequest } from "next-axiom";

export const GET = withAxiom(async function GET(request: AxiomRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const _next = searchParams.get("next");
  const next = _next?.startsWith("/") ? _next : "/";

  const logger = request.log.with({
    method: "GET",
    path: "/auth/confirm",
    token_hash: token_hash ? "present" : "missing",
    type,
    next,
    originalNext: _next,
  });

  logger.info("Auth confirmation attempt");

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      logger.info("OTP verification successful", {
        redirectTo: next,
      });
      // redirect user to specified redirect URL or root of app
      redirect(next);
    } else {
      logger.error("OTP verification failed", {
        error: error.message,
      });
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${error?.message}`);
    }
  }

  logger.error("Missing token hash or type");
  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No token hash or type`);
});
