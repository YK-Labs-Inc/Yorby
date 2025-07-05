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
import SidebarMenuItemClient from "./SideBarMenuItemClient";
import { Button } from "../ui/button";
import { PlusIcon, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { AuthModal } from "../auth/auth-modal";
import { UserMenu } from "../auth/user-menu";
import { LinkAccountModal } from "../auth/link-account-modal";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { usePathname, useSearchParams } from "next/navigation";
import { Tables } from "@/utils/supabase/database.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMultiTenant } from "@/app/context/MultiTenantContext";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "./Header";
import { CoachInfo, StudentWithEmailAndName } from "@/app/layout";
import Link from "next/link";
interface AppSidebarProps {
  numberOfCredits: number;
  jobs: Tables<"custom_jobs">[];
  coachJobs: Tables<"custom_jobs">[];
  coachInfo: CoachInfo;
  interviewCopilots: Tables<"interview_copilots">[];
  user: User | null;
  hasSubscription: boolean;
  isResumeBuilderEnabled: boolean;
  isSubscriptionVariant: boolean;
  resumes: Tables<"resumes">[];
  isMemoriesEnabled: boolean;
  enableTransformResume: boolean;
  referralsEnabled: boolean;
  students: StudentWithEmailAndName[];
}

function AppSidebarLoading() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center">
          <Skeleton className="w-8 h-8 mr-2 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-10 w-full mt-4" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-2">
            <Skeleton className="h-4 w-24" />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              <div className="px-4 py-2">
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-5 w-full" />
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-6">
          <div className="px-4 py-2">
            <Skeleton className="h-4 w-28" />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              <div className="px-4 py-2">
                <Skeleton className="h-5 w-full mb-2" />
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-6">
          <div className="px-4 py-2">
            <Skeleton className="h-4 w-20" />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              <div className="px-4 py-2">
                <Skeleton className="h-5 w-full mb-2" />
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-8 w-full" />
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppSidebar({
  interviewCopilots,
  jobs,
  coachJobs,
  coachInfo,
  numberOfCredits,
  hasSubscription,
  user,
  isResumeBuilderEnabled,
  isSubscriptionVariant,
  resumes,
  isMemoriesEnabled,
  enableTransformResume,
  referralsEnabled,
  students,
}: AppSidebarProps) {
  const searchParams = useSearchParams();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const t = useTranslations("sidebar");
  const authError = searchParams?.get("authError");
  const authSuccess = searchParams?.get("authSuccess");
  const {
    isLoadingBranding,
    isYorby,
    isCoachProgramsPage,
    isCoachDashboardPage,
  } = useMultiTenant();
  const pathname = usePathname();

  useEffect(() => {
    if (authError || authSuccess) {
      setIsAuthOpen(true);
    }
  }, [authError, authSuccess]);

  useEffect(() => {
    if (isYorby) {
      if (
        isCoachDashboardPage ||
        isCoachProgramsPage ||
        pathname === "/memories"
      ) {
        setShowSidebar(true);
      } else {
        setShowSidebar(false);
      }
    } else {
      setShowSidebar(true);
    }
  }, [isYorby, isCoachDashboardPage, isCoachProgramsPage]);

  if (!showSidebar) {
    return null;
  }

  if (isLoadingBranding) {
    return <AppSidebarLoading />;
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Header />

        {user && (
          <>
            <DropdownMenu>
              {/* Only show Create dropdown if not a coach path */}
              {!isYorby && (
                <DropdownMenuTrigger asChild>
                  <Button className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <PlusIcon className="h-4 w-4" />
                      {t("create")}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              )}
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/jobs?newJob=true">
                    {t("addInterviewPrep")}
                  </Link>
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
                {enableTransformResume && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/transform-resume">
                      {t("transformResume")}
                    </Link>
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
            {/* COACH VIEW: Only show for coaches */}
            {coachInfo.isCoach && (
              <>
                {/* Students Section - Coach View */}
                {students.length > 0 && (
                  <SidebarGroup>
                    <div className="px-4 py-2">
                      <h4 className="text-sm font-semibold text-muted-foreground">
                        {t("students")}
                      </h4>
                    </div>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {students.map((student) => (
                          <SidebarMenuItemClient
                            key={student.user_id}
                            student={student}
                          />
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}

                {/* Coach Jobs Section */}
                {coachJobs.length > 0 && (
                  <SidebarGroup className={students.length > 0 ? "mt-6" : ""}>
                    <div className="px-4 py-2">
                      <h4 className="text-sm font-semibold text-muted-foreground">
                        {t("programs")}
                      </h4>
                    </div>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {coachJobs.map((job) => (
                          <SidebarMenuItemClient
                            key={job.id}
                            job={job}
                            isCoachJob={true}
                          />
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}
              </>
            )}

            {/* STUDENT VIEW: Only show for non-coaches */}
            {!coachInfo.isCoach && (
              <>
                {/* Interview Prep Section - Student View */}
                {jobs.length > 0 && (
                  <SidebarGroup>
                    <div className="px-4 py-2">
                      <h4 className="text-sm font-semibold text-muted-foreground">
                        {isYorby ? t("programs") : t("interviewPrep")}
                      </h4>
                    </div>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {jobs.map((job) => (
                          <SidebarMenuItemClient key={job.id} job={job} />
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}

                {/* Interview Copilots Section - Student View */}
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
                          <SidebarMenuItemClient
                            key={copilot.id}
                            interviewCopilot={copilot}
                          />
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}

                {/* Resumes Section - Student View */}
                {resumes.length > 0 && (
                  <SidebarGroup className="mt-6">
                    <div className="px-4 py-2">
                      <h4 className="text-sm font-semibold text-muted-foreground">
                        {t("resumes")}
                      </h4>
                    </div>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {resumes.map((resume) => (
                          <SidebarMenuItemClient
                            key={resume.id}
                            resume={resume}
                          />
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}
              </>
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
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
        {!isYorby && isSubscriptionVariant && user && !hasSubscription && (
          <Link href="/purchase">
            <Button className="w-full">{t("unlockAllAccess")}</Button>
          </Link>
        )}
        {user && user.email && (
          <UserMenu
            email={user.email}
            hasSubscription={hasSubscription}
            isMemoriesEnabled={isMemoriesEnabled}
            referralsEnabled={referralsEnabled}
          />
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
