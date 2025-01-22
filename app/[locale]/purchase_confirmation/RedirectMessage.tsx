"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface RedirectMessageProps {
  success: boolean;
  redirectPath: string;
}

export default function RedirectMessage({
  success,
  redirectPath,
}: RedirectMessageProps) {
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();
  const t = useTranslations("purchase");

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(redirectPath);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, redirectPath]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold mb-4">
          {success ? t("purchase_success") : t("purchase_failed")}
        </h1>
        <p className="text-gray-600">
          {success
            ? t("redirect_success_message", { seconds: countdown })
            : t("redirect_error_message", { seconds: countdown })}
        </p>
      </div>
    </div>
  );
}
