"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { usePathname } from "next/navigation";

export default function FooterWrapper({ locale }: { locale: string }) {
  const pathname = usePathname();
  const showFooter = pathname === `/${locale}` || pathname === "/";

  return (
    <main>
      {showFooter && (
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>© 2025 YK Labs. All rights reserved.</p>
          <ThemeSwitcher />
        </footer>
      )}
    </main>
  );
}
