"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { H3 } from "../typography";
import SidebarMenuItemClient from "./SideBarMenuItemClient";
import { Button } from "../ui/button";
import { PlusIcon, ChevronDown } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { AuthModal } from "../auth/auth-modal";
import { UserMenu } from "../auth/user-menu";
import { LinkAccountModal } from "../auth/link-account-modal";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { OnboardingChecklist } from "../onboarding/OnboardingChecklist";
import { Tables } from "@/utils/supabase/database.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppSidebarProps {
  numberOfCredits: number;
  jobs: Tables<"custom_jobs">[];
  interviewCopilots: Tables<"interview_copilots">[];
  user: User | null;
  hasSubscription: boolean;
  isInterviewCopilotEnabled: boolean;
  isResumeBuilderEnabled: boolean;
}

export function AppSidebar({
  interviewCopilots,
  jobs,
  numberOfCredits,
  hasSubscription,
  user,
  isInterviewCopilotEnabled,
  isResumeBuilderEnabled,
}: AppSidebarProps) {
  const searchParams = useSearchParams();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/assets/dark-logo.png");
  const t = useTranslations("sidebar");
  const { theme } = useTheme();
  const authError = searchParams.get("authError");
  const authSuccess = searchParams.get("authSuccess");

  useEffect(() => {
    if (authError || authSuccess) {
      setIsAuthOpen(true);
    }
  }, [authError, authSuccess]);

  useEffect(() => {
    setLogoSrc(
      theme === "light" ? "/assets/dark-logo.png" : "/assets/light-logo.png"
    );
  }, [theme]);

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard/jobs" className="flex items-center">
          <img src={logoSrc} alt="Perfect Interview" className="w-8 h-8 mr-2" />
          <H3>Perfect Interview</H3>
        </Link>
        {user && (
          <>
            {isInterviewCopilotEnabled ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <PlusIcon className="h-4 w-4" />
                      {t("create")}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/jobs?newJob=true">
                      {t("addJob")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/interview-copilots">
                      {t("createInterviewCopilot")}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button className="w-full">
                <Link
                  href={`/dashboard/jobs?newJob=true`}
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>{t("addJob")}</span>
                </Link>
              </Button>
            )}
          </>
        )}
      </SidebarHeader>
      <SidebarContent>
        {user && (
          <>
            {/* Jobs Section */}
            <SidebarGroup>
              {jobs.length > 0 && (
                <div className="px-4 py-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    {t("jobs")}
                  </h4>
                </div>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {jobs.map((job) => (
                    <SidebarMenuItemClient key={job.id} job={job} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Interview Copilots Section */}
            {interviewCopilots.length > 0 && (
              <SidebarGroup className="mt-6">
                <div className="px-4 py-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    {t("interviewCopilots")}
                  </h4>
                </div>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {interviewCopilots.map((copilot) => (
                      <Link
                        key={copilot.id}
                        href={`/dashboard/interview-copilots/${copilot.id}`}
                        className="flex items-center px-4 py-2 text-sm hover:bg-accent rounded-lg"
                      >
                        {copilot.title}
                      </Link>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {isResumeBuilderEnabled && (
              <SidebarGroup className="mt-6">
                <div className="px-4 py-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    {t("tools")}
                  </h4>
                </div>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <Link
                      href="/dashboard/resume-builder"
                      className="flex items-center px-4 py-2 text-sm hover:bg-accent rounded-lg"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 mr-2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      {t("resumeBuilder")}
                    </Link>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        {user && <OnboardingChecklist />}
        {user && !user.is_anonymous && !hasSubscription && (
          <>
            <p className="text-lg text-center font-bold px-4">
              {t("numberOfCredits", { numberOfCredits })}
            </p>
            <Link className="w-full" href="/purchase">
              <Button className="w-full">
                <PlusIcon />
                {t("buyMoreCredits")}
              </Button>
            </Link>
          </>
        )}
        {user && user.email && (
          <UserMenu email={user.email} hasSubscription={hasSubscription} />
        )}{" "}
        {user && user?.is_anonymous && <LinkAccountModal />}
        {(!user || user?.is_anonymous) && (
          <div>
            <Button
              onClick={() => setIsAuthOpen(true)}
              className="w-full"
              size="lg"
            >
              {t("signIn")}
            </Button>
          </div>
        )}
      </SidebarFooter>
      <AuthModal isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </Sidebar>
  );
}
