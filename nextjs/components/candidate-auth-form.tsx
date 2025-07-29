"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Briefcase } from "lucide-react";
import { useTranslations } from "next-intl";

export function CandidateAuthForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.candidateAuth");

  const redirectUrl = searchParams.get("redirect");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectUrl || `${window.location.origin}/auth-redirect`,
        },
      });
      
      if (error) throw error;
      
      setStep("otp");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t("errors.sendOtp"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      
      if (error) throw error;

      router.push(redirectUrl || "/auth-redirect");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t("errors.verifyOtp"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">{t("badge")}</span>
          </div>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleSendOTP}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">{t("email.label")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("email.placeholder")}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("sending") : t("sendOtp")}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="otp">{t("otp.label")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("otp.description", { email })}
                  </p>
                  <Input
                    id="otp"
                    type="text"
                    placeholder={t("otp.placeholder")}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("verifying") : t("verify")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {t("backToEmail")}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      <div className="text-center text-sm text-muted-foreground">
        {t("organizationPrompt")}{" "}
        <Link
          href="/auth/login"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          {t("organizationLink")}
        </Link>
      </div>
    </div>
  );
}