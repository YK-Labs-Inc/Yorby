"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { unlockJob } from "./actions";
import { useActionState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
}: {
  jobId: string;
  userCredits: number;
}) {
  const t = useTranslations("upgrade");
  const [state, action, pending] = useActionState(unlockJob, null);
  const [showDialog, setShowDialog] = React.useState(false);

  useEffect(() => {
    if (state?.error) {
      alert(state.error);
    }
  }, [state]);

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Need More Credits</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              {t("locked.insufficientCredits")}
              <br />
              <br />
              {t("locked.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Link href="/purchase">
              <Button size="lg">{t("locked.title")}</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {t("locked.title")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              {t("locked.description")}
            </p>
            {userCredits > 0 ? (
              <form action={action}>
                <input type="hidden" name="jobId" value={jobId} />
                <input
                  type="hidden"
                  name="numberOfCredits"
                  value={userCredits}
                />
                <Button size="lg" className="mt-2" type="submit">
                  {pending ? t("locked.unlocking") : t("locked.button")}
                </Button>
              </form>
            ) : (
              <Button
                size="lg"
                className="mt-2"
                onClick={() => setShowDialog(true)}
              >
                {t("locked.button")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
