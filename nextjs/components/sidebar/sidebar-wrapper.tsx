"use client";

import { useMultiTenant } from "@/app/context/MultiTenantContext";
import { AppSidebar } from "./app-sidebar";
import { RecruitingAppSidebar } from "./recruiting-app-sidebar";
import { User } from "@supabase/supabase-js";
import { Tables } from "@/utils/supabase/database.types";
import { CoachInfo, StudentWithEmailAndName } from "@/app/layout";

interface SidebarWrapperProps {
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

export function SidebarWrapper(props: SidebarWrapperProps) {
  const { isYorbyRecruiting } = useMultiTenant();

  if (isYorbyRecruiting) {
    return <RecruitingAppSidebar user={props.user} />;
  }

  return <AppSidebar {...props} />;
}