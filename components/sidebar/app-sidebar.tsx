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
import { usePathname, useSearchParams } from "next/navigation";
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
  isResumeBuilderEnabled: boolean;
  isSubscriptionVariant: boolean;
  resumes: Tables<"resumes">[];
}

export function AppSidebar({
  interviewCopilots,
  jobs,
  numberOfCredits,
  hasSubscription,
  user,
  isResumeBuilderEnabled,
  isSubscriptionVariant,
  resumes,
}: AppSidebarProps) {
  const searchParams = useSearchParams();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const t = useTranslations("sidebar");
  const authError = searchParams.get("authError");
  const authSuccess = searchParams.get("authSuccess");
  const pathname = usePathname();
  const hideSidebar = pathname.includes("sample-resumes");

  useEffect(() => {
    if (authError || authSuccess) {
      setIsAuthOpen(true);
    }
  }, [authError, authSuccess]);

  if (hideSidebar) {
    return null;
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard/jobs" className="flex items-center">
          <img
            src="/assets/dark-logo.png"
            alt="Perfect Interview"
            className="w-8 h-8 mr-2"
          />
          <H3>Perfect Interview</H3>
        </Link>
        {user && (
          <>
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
                  <Link href="/dashboard/jobs?newJob=true">{t("addJob")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/interview-copilots">
                    {t("createInterviewCopilot")}
                  </Link>
                </DropdownMenuItem>
                {isResumeBuilderEnabled && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/resumes">{t("createResume")}</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
                    {t("resumes")}
                  </h4>
                </div>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {resumes.map((resume) => (
                      <Link
                        key={resume.id}
                        href={`/dashboard/resumes/${resume.id}`}
                        className="flex items-center px-4 py-2 text-sm hover:bg-accent rounded-lg"
                      >
                        {resume.title}
                      </Link>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        {user && <OnboardingChecklist />}
        {!isSubscriptionVariant && user && !hasSubscription && (
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
        {isSubscriptionVariant && user && !hasSubscription && (
          <Link href="/purchase">
            <Button className="w-full">{t("unlockAllAccess")}</Button>
          </Link>
        )}
        {user && user.email && (
          <UserMenu email={user.email} hasSubscription={hasSubscription} />
        )}{" "}
        {user && user?.is_anonymous && <LinkAccountModal />}
        {!user && (
          <Link href="/sign-in">
            <Button className="w-full">{t("signIn")}</Button>
          </Link>
        )}
      </SidebarFooter>
      <AuthModal isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </Sidebar>
  );
}
