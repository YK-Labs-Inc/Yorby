"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { uploadFile } from "@/utils/storage";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useRouter } from "next/navigation";

interface EndInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoBlob: Blob;
  mockInterviewId: string;
  userId: string;
  accessToken: string;
  jobId: string;
}

export default function EndInterviewModal({
  isOpen,
  onClose,
  videoBlob,
  mockInterviewId,
  userId,
  accessToken,
  jobId,
}: EndInterviewModalProps) {
  const t = useTranslations("mockInterview.endModal");
  const errorT = useTranslations("errors");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { logError, logInfo } = useAxiomLogging();
  const router = useRouter();

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      const file = new File([videoBlob], `${mockInterviewId}.webm`, {
        type: "video/webm",
      });

      await uploadFile({
        bucketName: "mock_interviews",
        filePath: `${userId}/mockInterviews/${mockInterviewId}`,
        file,
        setProgress: setUploadProgress,
        onComplete: async () => {
          setIsUploading(false);
          setIsProcessing(true);
          await processInterview();
        },
        accessToken,
        logError,
        logInfo,
      });
    } catch (error: any) {
      logError("Error uploading interview recording", { error: error.message });
      setIsUploading(false);
    }
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

      router.push(
        `/dashboard/jobs/${jobId}/mockInterviews/${mockInterviewId}/review`
      );
    } catch (error: any) {
      logError("Error processing interview", { error: error.message });
      setIsProcessing(false);
      alert(errorT("pleaseTryAgain"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        {!isUploading && !isProcessing && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("confirmMessage")}
            </p>
          </div>
        )}
        {isUploading && (
          <div className="mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {t("uploading")} ({uploadProgress}%)
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        {isProcessing && (
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
        {!isUploading && !isProcessing && (
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose}>
              {t("cancelButton")}
            </Button>
            <Button onClick={handleUpload}>{t("confirmButton")}</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
