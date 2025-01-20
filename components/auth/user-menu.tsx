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
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { ThemeSwitcher } from "../theme-switcher";
import { useTransition } from "react";
import { redirectToStripeCustomerPortal } from "@/app/[locale]/purchase/actions";

interface UserMenuProps {
  email: string;
  hasSubscription: boolean;
}

export function UserMenu({ email, hasSubscription }: UserMenuProps) {
  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.reload();
  };
  const [_, startTransition] = useTransition();

  const handleManageSubscription = () => {
    startTransition(async () => {
      await redirectToStripeCustomerPortal();
    });
  };

  return (
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
      <DropdownMenuContent align="end" className="w-48">
        {hasSubscription && (
          <>
            <DropdownMenuItem onSelect={handleManageSubscription}>
              Manage Subscription
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm">Appearance</span>
          <ThemeSwitcher />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
