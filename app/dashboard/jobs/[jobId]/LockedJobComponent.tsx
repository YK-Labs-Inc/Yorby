"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React from "react";

const mockQuestions = [
  "Tell me about a challenging project you worked on",
  "How do you handle conflicts in a team?",
  "What's your approach to problem-solving?",
  "Describe a situation where you demonstrated leadership",
  "How do you stay updated with industry trends?",
  "Tell me about a challenging project you worked on",
  "How do you handle conflicts in a team?",
  "What's your approach to problem-solving?",
  "Describe a situation where you demonstrated leadership",
  "How do you stay updated with industry trends?",
  "Oh you're reading the mock questions? Well done trying to inspect this",
  "You're probably looking for some coupon code of some sort...",
  "Alright. Fine. Use code HACKER for 15% off your purchase.",
];

export default function LockedJobComponent({
  jobId,
  userCredits,
  view = "practice",
}: {
  jobId: string;
  userCredits: number;
  view: "practice" | "mock";
}) {
  const t = useTranslations("upgrade");

  return (
    <>
      <div className="relative mt-4">
        {/* Blurred mock questions in the background */}
        <div className="absolute inset-0 w-full">
          <div className="flex flex-col gap-4 w-full blur-[8px] opacity-50">
            {mockQuestions.map((question, index) => (
              <div
                key={index}
                className={`rounded p-4 transition-colors flex items-center gap-3
                  ${
                    index % 2 === 0
                      ? "bg-gray-100 dark:bg-gray-800/20"
                      : "bg-white dark:bg-gray-800/10"
                  }`}
              >
                <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">
                  {(index + 2).toString().padStart(2, "0")}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-200">
                  {question}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Locked overlay */}
        <div className="relative rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800 p-8 bg-transparent h-[75vh]">
          <div className="flex flex-col items-center justify-center gap-4 text-center h-full">
            <div className="rounded-full bg-gray-100 dark:bg-gray-800/30 p-3">
              <Lock className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t("locked.subscriptionTitle")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              {t(
                view === "mock"
                  ? "locked.mockDescription"
                  : "locked.description"
              )}
            </p>
            <Link href="/purchase">
              <Button size="lg" className="mt-2">
                {t("locked.button")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
