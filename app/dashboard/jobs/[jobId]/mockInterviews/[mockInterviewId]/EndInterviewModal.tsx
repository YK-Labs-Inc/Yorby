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
  const { logError } = useAxiomLogging();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const { isProcessing: isProcessingRecording } = useMediaDevice();

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
        logError("Error processing interview: API error", { mockInterviewId, status: response.status });
        setProcessingError(t("processErrorRetryMessage"));
        setIsProcessing(false);
        return;
      }

      setShouldRedirect(true);
    } catch (error: any) {
      logError("Error processing interview: Network/general error", { mockInterviewId, error: error.message });
      setProcessingError(t("processErrorRetryMessage"));
      setIsProcessing(false);
    }
  };

  const handleEndInterview = async () => {
    endInterview();
    setProcessingError(null); // Clear previous errors
    setIsProcessing(true);
    await processInterview();
  };

  const handleRetry = async () => {
    setProcessingError(null); // Clear error message
    setIsProcessing(true); // Show processing indicator
    await processInterview();
  };

  useEffect(() => {
    if (shouldRedirect && !isProcessingRecording && !processingError) {
      router.push(
        `/dashboard/jobs/${jobId}/mockInterviews/${mockInterviewId}/review`
      );
    }
  }, [shouldRedirect, isProcessingRecording, jobId, mockInterviewId, router, processingError]);

  // Reset error state when modal is closed/reopened
  useEffect(() => {
    if (!isOpen) {
      setProcessingError(null);
      setIsProcessing(false); // Also reset processing if modal is closed externally
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        {processingError && !isProcessing && !isProcessingRecording ? (
          // Error occurred
          <div className="mt-4 space-y-4">
            <p className="text-sm text-red-500 dark:text-red-400">
              {processingError}
            </p>
            <DialogFooter className="mt-0">
              <Button variant="outline" onClick={onClose}>
                {t("cancelButton")}
              </Button>
              <Button onClick={handleRetry}>{t("retryButton")}</Button>
            </DialogFooter>
          </div>
        ) : (isProcessing || isProcessingRecording) ? (
          // Processing (API or media)
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
        ) : (
          // Initial state
          <>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("confirmMessage")}
              </p>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={onClose}>
                {t("cancelButton")}
              </Button>
              <Button onClick={handleEndInterview}>{t("confirmButton")}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
