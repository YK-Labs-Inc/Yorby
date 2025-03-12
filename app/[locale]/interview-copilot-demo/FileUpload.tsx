import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { UploadResponse } from "@/utils/types";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function FileUpload({
  setUploadResponse,
}: {
  setUploadResponse: (uploadResponse: UploadResponse) => void;
}) {
  const t = useTranslations("interviewCopilotDemo.fileUpload");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateFile = (file: File): boolean => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      return false;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("File size must be less than 4MB");
      return false;
    }

    return true;
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/interview-copilot-demo/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        alert("Failed to upload file");
        return;
      }

      const data = (await response.json()) as {
        uploadResponse: UploadResponse;
      };

      setUploadResponse(data.uploadResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
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

  return (
    <div className="w-full h-full max-w-2xl mx-auto p-6 flex flex-col items-center justify-center">
      <div className="space-y-4">
        {isUploading ? (
          <div className="flex flex-col items-center space-y-4 p-8 border-2 border-gray-300 rounded-lg">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600">{t("uploading")}</p>
          </div>
        ) : (
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
              onClick={handleFileUpload}
              disabled={!selectedFile}
            >
              {t("button")}
            </Button>
          </div>
        )}
        {error && <FormMessage message={{ error }} />}
      </div>
    </div>
  );
}
