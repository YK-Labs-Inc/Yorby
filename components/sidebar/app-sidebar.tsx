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
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";

interface AppSidebarProps {
  numberOfCredits: number;
  jobs: any[];
  user: User | null;
  hasSubscription: boolean;
}

export function AppSidebar({
  jobs,
  numberOfCredits,
  hasSubscription,
  user,
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
        <Link href="/" className="flex items-center">
          <img src={logoSrc} alt="Perfect Interview" className="w-8 h-8 mr-2" />
          <H3>Perfect Interview</H3>
        </Link>
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
        {user && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {jobs.map((job) => (
                  <SidebarMenuItemClient key={job.id} job={job} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
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
        {user?.email ? (
          <UserMenu email={user.email} hasSubscription={hasSubscription} />
        ) : null}
        {!user && (
          <div>
            <p className="text-sm text-muted-foreground mb-4 text-center w-full">
              {t("signInToStart")}
            </p>
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
