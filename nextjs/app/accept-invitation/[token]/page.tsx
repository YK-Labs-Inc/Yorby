import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Logger } from "next-axiom";
import { getInvitationDetails } from "./actions";
import { AcceptInvitationClient } from "./accept-invitation-client";
import { getTranslations } from "next-intl/server";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AcceptInvitationPage({
  params,
  searchParams,
}: PageProps) {
  const { token } = await params;
  const { email } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("company.acceptInvitation");
  const logger = new Logger().with({
    function: "AcceptInvitationPage",
    params: { token },
  });

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // If not logged in, redirect to sign-up with this page as redirect URL
  if (authError || !user) {
    logger.info("User not authenticated, redirecting to sign-up", { token });
    await logger.flush();

    const params = new URLSearchParams();
    params.set("redirect", `/accept-invitation/${token}`);
    if (email) {
      params.set("email", email as string);
    }
    redirect(`/auth/sign-up?${params.toString()}`);
  }

  // Get invitation details
  const invitation = await getInvitationDetails(token);

  if (!invitation) {
    logger.error("Invitation not found or invalid", { token });
    await logger.flush();

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">
              {t("page.invalidInvitation.title")}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t("page.invalidInvitation.description")}
            </p>
            <a
              href="/recruiting"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {t("page.invalidInvitation.button")}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check if user email matches invitation email (if invitation email is set)
  if (
    invitation.invitation_email &&
    invitation.invitation_email !== user.email
  ) {
    logger.warn("User email does not match invitation email", {
      userEmail: user.email,
      invitationEmail: invitation.invitation_email,
    });
    await logger.flush();

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold mb-4">
              {t("page.emailMismatch.title")}
            </h1>

            <p className="text-muted-foreground">
              {t("page.emailMismatch.description")}
            </p>

            <p className="text-muted-foreground">
              {t("page.emailMismatch.instruction")}{" "}
              {invitation.invitation_email}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <AcceptInvitationClient invitation={invitation} token={token} />;
}
