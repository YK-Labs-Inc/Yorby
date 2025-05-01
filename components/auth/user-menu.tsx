"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";
import { Button } from "../ui/button";
import { useTransition, useState } from "react";
import { redirectToStripeCustomerPortal } from "@/app/[locale]/purchase/actions";
import { handleSignOut } from "./actions";
import { useTranslations } from "next-intl";
import { usePostHog } from "posthog-js/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePathname, useRouter } from "next/navigation";

interface UserMenuProps {
  email: string;
  hasSubscription: boolean;
  isMemoriesEnabled: boolean;
  referralsEnabled: boolean;
}

export function UserMenu({
  email,
  hasSubscription,
  isMemoriesEnabled,
  referralsEnabled,
}: UserMenuProps) {
  const [_, startTransition] = useTransition();
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const t = useTranslations("userMenu");
  const posthog = usePostHog();
  const router = useRouter();
  const pathname = usePathname();

  const handleManageSubscription = () => {
    if (!pathname) {
      return;
    }
    startTransition(async () => {
      await redirectToStripeCustomerPortal(pathname);
    });
  };

  const handleMemoriesClick = () => {
    router.push("/memories");
  };

  const handleReferralsClick = () => {
    router.push("/referrals");
  };

  return (
    <>
      <Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("support")}</DialogTitle>
          </DialogHeader>
          <span>
            {t("supportMessageIntro")}{" "}
            <a
              href="mailto:support@yklabs.io"
              className="text-primary underline"
            >
              support@yklabs.io
            </a>
          </span>
          <span>{t("supportMessageConclusion")}</span>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 w-full justify-between"
          >
            <span className="truncate">{email}</span>
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-full">
          <DropdownMenuItem
            onSelect={() => setShowSupportDialog(true)}
            className="justify-center"
          >
            {t("support")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {referralsEnabled && (
            <DropdownMenuItem
              onSelect={handleReferralsClick}
              className="justify-center"
            >
              {t("referrals")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {isMemoriesEnabled && (
            <DropdownMenuItem
              onSelect={handleMemoriesClick}
              className="justify-center"
            >
              {t("memories")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {hasSubscription && (
            <>
              <DropdownMenuItem onSelect={handleManageSubscription}>
                {t("manageSubscription")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
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
    </>
  );
}
