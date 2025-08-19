"use client";

import { useActionState, useEffect } from "react";
import { acceptInvitation } from "./actions";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface InvitationData {
  id: string;
  company_id: string;
  role: string;
  invited_at: string | null;
  invitation_expires_at: string | null;
  invitation_email: string | null;
  isExpired: boolean;
  companies: {
    id: string;
    name: string;
    industry: string | null;
    company_size: string | null;
  };
}

interface AcceptInvitationClientProps {
  invitation: InvitationData;
  token: string;
}

export function AcceptInvitationClient({
  invitation,
  token,
}: AcceptInvitationClientProps) {
  const t = useTranslations("company.acceptInvitation.client");
  const [state, formAction, isPending] = useActionState(acceptInvitation, {
    error: "",
    success: false,
  });

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  // If invitation has expired
  if (invitation.isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
              <Clock className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">{t("expired.title")}</CardTitle>
            <CardDescription>
              {t("expired.description", {
                companyName: invitation.companies.name,
              })}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full">
              <Link href="/recruiting" className="w-full">
                {t("expired.button")}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Valid invitation - show accept UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {t("valid.title", { companyName: invitation.companies.name })}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {state.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state.success && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{t("valid.successMessage")}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex gap-3 justify-center">
          <form action={formAction} className="flex-1">
            <input type="hidden" name="token" value={token} />
            <Button
              type="submit"
              disabled={isPending || state.success}
              className="w-full"
            >
              {isPending ? t("valid.acceptingButton") : t("valid.acceptButton")}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
