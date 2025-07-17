"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";
import { Settings, Home } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { handleSignOut } from "../auth/actions";
import { useTranslations } from "next-intl";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";

interface RecruitingAppSidebarProps {
  user: User | null;
}

export function RecruitingAppSidebar({ user }: RecruitingAppSidebarProps) {
  const t = useTranslations("userMenu");
  const recruitingSidebarT = useTranslations("recruitingSidebar");
  const posthog = usePostHog();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center px-4 py-2">
          <h2 className="text-xl font-bold">Yorby</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/recruiting">
                    <Home className="h-4 w-4" />
                    <span>{recruitingSidebarT("home")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {user && user.email && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 w-full justify-between"
              >
                <span className="truncate">{user.email}</span>
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-full">
              <form
                action={(data) => {
                  handleSignOut(data);
                  posthog.reset();
                }}
              >
                <DropdownMenuItem asChild>
                  <Button variant="ghost" className="w-full" type="submit">
                    {t("signOut")}
                  </Button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
