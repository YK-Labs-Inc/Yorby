"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { H1 } from "@/components/typography";
import { createJob } from "./landing2/actions";
import { useTranslations } from "next-intl";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DialogTitle } from "@radix-ui/react-dialog";

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

export default function JobCreationComponent() {
  const t = useTranslations("jobCreation");
  const [step, setStep] = useState(1);
  const [showLoadingModal, setShowLoadingModal] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const handleSubmit = async () => {
    setError(null);
    setShowLoadingModal(true);
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
        setShowLoadingModal(false);
        setError(error);
        logError(error);
      }
    });
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <div className="px-4 sm:px-6 w-full max-w-[1080px]">
      <H1 className="w-full text-center mb-8">{t("title")}</H1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading Modal */}
      <Dialog open={showLoadingModal} onOpenChange={setShowLoadingModal}>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center justify-center py-8 gap-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">{t("loading.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("loading.description")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("loading.redirect")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("loading.emailNotification")}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-8">
        <Progress value={step === 1 ? 50 : 100} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">
          {t("stepProgress", {
            step,
            stepTitle: t(`steps.${step}`),
          })}
        </p>
      </div>

      <Card className="w-full">
        <CardContent className="pt-6">
          {step === 1 ? (
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

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={
                    !formData.jobTitle.trim() || !formData.jobDescription.trim()
                  }
                >
                  {t("buttons.next")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("resume.label")}
                </label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange("resume")}
                  className="cursor-pointer"
                />
                {formData.resume && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {formData.resume.name}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("coverLetter.label")}
                </label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange("coverLetter")}
                  className="cursor-pointer"
                />
                {formData.coverLetter && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {formData.coverLetter.name}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("additionalDocs.label")}
                </label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange("miscDocuments")}
                  multiple
                  className="cursor-pointer"
                />
                {formData.miscDocuments.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {t("additionalDocs.filesSelected", {
                      count: formData.miscDocuments.length,
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  {t("buttons.back")}
                </Button>
                <Button
                  disabled={isPending || !formData.captchaToken}
                  onClick={handleSubmit}
                >
                  {t("buttons.submit")}
                </Button>
              </div>
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => {
                  setFormData((prev) => ({ ...prev, captchaToken: token }));
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
