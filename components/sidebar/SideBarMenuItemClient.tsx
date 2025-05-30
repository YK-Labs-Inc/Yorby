"use client";

import { SidebarMenuButton } from "../ui/sidebar";

import { usePathname } from "next/navigation";
import { SidebarMenuItem } from "../ui/sidebar";
import { Tables } from "@/utils/supabase/database.types";
import { StudentWithEmailAndName } from "@/app/layout";
import Link from "next/link";

type SidebarMenuItemClientProps =
  | {
      job: Tables<"custom_jobs">;
      isCoachJob?: boolean;
      resume?: never;
      student?: never;
      interviewCopilot?: never;
    }
  | {
      job?: never;
      isCoachJob?: never;
      resume: Tables<"resumes">;
      student?: never;
      interviewCopilot?: never;
    }
  | {
      job?: never;
      isCoachJob?: never;
      resume?: never;
      student: StudentWithEmailAndName;
      interviewCopilot?: never;
    }
  | {
      job?: never;
      isCoachJob?: never;
      resume?: never;
      student?: never;
      interviewCopilot: Tables<"interview_copilots">;
    };

const SidebarMenuItemClient = ({
  job,
  isCoachJob,
  resume,
  student,
  interviewCopilot,
}: SidebarMenuItemClientProps) => {
  const pathname = usePathname();
  const createUrlPath = (): string => {
    if (job) {
      if (isCoachJob) {
        return `/dashboard/coach-admin/programs/${job.id}`;
      }
      return `/dashboard/jobs/${job.id}`;
    }
    if (resume) {
      return `/dashboard/resumes/${resume.id}`;
    }
    if (student) {
      return `/dashboard/coach-admin/students/${student.user_id}`;
    }
    if (interviewCopilot) {
      return `/dashboard/interview-copilots/${interviewCopilot.id}`;
    }
    return "#";
  };

  const constructEntityLabel = () => {
    if (job) {
      return job.job_title;
    }
    if (resume) {
      return resume.title;
    }
    if (student) {
      return student.name ? student.name : student.email;
    }
    if (interviewCopilot) {
      return interviewCopilot.title;
    }
    throw new Error("No entity provided");
  };

  const constructEntityId = () => {
    if (job) {
      return job.id;
    }
    if (resume) {
      return resume.id;
    }
    if (student) {
      return student.user_id;
    }
    if (interviewCopilot) {
      return interviewCopilot.id;
    }
    throw new Error("No entity provided");
  };

  return (
    <SidebarMenuItem key={constructEntityId()}>
      <SidebarMenuButton asChild>
        <Link
          href={createUrlPath()}
          className={`flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors ${
            pathname?.includes(constructEntityId())
              ? "bg-sidebar-accent font-medium border border-sidebar-border shadow-sm"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          }`}
        >
          <span>{constructEntityLabel()}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export default SidebarMenuItemClient;
