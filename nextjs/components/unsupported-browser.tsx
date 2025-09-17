"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  isSupportedBrowser,
  getBrowserName,
  isMobileDevice,
} from "@/utils/browser";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import Image from "next/image";

export const UnsupportedBrowser = () => {
  const [isSupported, setIsSupported] = useState(true);
  const [browserName, setBrowserName] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("unsupportedBrowser");

  useEffect(() => {
    const supported = isSupportedBrowser();
    const name = getBrowserName();
    const mobile = isMobileDevice();
    setIsSupported(supported);
    setBrowserName(name);
    setIsMobile(mobile);
  }, []);

  const shouldShowWarning = () => {
    if (isSupported) return false;

    const candidateInterviewPattern =
      /\/apply\/company\/[^\/]+\/job\/[^\/]+\/candidate-interview\//;

    return (
      pathname.startsWith("/dashboard") ||
      candidateInterviewPattern.test(pathname)
    );
  };

  if (!shouldShowWarning()) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            {isMobile ? t("mobileTitle") : t("title")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isMobile
              ? t("mobileDescription")
              : t("description", { browserName })}
          </p>
        </div>

        <div className="flex justify-center gap-4 my-8">
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
            <Image
              src="/assets/edge.svg.png"
              alt="Microsoft Edge"
              width={48}
              height={48}
              className="rounded"
            />
          </div>
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
            <Image
              src="/assets/chrome.svg.png"
              alt="Google Chrome"
              width={48}
              height={48}
              className="rounded"
            />
          </div>
        </div>

        {!isMobile && (
          <div className="space-y-4">
            <Button
              onClick={() =>
                window.open("https://www.google.com/chrome/", "_blank")
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
            >
              {t("downloadChrome")}
            </Button>

            <div className="text-sm text-muted-foreground">
              {t("or")}{" "}
              <button
                onClick={() =>
                  window.open("https://www.microsoft.com/edge", "_blank")
                }
                className="text-primary hover:underline"
              >
                {t("downloadEdge")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
