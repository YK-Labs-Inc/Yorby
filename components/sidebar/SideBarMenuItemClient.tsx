"use client";

import { SidebarMenuButton } from "../ui/sidebar";

import { usePathname } from "next/navigation";
import { SidebarMenuItem } from "../ui/sidebar";
import { Link } from "@/i18n/routing";

const SidebarMenuItemClient = ({ job }: { job: any }) => {
  const pathname = usePathname();

  return (
    <SidebarMenuItem key={job.id}>
      <SidebarMenuButton asChild>
        <Link
          className={`flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors ${
            pathname.includes(job.id)
              ? "bg-sidebar-accent font-medium border border-sidebar-border shadow-sm"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          }`}
          href={`/dashboard/jobs/${job.id}`}
        >
          <span>{job.job_title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export default SidebarMenuItemClient;
