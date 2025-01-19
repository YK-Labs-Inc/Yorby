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

      <div className="relative mt-4 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800 p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
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
              <input type="hidden" name="numberOfCredits" value={userCredits} />
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
    </>
  );
}
