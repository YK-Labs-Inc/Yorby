"use client";

import { useState } from "react";
import useSWRMutation from "swr/mutation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2 } from "lucide-react";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/utils/supabase/database.types";

type UserFile = Database["public"]["Tables"]["user_files"]["Row"];
type Company = Database["public"]["Tables"]["companies"]["Row"];
type Job = Database["public"]["Tables"]["custom_jobs"]["Row"];

interface ApplicationFormProps {
  company: Company;
  job: Job;
  user: User;
  userFiles: UserFile[];
  companyId: string;
  jobId: string;
}

// Fetcher function for file upload mutation
async function uploadFiles(url: string, { arg }: { arg: File[] }) {
  const formData = new FormData();
  for (const file of arg) {
    formData.append("files", file);
  }

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload files");
  }

  const result = await response.json();
  if (!result.success || !result.files || result.files.length === 0) {
    throw new Error(result.error || "Failed to upload files");
  }

  return result;
}

// Fetcher function for application submission mutation
async function submitApplication(
  url: string,
  { arg }: { arg: { companyId: string; jobId: string; selectedFileIds: string[] } }
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit application");
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to submit application");
  }

  return result;
}

export function ApplicationForm({
  company,
  job,
  user,
  userFiles,
  companyId,
  jobId,
}: ApplicationFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<UserFile[]>([]);
  const { logInfo, logError } = useAxiomLogging();
  const router = useRouter();

  // Set up the file upload mutation
  const { trigger: uploadFilesTrigger, isMutating: isUploading } = useSWRMutation(
    '/api/apply/upload',
    uploadFiles
  );

  // Set up the application submission mutation
  const { trigger: submitApplicationTrigger, isMutating: isSubmitting } = useSWRMutation(
    '/api/apply/submit',
    submitApplication
  );

  const allFiles = [...userFiles, ...uploadedFiles];

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const result = await uploadFilesTrigger(Array.from(files));

      // Update state with all uploaded files
      setUploadedFiles((prev) => [...prev, ...result.files]);

      // Add all file IDs to selected files
      const newFileIds = result.files.map((file: UserFile) => file.id);
      setSelectedFiles((prev) => {
        const newSet = new Set(prev);
        newFileIds.forEach((id: string) => newSet.add(id));
        return newSet;
      });

      // Show success message
      if (result.errors && result.errors.length > 0) {
        toast.warning(
          `Uploaded ${result.files.length} file(s) successfully. ${result.errors.length} file(s) failed.`
        );
        logInfo("Files uploaded with errors", {
          successCount: result.files.length,
          errorCount: result.errors.length,
          errors: result.errors,
        });
      } else {
        toast.success(`Successfully uploaded ${result.files.length} file(s)`);
        logInfo("Files uploaded", { count: result.files.length });
      }
    } catch (error) {
      logError("File upload error", { error });
      toast.error(
        error instanceof Error ? error.message : "Failed to upload files"
      );
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        if (newSet.size >= 5) {
          toast.error("You can select up to 5 files");
          return prev;
        }
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const handleSaveFiles = async () => {
    if (selectedFiles.size === 0) {
      toast.error("Please select at least one file");
      return;
    }

    try {
      const result = await submitApplicationTrigger({
        companyId,
        jobId,
        selectedFileIds: Array.from(selectedFiles),
      });

      logInfo("Application submitted", {
        candidateId: result.candidateId,
        fileCount: selectedFiles.size,
      });
      toast.success("Application submitted successfully!");
      router.push(
        `/apply/company/${companyId}/job/${jobId}/application/submitted`
      );
    } catch (error) {
      logError("Application submission error", { error });
      toast.error(
        error instanceof Error ? error.message : "Failed to submit application"
      );
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("image")) return "🖼️";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    return "📎";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Application Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Apply to {job.job_title}</CardTitle>
            <CardDescription>at {company.name}</CardDescription>
          </CardHeader>
        </Card>

        {/* Document Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Application Documents</CardTitle>
            <CardDescription>
              Choose up to 5 documents to include with your application. You can
              select from existing files or upload new ones. You can upload
              documents in PDF, TXT, PNG, or JPG.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload new files section */}
            <div className="flex items-center justify-between">
              <div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept=".pdf,.txt,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    className="cursor-pointer"
                    asChild
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? "Uploading..." : "Upload files"}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {/* Existing files list */}
            {allFiles.length > 0 && (
              <div className="space-y-2">
                <div className="grid gap-2">
                  {allFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => toggleFileSelection(file.id)}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedFiles.has(file.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {getFileIcon(file.mime_type)}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {file.display_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded{" "}
                            {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {selectedFiles.has(file.id) && (
                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allFiles.length === 0 && !isUploading && (
              <p className="text-center text-sm text-gray-500 py-8">
                No documents uploaded yet. Upload your resume and other
                documents to apply.
              </p>
            )}

            {/* Selected files summary */}
            {selectedFiles.size > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  {selectedFiles.size} document
                  {selectedFiles.size !== 1 ? "s" : ""} selected
                </p>
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveFiles}
                disabled={selectedFiles.size === 0 || isSubmitting}
                size="lg"
              >
                {isSubmitting
                  ? "Submitting Application..."
                  : "Submit Application"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
