"use client";

import { useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface TabSelectorProps {
  children: ReactNode[];
  locale: string;
}

export default function TabSelector({ children }: TabSelectorProps) {
  const t = useTranslations("StudentActivitySidebar");
  const pathname = usePathname();
  const isMockInterview = pathname?.includes("mockInterviews");
  const [selectedTab, setSelectedTab] = useState<"questions" | "mockInterviews">(
    isMockInterview ? "mockInterviews" : "questions"
  );

  return (
    <>
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setSelectedTab("questions")}
          aria-pressed={selectedTab === "questions"}
          className={`flex-1 p-3 text-sm text-center font-medium focus:outline-none focus:z-10 transition-colors
            ${
              selectedTab === "questions"
                ? "border-b-2 border-primary text-primary bg-primary/5"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
        >
          {t("questions")}
        </button>
        <button
          onClick={() => setSelectedTab("mockInterviews")}
          aria-pressed={selectedTab === "mockInterviews"}
          className={`flex-1 p-3 text-sm text-center font-medium focus:outline-none focus:z-10 transition-colors
            ${
              selectedTab === "mockInterviews"
                ? "border-b-2 border-primary text-primary bg-primary/5"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
        >
          {t("mockInterviews")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedTab === "questions" ? children[0] : children[1]}
      </div>
    </>
  );
}