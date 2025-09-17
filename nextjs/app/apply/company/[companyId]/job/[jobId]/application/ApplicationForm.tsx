"use client";

import { useState, useActionState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Upload, CheckCircle2, Loader2, Plus, X, Copy } from "lucide-react";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/utils/supabase/database.types";
import { submitApplication } from "../actions";
import { Turnstile } from "@marsidev/react-turnstile";
import { isMobileDevice } from "@/utils/browser";
import Image from "next/image";

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

export function ApplicationForm({
  company,
  job,
  user,
  userFiles,
  companyId,
  jobId,
}: ApplicationFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [email, setEmail] = useState(user?.email || "");
  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [phoneNumber, setPhoneNumber] = useState(
    user?.user_metadata?.phone_number || ""
  );
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [additionalInfo, setAdditionalInfo] = useState<string[]>([]);
  const isMobile = isMobileDevice();
  const { logInfo } = useAxiomLogging();
  const t = useTranslations("apply");

  // Set up the application submission with useActionState
  const [state, formAction, isPending] = useActionState(submitApplication, {
    error: "",
  });

  useEffect(() => {
    if (state.error) {
      if (state.error == t("api.errors.appliedWithEmailOfExistingUser")) {
        setShowLoginDialog(true);
      } else {
        toast.error(state.error);
      }
    }
  }, [state.error]);

  const copyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("applicationForm.mobileWarning.copyUrlSuccess"));
      logInfo("URL copied to clipboard for mobile user");
    } catch (error) {
      toast.error("Failed to copy URL to clipboard");
      logInfo("Failed to copy URL to clipboard", { error });
    }
  };

  const allSelectedCount = selectedFiles.size + localFiles.length;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);

    // Check if adding these files would exceed the limit
    if (allSelectedCount + newFiles.length > 5) {
      toast.error(t("applicationForm.documentSelection.maxFilesError"));
      return;
    }

    // Add files to local state
    setLocalFiles((prev) => [...prev, ...newFiles]);

    logInfo("Files selected locally", { count: newFiles.length });
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        if (allSelectedCount >= 5) {
          toast.error(t("applicationForm.documentSelection.maxFilesError"));
          return prev;
        }
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const removeLocalFile = (index: number) => {
    setLocalFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("image")) return "🖼️";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    return "📎";
  };

  const addAdditionalInfo = () => {
    setAdditionalInfo([...additionalInfo, ""]);
  };

  const removeAdditionalInfo = (index: number) => {
    setAdditionalInfo(additionalInfo.filter((_, i) => i !== index));
  };

  const updateAdditionalInfo = (index: number, value: string) => {
    const newInfo = [...additionalInfo];
    newInfo[index] = value;
    setAdditionalInfo(newInfo);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isMobile ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("applicationForm.mobileWarning.title")}</CardTitle>
              <CardDescription>
                {t("applicationForm.mobileWarning.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center gap-4 my-8">
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Image
                    src="/assets/chrome.svg.png"
                    alt={t(
                      "applicationForm.mobileWarning.browserRecommendations.chrome"
                    )}
                    width={48}
                    height={48}
                    className="rounded"
                  />
                </div>
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Image
                    src="/assets/edge.svg.png"
                    alt={t(
                      "applicationForm.mobileWarning.browserRecommendations.edge"
                    )}
                    width={48}
                    height={48}
                    className="rounded"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t(
                      "applicationForm.mobileWarning.browserRecommendations.title"
                    )}
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      •{" "}
                      {t(
                        "applicationForm.mobileWarning.browserRecommendations.chrome"
                      )}
                    </li>
                    <li>
                      •{" "}
                      {t(
                        "applicationForm.mobileWarning.browserRecommendations.edge"
                      )}
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900 mb-3">
                    {t("applicationForm.mobileWarning.instructions")}
                  </p>
                  <Button
                    onClick={copyCurrentUrl}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {t("applicationForm.mobileWarning.copyUrlButton")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                    />
                    <label htmlFor="file-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {t("applicationForm.buttons.selectFiles")}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

                {/* Files list - both existing and local */}
                {(userFiles.length > 0 || localFiles.length > 0) && (
                  <div className="space-y-2">
                    <div className="grid gap-2">
                      {/* Previously uploaded files */}
                      {userFiles.map((file) => (
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

                      {/* Locally selected files */}
                      {localFiles.map((file, index) => (
                        <div
                          key={`local-${index}`}
                          className="flex items-center justify-between p-3 border border-green-500 bg-green-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">
                              {getFileIcon(file.type)}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {file.name}
                              </p>
                              <p className="text-xs text-green-600">
                                {t("applicationForm.fileItem.selected")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLocalFile(index)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {userFiles.length === 0 && localFiles.length === 0 && (
                  <p className="text-center text-sm text-gray-500 py-8">
                    {t("applicationForm.documentSelection.noDocuments")}
                  </p>
                )}

                {/* Selected files summary */}
                {allSelectedCount > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      {t(
                        "applicationForm.documentSelection.documentsSelected",
                        {
                          count: allSelectedCount,
                        }
                      )}
                    </p>
                  </div>
                )}

                {/* Additional Information Section */}
                <div className="space-y-4 pt-6 border-t">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {t("applicationForm.additionalInfo.title")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("applicationForm.additionalInfo.description")}
                    </p>
                  </div>

                  {/* Additional info items */}
                  <div className="space-y-3">
                    {additionalInfo.map((info, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          type="text"
                          placeholder={t(
                            "applicationForm.additionalInfo.placeholder"
                          )}
                          value={info}
                          onChange={(e) =>
                            updateAdditionalInfo(index, e.target.value)
                          }
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAdditionalInfo(index)}
                          className="px-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAdditionalInfo}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>
                        {t("applicationForm.additionalInfo.addButton")}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Submit form */}
                <form
                  action={(formData: FormData) => {
                    // Add local files to form data
                    localFiles.forEach((file, index) => {
                      formData.append(`localFile_${index}`, file);
                    });
                    formAction(formData);
                  }}
                >
                  <input type="hidden" name="companyId" value={companyId} />
                  <input type="hidden" name="jobId" value={jobId} />
                  <input
                    type="hidden"
                    name="selectedFileIds"
                    value={Array.from(selectedFiles).join(",")}
                  />
                  <input
                    type="hidden"
                    name="localFileCount"
                    value={localFiles.length}
                  />
                  <input
                    type="hidden"
                    name="additionalInfo"
                    value={JSON.stringify(
                      additionalInfo.filter((info) => info.trim())
                    )}
                  />
                  <input
                    type="hidden"
                    name="captchaToken"
                    value={captchaToken}
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
                  <div className="flex flex-col md:flex-row justify-between items-center pt-4">
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                      onSuccess={(token) => {
                        setCaptchaToken(token);
                      }}
                    />
                    <Button
                      type="submit"
                      disabled={
                        isPending ||
                        (!user?.email && (!email || !fullName)) ||
                        !captchaToken ||
                        (allSelectedCount === 0 &&
                          additionalInfo.filter((info) => info.trim())
                            .length === 0)
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
        )}
      </div>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("applicationForm.loginDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("applicationForm.loginDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Link
              href={`/sign-in?redirect=/apply/company/${companyId}/job/${jobId}/application`}
            >
              <Button>{t("applicationForm.loginDialog.signInButton")}</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
