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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Upload, CheckCircle2, Loader2, X, Copy } from "lucide-react";
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
export default function TempStempadApplicationForm({
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
  const [collegeMajor, setCollegeMajor] = useState("");
  const [contentExperience, setContentExperience] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [videoLink1, setVideoLink1] = useState("");
  const [videoLink2, setVideoLink2] = useState("");
  const [videoLink3, setVideoLink3] = useState("");
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
                      Additional Information
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Tell us more about yourself
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="collegeMajor">
                        Are you in college? If so, what's your major? *
                      </Label>
                      <Input
                        id="collegeMajor"
                        type="text"
                        value={collegeMajor}
                        onChange={(e) => setCollegeMajor(e.target.value)}
                        placeholder="e.g., Yes, Computer Science at UCLA"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Have you made content before? *</Label>
                      <RadioGroup
                        value={contentExperience}
                        onValueChange={setContentExperience}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id="content-yes" />
                          <Label
                            htmlFor="content-yes"
                            className="font-normal cursor-pointer"
                          >
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="No but I've always been interested in starting"
                            id="content-interested"
                          />
                          <Label
                            htmlFor="content-interested"
                            className="font-normal cursor-pointer"
                          >
                            No but I've always been interested in starting
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="No but I can"
                            id="content-can"
                          />
                          <Label
                            htmlFor="content-can"
                            className="font-normal cursor-pointer"
                          >
                            No but I can
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="No, content is not for me"
                            id="content-not-for-me"
                          />
                          <Label
                            htmlFor="content-not-for-me"
                            className="font-normal cursor-pointer"
                          >
                            No, content is not for me
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagramHandle">Instagram Link </Label>
                      <Input
                        id="instagramHandle"
                        type="text"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        placeholder="https://instagram.com/yourhandle"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tiktokHandle">TikTok Link</Label>
                      <Input
                        id="tiktokHandle"
                        type="text"
                        value={tiktokHandle}
                        onChange={(e) => setTiktokHandle(e.target.value)}
                        placeholder="https://tiktok.com/@yourhandle"
                      />
                    </div>
                  </div>
                </div>

                {/* Video Links Section */}
                <div className="space-y-4 pt-6 border-t">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Share a link to a video of you talking to the camera about
                      a topic. If not, do the optional assessment in the next
                      step.
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      e.g. TikTok, Instagram, YouTube, Google Drive, etc.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="videoLink1">Video Link 1</Label>
                      <Input
                        id="videoLink1"
                        type="url"
                        value={videoLink1}
                        onChange={(e) => setVideoLink1(e.target.value)}
                        placeholder="https://tiktok.com/@username/video/123..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="videoLink2">Video Link 2</Label>
                      <Input
                        id="videoLink2"
                        type="url"
                        value={videoLink2}
                        onChange={(e) => setVideoLink2(e.target.value)}
                        placeholder="https://instagram.com/p/abc123/"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="videoLink3">Video Link 3</Label>
                      <Input
                        id="videoLink3"
                        type="url"
                        value={videoLink3}
                        onChange={(e) => setVideoLink3(e.target.value)}
                        placeholder="https://drive.google.com/file/d/xyz/view"
                      />
                    </div>
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
                      [
                        collegeMajor && `College/Major: ${collegeMajor}`,
                        contentExperience &&
                          `Content Experience: ${contentExperience}`,
                        instagramHandle && `Instagram: ${instagramHandle}`,
                        tiktokHandle && `TikTok: ${tiktokHandle}`,
                        videoLink1 && `Video Link 1: ${videoLink1}`,
                        videoLink2 && `Video Link 2: ${videoLink2}`,
                        videoLink3 && `Video Link 3: ${videoLink3}`,
                      ].filter(Boolean)
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
                        !collegeMajor.trim() ||
                        !contentExperience
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
