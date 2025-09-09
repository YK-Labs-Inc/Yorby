"use client";

import { verifyOTP } from "@/app/auth/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import InterviewInvitationPage from "./InterviewInvitationPage";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@radix-ui/react-select";
import { CheckCircle } from "lucide-react";
import ResendEmailForm from "./ResendEmailForm";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EmailVerificationComponentProps {
  companyName: string;
  companyId: string;
  jobId: string;
  jobTitle: string;
  interviewId?: string;
  user: User;
}

export default function EmailVerificationComponent({
  companyId,
  jobId,
  jobTitle,
  companyName,
  interviewId,
  user,
}: EmailVerificationComponentProps) {
  const tAuth = useTranslations("auth.login");
  const t = useTranslations("apply");
  const [otpState, otpAction, otpPending] = useActionState(verifyOTP, {
    error: null,
    success: false,
  });
  const [showInterviewInvitation, setShowInterviewInvitation] = useState(
    !user.is_anonymous
  );
  const router = useRouter();
  useEffect(() => {
    if (otpState.success) {
      if (interviewId) {
        setShowInterviewInvitation(true);
      } else {
        router.push(
          `/apply/company/${companyId}/job/${jobId}/application/submitted`
        );
      }
    } else if (otpState.error) {
      toast.error(otpState.error);
    }
  }, [interviewId, otpState.success, otpState.error]);

  if (!user) {
    return null;
  }
  if (showInterviewInvitation) {
    return (
      <InterviewInvitationPage
        redirectUrl={`/apply/company/${companyId}/job/${jobId}/candidate-interview/${interviewId}`}
      />
    );
  }
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 text-green-600">
          <CheckCircle className="h-12 w-12" />
        </div>
        <CardTitle className="text-2xl text-green-700">
          {t("confirmEmail.title")}
        </CardTitle>
        <CardDescription className="text-lg mt-2">
          {t("confirmEmail.description")}{" "}
          <span className="font-semibold">{user.email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="font-semibold text-lg text-green-800">{jobTitle}</p>
            <p className="text-green-600">
              {t("confirmEmail.at")} {companyName}
            </p>
          </div>
        </div>
        <form action={otpAction}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="token">
                {tAuth("otp.verificationCodeLabel")}
              </Label>
              <Input
                id="token"
                name="token"
                type="text"
                placeholder={tAuth("otp.verificationCodePlaceholder")}
                required
                className="text-center text-2xl tracking-wider"
                maxLength={6}
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
            {otpState.error && (
              <p className="text-sm text-red-500">{otpState.error}</p>
            )}
            <input type="hidden" name="email" value={user?.new_email} />
            <input type="hidden" name="otpType" value="email_change" />
            <Button type="submit" className="w-full" disabled={otpPending}>
              {otpPending ? tAuth("otp.verifying") : tAuth("otp.verifyCode")}
            </Button>
          </div>
        </form>
        <Separator />
        <div className="space-y-4">
          <ResendEmailForm
            companyId={companyId}
            jobId={jobId}
            interviewId={interviewId}
          />

          <div className="text-center text-sm text-gray-500">
            <p>
              {t("confirmEmail.cannotFindEmail")}{" "}
              <Link
                href={`/apply/company/${companyId}/job/${jobId}`}
                className="text-blue-600 hover:underline"
              >
                {t("confirmEmail.returnToJobListing")}
              </Link>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
