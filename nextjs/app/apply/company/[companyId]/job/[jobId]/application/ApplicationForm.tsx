"use client";

import { useState, useActionState, useEffect } from "react";
import useSWRMutation from "swr/mutation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle2, Loader2 } from "lucide-react";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/utils/supabase/database.types";
import { submitApplication } from "../actions";

type UserFile = Database["public"]["Tables"]["user_files"]["Row"];
type Company = Database["public"]["Tables"]["companies"]["Row"];
type Job = Database["public"]["Tables"]["custom_jobs"]["Row"];

interface ApplicationFormProps {
  company: Company;
  job: Job;
  user: User | null;
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
  const [email, setEmail] = useState(user?.email || "");
  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [phoneNumber, setPhoneNumber] = useState(
    user?.user_metadata?.phone_number || ""
  );
  const { logInfo, logError } = useAxiomLogging();
  const t = useTranslations("apply");

  // Set up the file upload mutation
  const { trigger: uploadFilesTrigger, isMutating: isUploading } =
    useSWRMutation("/api/apply/upload", uploadFiles);

  // Set up the application submission with useActionState
  const [state, formAction, isPending] = useActionState(submitApplication, {
    error: "",
  });

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

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
          t("applicationForm.success.filesUploadedWithErrors", {
            successCount: result.files.length,
            errorCount: result.errors.length,
          })
        );
        logInfo("Files uploaded with errors", {
          successCount: result.files.length,
          errorCount: result.errors.length,
          errors: result.errors,
        });
      } else {
        toast.success(
          t("applicationForm.success.filesUploaded", {
            count: result.files.length,
          })
        );
        logInfo("Files uploaded", { count: result.files.length });
      }
    } catch (error) {
      logError("File upload error", { error });
      toast.error(
        error instanceof Error
          ? error.message
          : t("applicationForm.errors.uploadFiles")
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
          toast.error(t("applicationForm.documentSelection.maxFilesError"));
          return prev;
        }
        newSet.add(fileId);
      }
      return newSet;
    });
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
        <Card>
          <CardHeader>
            <CardTitle>
              {t("applicationForm.title", { jobTitle: job.job_title })}
            </CardTitle>
            <CardDescription>
              {t("applicationForm.subtitle", { companyName: company.name })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Information Section */}
            {!user?.email && (
              <div className="space-y-4 pb-6 border-b">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    {t("applicationForm.userInfo.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("applicationForm.userInfo.description")}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {t("applicationForm.userInfo.emailLabel")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t(
                        "applicationForm.userInfo.emailPlaceholder"
                      )}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      {t("applicationForm.userInfo.fullNameLabel")}
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t(
                        "applicationForm.userInfo.fullNamePlaceholder"
                      )}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">
                      {t("applicationForm.userInfo.phoneLabel")}
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={t(
                        "applicationForm.userInfo.phonePlaceholder"
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Document Selection Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {t("applicationForm.documentSelection.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("applicationForm.documentSelection.description")}
                </p>
              </div>

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
                        {isUploading
                          ? t("applicationForm.buttons.uploading")
                          : t("applicationForm.buttons.uploadFiles")}
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
                              {t("applicationForm.fileItem.uploaded")}{" "}
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
                  {t("applicationForm.documentSelection.noDocuments")}
                </p>
              )}

              {/* Selected files summary */}
              {selectedFiles.size > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    {t("applicationForm.documentSelection.documentsSelected", {
                      count: selectedFiles.size,
                    })}
                  </p>
                </div>
              )}

              {/* Submit form */}
              <form action={formAction}>
                <input type="hidden" name="companyId" value={companyId} />
                <input type="hidden" name="jobId" value={jobId} />
                <input
                  type="hidden"
                  name="selectedFileIds"
                  value={Array.from(selectedFiles)}
                />
                {!user?.email && (
                  <>
                    <input type="hidden" name="email" value={email} />
                    <input type="hidden" name="fullName" value={fullName} />
                    <input
                      type="hidden"
                      name="phoneNumber"
                      value={phoneNumber}
                    />
                  </>
                )}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={
                      isPending || (!user?.email && (!email || !fullName))
                    }
                    size="lg"
                  >
                    {isPending ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("applicationForm.buttons.submittingApplication")}
                      </div>
                    ) : (
                      t("applicationForm.buttons.submit")
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
