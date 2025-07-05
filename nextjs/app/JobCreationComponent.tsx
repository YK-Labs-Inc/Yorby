"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { H1 } from "@/components/typography";
import { createJob } from "./landing2/actions";
import { useTranslations } from "next-intl";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FormData {
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  companyDescription: string;
  resume: File | null;
  coverLetter: File | null;
  miscDocuments: File[];
  captchaToken: string;
}

interface Props {
  showOnboarding?: boolean;
}

export default function JobCreationComponent({
  showOnboarding = false,
}: Props) {
  const t = useTranslations("jobCreation");
  const [error, setError] = useState<string>("");
  const [showOnboardingDialog, setShowOnboardingDialog] =
    useState(showOnboarding);
  const [formData, setFormData] = useState<FormData>({
    jobTitle: "",
    jobDescription: "",
    companyName: "",
    companyDescription: "",
    resume: null,
    coverLetter: null,
    miscDocuments: [],
    captchaToken: "",
  });
  const [isPending, startTransition] = useTransition();
  const { logError } = useAxiomLogging();
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const coverLetterInputRef = useRef<HTMLInputElement>(null);
  const miscDocsInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleFileChange =
    (field: "resume" | "coverLetter" | "miscDocuments") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;

      if (field === "miscDocuments") {
        setFormData((prev) => ({
          ...prev,
          miscDocuments: [
            ...prev.miscDocuments,
            ...Array.from(e.target.files || []),
          ],
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [field]: e.target.files?.[0] || null,
        }));
      }
    };

  const handleFileDelete = (
    field: "resume" | "coverLetter" | "miscDocuments",
    index?: number
  ) => {
    setFormData((prev) => {
      if (field === "miscDocuments" && typeof index === "number") {
        const newMiscDocuments = [...prev.miscDocuments];
        newMiscDocuments.splice(index, 1);
        return { ...prev, miscDocuments: newMiscDocuments };
      }
      return { ...prev, [field]: null };
    });
  };

  const handleSubmit = async () => {
    setError("");
    if (!formData.jobTitle.trim() || !formData.jobDescription.trim()) {
      setError(t("validation.requiredFields"));
      return;
    }

    startTransition(async () => {
      const { error } = await createJob({
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        companyName: formData.companyName,
        companyDescription: formData.companyDescription,
        resume: formData.resume,
        coverLetter: formData.coverLetter,
        miscDocuments: formData.miscDocuments,
        captchaToken: formData.captchaToken,
      });
      if (error) {
        setError(error);
        logError(error);
      }
    });
  };

  return (
    <>
      <Dialog
        open={showOnboardingDialog}
        onOpenChange={setShowOnboardingDialog}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {t("onboarding.title")}
            </DialogTitle>
            <DialogDescription className="text-lg pt-2">
              {t("onboarding.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex gap-4 items-start">
                <div className="mt-1">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">
                    {t(`onboarding.steps.${stepNum}.title`)}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(`onboarding.steps.${stepNum}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowOnboardingDialog(false)}>
              {t("onboarding.button")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="px-4 sm:px-6 w-full max-w-[1080px]">
        <H1 className="w-full text-center mb-8">{t("titleV2")}</H1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("jobTitle.label")} <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder={t("jobTitle.placeholder")}
                  value={formData.jobTitle}
                  onChange={handleTextChange("jobTitle")}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("jobDescription.label")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder={t("jobDescription.placeholder")}
                  value={formData.jobDescription}
                  onChange={handleTextChange("jobDescription")}
                  className="h-[80px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("companyName.label")}
                </label>
                <Input
                  placeholder={t("companyName.placeholder")}
                  value={formData.companyName}
                  onChange={handleTextChange("companyName")}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("companyDescription.label")}
                </label>
                <Textarea
                  className="h-[80px]"
                  placeholder={t("companyDescription.placeholder")}
                  value={formData.companyDescription}
                  onChange={handleTextChange("companyDescription")}
                />
              </div>

              <div className="border-t pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  {t("fileUpload.pdfOnlyNotice")}
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t("resume.label")}
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange("resume")}
                      className="hidden"
                      ref={resumeInputRef}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => resumeInputRef.current?.click()}
                        className="w-full"
                      >
                        {t("fileUpload.uploadButton")}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        {t("fileUpload.pdfOnlyHelper")}
                      </p>
                    </div>
                    {formData.resume && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                          <span className="text-sm text-muted-foreground truncate">
                            {formData.resume.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleFileDelete("resume")}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t("coverLetter.label")}
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange("coverLetter")}
                      className="hidden"
                      ref={coverLetterInputRef}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => coverLetterInputRef.current?.click()}
                        className="w-full"
                      >
                        {t("fileUpload.uploadButton")}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        {t("fileUpload.pdfOnlyHelper")}
                      </p>
                    </div>
                    {formData.coverLetter && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                          <span className="text-sm text-muted-foreground truncate">
                            {formData.coverLetter.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleFileDelete("coverLetter")}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t("additionalDocs.label")}
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange("miscDocuments")}
                      multiple
                      className="hidden"
                      ref={miscDocsInputRef}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => miscDocsInputRef.current?.click()}
                        className="w-full"
                      >
                        {t("fileUpload.uploadButton")}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        {t("fileUpload.pdfOnlyHelper")}
                      </p>
                    </div>
                    {formData.miscDocuments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {formData.miscDocuments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                          >
                            <span className="text-sm text-muted-foreground truncate">
                              {file.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                handleFileDelete("miscDocuments", index)
                              }
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={(token) => {
                    setFormData((prev) => ({ ...prev, captchaToken: token }));
                  }}
                />
              </div>

              <div className="pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      disabled={
                        isPending ||
                        !formData.captchaToken ||
                        !formData.jobTitle.trim() ||
                        !formData.jobDescription.trim()
                      }
                      onClick={handleSubmit}
                    >
                      {t("buttons.submit")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("loading.title")}</DialogTitle>
                      <DialogDescription>
                        {t("loading.description")}
                      </DialogDescription>
                      <p className="text-sm text-muted-foreground">
                        {t("loading.redirect")}
                      </p>
                    </DialogHeader>
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
