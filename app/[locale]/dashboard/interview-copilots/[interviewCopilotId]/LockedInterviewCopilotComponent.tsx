"use client";

import { useState, useEffect, useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Pencil, Trash2, FileText } from "lucide-react";
import { Tables } from "@/utils/supabase/database.types";
import { useTranslations } from "next-intl";
import { unlockInterviewCopilot } from "./actions";
import { cn } from "@/lib/utils";
import { INTERVIEW_COPILOT_REQUIRED_CREDITS } from "@/app/constants/interview_copilots";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import React from "react";
import { AIButton } from "@/components/ai-button";
import { FormMessage } from "@/components/form-message";

interface LockedInterviewCopilotComponentProps {
  interviewCopilot: Tables<"interview_copilots"> & {
    interview_copilot_files: Tables<"interview_copilot_files">[];
  };
  userCredits: number;
}

export default function LockedInterviewCopilotComponent({
  interviewCopilot,
  userCredits,
}: LockedInterviewCopilotComponentProps) {
  const t = useTranslations("interviewCopilots");
  const [state, action, pending] = useActionState(unlockInterviewCopilot, null);
  const [showDialog, setShowDialog] = React.useState(false);

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("locked.insufficientCredits.title")}</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              {t("locked.insufficientCredits.description")}
              <br />
              <br />
              {t("locked.creditCost", {
                credits: INTERVIEW_COPILOT_REQUIRED_CREDITS,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button onClick={() => setShowDialog(false)} variant="outline">
              {t("locked.cancel")}
            </Button>
            <Button asChild>
              <a href="/purchase">{t("locked.insufficientCredits.button")}</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header with Title and Unlock Button */}
      <div className="flex-col md:flex-row flex items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            {interviewCopilot.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {userCredits > 0 ? (
            <form action={action}>
              <input
                type="hidden"
                name="interviewCopilotId"
                value={interviewCopilot.id}
              />
              <input type="hidden" name="numberOfCredits" value={userCredits} />
              <AIButton
                type="submit"
                pending={pending}
                pendingText={t("locked.unlocking")}
              >
                {t("locked.button")}
              </AIButton>
              {state?.error && <FormMessage message={{ error: state.error }} />}
            </form>
          ) : (
            <AIButton
              onClick={() => setShowDialog(true)}
              pendingText={t("locked.unlocking")}
              pending={pending}
            >
              {t("locked.button")}
            </AIButton>
          )}
        </div>
      </div>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t("jobDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{t("jobTitle.label")}</h3>
            <p
              className={cn(
                "text-muted-foreground",
                !interviewCopilot.job_title && "italic"
              )}
            >
              {interviewCopilot.job_title || t("jobTitle.empty")}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">{t("jobDescription.label")}</h3>
            <p
              className={cn(
                "text-muted-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto pr-2",
                !interviewCopilot.job_description && "italic"
              )}
            >
              {interviewCopilot.job_description || t("jobDescription.empty")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t("companyDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{t("companyName.label")}</h3>
            <p
              className={cn(
                "text-muted-foreground",
                !interviewCopilot.company_name && "italic"
              )}
            >
              {interviewCopilot.company_name || t("companyName.empty")}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">
              {t("companyDescription.label")}
            </h3>
            <p
              className={cn(
                "text-muted-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto pr-2",
                !interviewCopilot.company_description && "italic"
              )}
            >
              {interviewCopilot.company_description ||
                t("companyDescription.empty")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>{t("documents.label")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {interviewCopilot.interview_copilot_files.length > 0 ? (
              interviewCopilot.interview_copilot_files.map((file) => (
                <div key={file.id}>
                  <div className="flex items-center justify-between p-2 rounded-md border">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{file.file_path.split("/").pop()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm italic">
                {t("documents.empty")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
