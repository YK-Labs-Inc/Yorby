"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useRouter } from "next/navigation";
import { useMediaDevice } from "./MediaDeviceContext";

interface EndInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mockInterviewId: string;
  jobId: string;
  endInterview: () => void;
}

export default function EndInterviewModal({
  isOpen,
  onClose,
  mockInterviewId,
  jobId,
  endInterview,
}: EndInterviewModalProps) {
  const t = useTranslations("mockInterview.endModal");
  const errorT = useTranslations("errors");
  const [isProcessing, setIsProcessing] = useState(false);
  const { logError } = useAxiomLogging();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const { isProcessing: isProcessingRecording } = useMediaDevice();

  const handleEndInterview = async () => {
    endInterview();
    setIsProcessing(true);
    await processInterview();
  };

  const processInterview = async () => {
    try {
      const response = await fetch("/api/mockInterviews/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mockInterviewId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process interview");
      }

      setShouldRedirect(true);
    } catch (error: any) {
      logError("Error processing interview", { error: error.message });
      setIsProcessing(false);
      alert(errorT("pleaseTryAgain"));
    }
  };

  useEffect(() => {
    if (shouldRedirect && !isProcessingRecording) {
      router.push(
        `/dashboard/jobs/${jobId}/mockInterviews/${mockInterviewId}/review`
      );
    }
  }, [shouldRedirect, isProcessingRecording, jobId, mockInterviewId, router]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        {!isProcessing && !isProcessingRecording && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("confirmMessage")}
            </p>
          </div>
        )}
        {(isProcessing || isProcessingRecording) && (
          <div className="mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("processing")}
            </div>
            <div className="flex gap-2 items-center mt-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100" />
              <span className="text-sm">{t("processingMessage")}</span>
            </div>
            <span className="text-sm">{t("emailAlert")}</span>
          </div>
        )}
        {!isProcessing && !isProcessingRecording && (
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose}>
              {t("cancelButton")}
            </Button>
            <Button onClick={handleEndInterview}>{t("confirmButton")}</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
