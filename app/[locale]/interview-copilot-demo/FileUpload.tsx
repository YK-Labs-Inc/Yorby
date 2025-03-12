import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { UploadResponse } from "@/utils/types";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

export default function FileUpload({
  setUploadResponse,
}: {
  setUploadResponse: (uploadResponse: UploadResponse) => void;
}) {
  const t = useTranslations("interviewCopilotDemo.fileUpload");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const validateFile = (file: File): boolean => {
    if (file.type !== "application/pdf") {
      setError(t("errors.pdfOnly"));
      return false;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError(t("errors.fileSize"));
      return false;
    }

    return true;
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/interview-copilot-demo/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        setError(t("errors.uploadFailed"));
        return;
      }

      const data = (await response.json()) as {
        uploadResponse: UploadResponse;
      };

      setUploadResponse(data.uploadResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (file) {
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleDemoUpload = async () => {
    try {
      const response = await fetch("/assets/demo-resume.pdf");
      const blob = await response.blob();
      const file = new File([blob], "demo-resume.pdf", {
        type: "application/pdf",
      });
      await handleFileUpload(file);
    } catch (err) {
      setError(t("errors.demoFailed"));
    }
  };

  return (
    <div className="w-full h-full max-w-2xl mx-auto p-6 flex flex-col items-center justify-center">
      <div className="space-y-4 w-full">
        {isUploading ? (
          <div className="flex flex-col items-center space-y-4 p-8 border-2 border-gray-300 rounded-lg">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600">{t("uploading")}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-lg font-medium">{t("title")}</p>
                <p className="text-sm text-gray-500">{t("description")}</p>
              </div>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileInput}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500">{t("helper")}</p>
              <Button
                className="w-full"
                onClick={() => selectedFile && handleFileUpload(selectedFile)}
                disabled={!selectedFile}
              >
                {t("button")}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500 bg-white">or</span>
              </div>
            </div>

            <div className="text-center">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDemoUpload}
                >
                  {t("demoButton")}
                </Button>
                <button
                  onClick={() => setShowPreview(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  {t("previewButton")}
                </button>
                <p className="text-xs text-gray-500">{t("demoHelper")}</p>
              </div>
            </div>
          </div>
        )}
        {error && <FormMessage message={{ error }} />}
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl w-full h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between w-full">
              <DialogTitle>{t("previewModal.title")}</DialogTitle>
              <DialogClose className="w-6 h-6 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2">
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="flex-1 w-full h-[calc(90vh-4rem)] bg-gray-100">
            <object
              data="/assets/demo-resume.pdf"
              type="application/pdf"
              className="w-full h-full"
            >
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">
                  {t("previewModal.fallback")}{" "}
                  <a
                    href="/assets/demo-resume.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {t("previewModal.openInNewTab")}
                  </a>
                </p>
              </div>
            </object>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
