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
import { PlusIcon } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { AuthModal } from "../auth/auth-modal";
import { UserMenu } from "../auth/user-menu";
import { useState } from "react";
import { User } from "@supabase/supabase-js";

interface AppSidebarProps {
  jobs: any[];
  user: User | null;
}

export function AppSidebar({ jobs, user }: AppSidebarProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const t = useTranslations("sidebar");

  return (
    <Sidebar>
      <SidebarHeader>
        <H3>Perfect Interview</H3>
        {user && (
          <Button>
            <Link
              href={`/dashboard/jobs?newJob=true`}
              className="flex items-center gap-2"
            >
              <p>{t("addJob")}</p>
              <PlusIcon />
            </Link>
          </Button>
        )}
      </SidebarHeader>
      <SidebarContent>
        {user ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {jobs.map((job) => (
                  <SidebarMenuItemClient key={job.id} job={job} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to start practicing for your interviews
            </p>
            <Button
              onClick={() => setIsAuthOpen(true)}
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 py-2">
          {user?.email ? <UserMenu email={user.email} /> : null}
        </div>
      </SidebarFooter>
      <AuthModal isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </Sidebar>
  );
}
