"use client";

import React, { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { updateQuestionPublicationStatus } from "../[programId]/actions"; // Path to the new actions
import { useToast } from "@/hooks/use-toast";
import { Logger } from "next-axiom";
import { useTranslations } from "next-intl";

interface QuestionStatusToggleProps {
  questionId: string;
  programId: string;
  initialStatus: "published" | "draft";
}

export default function QuestionStatusToggle({
  questionId,
  programId,
  initialStatus,
}: QuestionStatusToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const { toast } = useToast();
  const t = useTranslations("coachAdminPortal.programsPage.programDetailPage");
  const errorsT = useTranslations("errors");
  const logger = new Logger();

  const handleToggleChange = async (checked: boolean) => {
    startTransition(async () => {
      const newStatus = checked ? "published" : "draft";
      try {
        const result = await updateQuestionPublicationStatus(
          questionId,
          programId,
          newStatus
        );
        if (result.success) {
          setCurrentStatus(newStatus);
          toast({
            title: t("toast.statusUpdateSuccess.title"),
            description: t("toast.statusUpdateSuccess.description", {
              status: newStatus,
            }),
          });
          logger.info(`Question ${questionId} status changed to ${newStatus}`);
        } else {
          toast({
            variant: "destructive",
            title: errorsT("pleaseTryAgain"),
          });
          logger.error(`Failed to change question ${questionId} status`, {
            error: result.message,
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: errorsT("pleaseTryAgain"),
        });
        logger.error(`Error toggling question ${questionId} status`, { error });
      }
      await logger.flush();
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={`status-toggle-${questionId}`}
        checked={currentStatus === "published"}
        onCheckedChange={handleToggleChange}
        disabled={isPending}
        aria-label={
          currentStatus === "published"
            ? t("ariaLabel.unpublishQuestion")
            : t("ariaLabel.publishQuestion")
        }
      />
      <Badge variant={currentStatus === "published" ? "default" : "secondary"}>
        {currentStatus === "published"
          ? t("status.published")
          : t("status.draft")}
      </Badge>
    </div>
  );
}
