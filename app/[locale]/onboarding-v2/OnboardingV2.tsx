"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  FileText,
  MessageSquare,
  Users,
  Upload,
  Loader2,
  Wand2,
  Copy,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { completeOnboarding } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/context/UserContext";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { uploadUserFile } from "@/app/[locale]/dashboard/resumes/actions";
import Link from "next/link";
import { useKnowledgeBase } from "@/app/context/KnowledgeBaseContext";
import { Product } from "../purchase/actions";
import { FormMessage } from "@/components/form-message";
import TrustBadges from "../purchase/components/TrustBadges";
import { SubscriptionPricingCard } from "../purchase/SubscriptionPricingCard";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import React from "react";

const steps = [
  {
    title: "welcome",
    icon: "✨",
    searchParam: "welcome",
  },
  {
    title: "knowledgeBase",
    icon: "📚",
    searchParam: "knowledge-base",
  },
  {
    title: "toolkit",
    icon: "🛠️",
    searchParam: "toolkit",
  },
  {
    title: "testimonials",
    icon: "🌟",
    searchParam: "testimonials",
  },
  {
    title: "purchase",
    icon: "💎",
    searchParam: "purchase",
  },
  {
    title: "upload",
    icon: "📤",
    searchParam: "upload",
  },
];

function ReferralNudgeDialog({
  open,
  onNext,
}: {
  open: boolean;
  onNext: () => void;
}) {
  const t = useTranslations("onboardingV2.referralNudgeDialog");
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        hideClose
        className="bg-white border border-black text-black"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-black text-center">
            {t("title")}
          </DialogTitle>
        </DialogHeader>
        <div className="text-center my-4">
          <p className="mb-4 text-base text-black">{t("description")}</p>
          <Link
            href="/referrals"
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-4"
          >
            <Button className="w-full">{t("dashboardLink")}</Button>
          </Link>
        </div>
        <DialogFooter>
          <Button className="w-full" variant="outline" onClick={onNext}>
            {t("next", { default: "Next" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OnboardingPage({
  products,
  isFlashPricingEnabled,
  showFlashPricingUI,
  userSignedUpWithin24Hours,
  userSignUpTimestamp,
}: {
  products: Product[];
  isFlashPricingEnabled: boolean;
  showFlashPricingUI: boolean;
  userSignedUpWithin24Hours: boolean;
  userSignUpTimestamp: string;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSkipPurchaseDialog, setShowSkipPurchaseDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingMemories, setIsUpdatingMemories] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [showReferralNudge, setShowReferralNudge] = useState(false);
  const [showReferralNudgeDialog, setShowReferralNudgeDialog] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("onboardingV2");
  const user = useUser();
  const { logError } = useAxiomLogging();
  const { updateKnowledgeBase } = useKnowledgeBase();

  // Handle initial step based on URL
  useEffect(() => {
    if (!searchParams) return;

    const stepParam = searchParams.get("step");
    if (stepParam) {
      const stepIndex = steps.findIndex(
        (step) => step.searchParam === stepParam
      );
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
      }
    }
  }, [searchParams]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;

      // If we're on the purchase step, show confirmation dialog
      if (steps[currentStep].title === "purchase") {
        setShowSkipPurchaseDialog(true);
        return;
      }

      setCurrentStep(nextStep);
      // Update URL with new step
      const url = new URL(window.location.href);
      url.searchParams.set("step", steps[nextStep].searchParam);
      router.push(url.pathname + url.search);
    } else {
      setShowFileUpload(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);

    // Validate file count
    if (files.length > 10) {
      setError(t("upload.maxFilesExceeded"));
      return;
    }

    // Validate all files are PDFs
    const invalidFile = files.find((file) => file.type !== "application/pdf");
    if (invalidFile) {
      setError(t("upload.pdfOnly"));
      return;
    }

    setError("");
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (!user || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        await uploadUserFile(file, user.id, true);
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }
      setIsUploading(false);
      setIsUpdatingMemories(true);
      await updateKnowledgeBase([]);
      setShowFileUpload(false);
      setShowSuccessModal(true);
      void completeOnboarding();
    } catch (error) {
      logError("Error uploading files:", { error });
      setError(t("upload.uploadError"));
    } finally {
      setIsUploading(false);
      setIsUpdatingMemories(false);
      setUploadProgress(0);
      setSelectedFiles([]);
    }
  };

  // Handler for skipping upload
  const handleSkip = () => {
    setShowFileUpload(false);
    setShowSkipWarning(true);
  };

  // Handler for confirming skip
  const handleConfirmSkip = async () => {
    setShowSkipWarning(false);
    setShowSuccessModal(true);
    void completeOnboarding();
  };

  const handleConfirmSkipPurchase = () => {
    setShowSkipPurchaseDialog(false);
    setShowReferralNudgeDialog(true);
  };

  // Handler for when user clicks Next in referral dialog
  const handleReferralNudgeNext = () => {
    setShowReferralNudgeDialog(false);
    // Progress to upload step
    const uploadStepIndex = steps.findIndex((s) => s.title === "upload");
    setCurrentStep(uploadStepIndex);
    // Update URL with new step
    const url = new URL(window.location.href);
    url.searchParams.set("step", steps[uploadStepIndex].searchParam);
    router.push(url.pathname + url.search);
  };

  const renderStepContent = (step: string) => {
    switch (step) {
      case "welcome":
      case "knowledgeBase":
        return (
          <div className="space-y-2">
            {t
              .raw(`steps.${step}.content`)
              .map((line: string, index: number) => (
                <p key={index} className="text-lg text-gray-700">
                  {line}
                </p>
              ))}
          </div>
        );
      case "toolkit":
        return (
          <div className="space-y-2">
            <ResumeBuilderCard />
            <TransformResumeCard />
            <InterviewPrepCard />
            <InterviewCopilotCard />
          </div>
        );
      case "testimonials":
        return (
          <div className="grid grid-rows-3 md:grid-rows-1 md:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-md transition-shadow flex flex-col text-left">
              <p className="text-gray-700 text-sm italic mb-4 flex-grow">
                "{t("steps.testimonials.testimonial1.quote")}"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                  SM
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t("steps.testimonials.testimonial1.author")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("steps.testimonials.testimonial1.role")}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow flex flex-col text-left">
              <p className="text-gray-700 text-sm italic mb-4 flex-grow">
                "{t("steps.testimonials.testimonial2.quote")}"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                  MT
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t("steps.testimonials.testimonial2.author")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("steps.testimonials.testimonial2.role")}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow flex flex-col text-left">
              <p className="text-gray-700 text-sm italic mb-4 flex-grow">
                "{t("steps.testimonials.testimonial3.quote")}"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                  KF
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t("steps.testimonials.testimonial3.author")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("steps.testimonials.testimonial3.role")}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );
      case "purchase":
        return (
          <PurchaseScreen
            products={products}
            isFlashPricingEnabled={isFlashPricingEnabled}
            showFlashPricingUI={showFlashPricingUI}
            userSignedUpWithin24Hours={userSignedUpWithin24Hours}
            userSignUpTimestamp={userSignUpTimestamp}
          />
        );
      case "upload":
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl mb-4"
            >
              {steps[currentStep].icon}
            </motion.div>
            <h1 className="text-3xl font-bold mb-4 text-gray-900">
              {t(`steps.${steps[currentStep].title}.title`)}
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              {t(`steps.${steps[currentStep].title}.description`)}
            </p>
            <div className="mb-4">
              {renderStepContent(steps[currentStep].title)}
            </div>
            <div className="flex justify-center">
              <Button
                onClick={handleNext}
                variant={
                  steps[currentStep].title === "purchase"
                    ? "secondary"
                    : "default"
                }
                size={steps[currentStep].title === "purchase" ? "lg" : "xl"}
              >
                {steps[currentStep].title === "upload" ? (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t("buttons.startKnowledgeBase")}
                  </>
                ) : steps[currentStep].title === "purchase" ? (
                  <>{t("skipUpgrade")}</>
                ) : (
                  <>
                    {t("buttons.next")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("upload.title")}</DialogTitle>
            <DialogDescription>{t("upload.description")}</DialogDescription>
          </DialogHeader>

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          <div className="space-y-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              multiple
            />
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="w-full"
                disabled={isUploading || isUpdatingMemories}
              >
                {isUploading || isUpdatingMemories ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isUploading
                      ? t("upload.uploading")
                      : t("upload.updatingMemories")}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t("upload.uploadContext")}
                  </>
                )}
              </Button>
              {selectedFiles.length > 0 &&
                !isUploading &&
                !isUpdatingMemories && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t("upload.selectedFiles", {
                        count: selectedFiles.length,
                      })}
                    </p>
                    <div className="space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded-md"
                        >
                          <span className="truncate">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedFiles(
                                selectedFiles.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              {(isUploading || isUpdatingMemories) && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {isUploading
                      ? `${Math.round(uploadProgress)}% uploaded`
                      : t("upload.updatingMemoriesProgress")}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t("upload.multiPdfHelper")}
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2">
            <Button
              onClick={handleUpload}
              disabled={
                selectedFiles.length === 0 || isUploading || isUpdatingMemories
              }
              className="w-full"
            >
              {isUploading || isUpdatingMemories ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isUploading
                    ? t("upload.uploading")
                    : t("upload.updatingMemories")}
                </>
              ) : (
                t("upload.upload")
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isUploading || isUpdatingMemories}
            >
              {t("upload.skip")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip warning dialog */}
      <Dialog open={showSkipWarning} onOpenChange={setShowSkipWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("upload.skipWarning.title")}</DialogTitle>
            <DialogDescription>
              {t("upload.skipWarning.description1")}
              <br />
              <br />
              <span className="font-semibold">
                {t("upload.skipWarning.description2")}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSkipWarning(false);
                setShowFileUpload(true);
              }}
              className="w-full"
            >
              {t("upload.skipWarning.goBack")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmSkip}
              className="w-full"
            >
              {t("upload.skipWarning.skipAnyway")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip purchase confirmation dialog */}
      <Dialog
        open={showSkipPurchaseDialog}
        onOpenChange={setShowSkipPurchaseDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("skipPurchase.title")}</DialogTitle>
            <DialogDescription>
              {t("skipPurchase.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => setShowSkipPurchaseDialog(false)}
            >
              {t("skipPurchase.goBack")}
            </Button>
            <Button
              className="w-full"
              onClick={handleConfirmSkipPurchase}
              variant="outline"
            >
              {t("skipPurchase.skipAnyway")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReferralNudgeDialog
        open={showReferralNudgeDialog}
        onNext={handleReferralNudgeNext}
      />

      <Dialog
        open={showSuccessModal}
        onOpenChange={(open) => {
          if (!open) return;
        }}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] flex flex-col p-0"
          hideClose
        >
          <DialogHeader className="bg-background px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-2xl text-center">
              {t("congratulations")}
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              {t("congratulationsDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <div className="grid gap-6 py-6">
              <Link href="/dashboard/resumes">
                <ResumeBuilderCard />
              </Link>
              <Link href="/dashboard/transform-resume">
                <TransformResumeCard />
              </Link>
              <Link href="/dashboard/jobs">
                <InterviewPrepCard />
              </Link>
              <Link href="/dashboard/interview-copilots">
                <InterviewCopilotCard />
              </Link>
            </div>
          </div>
          <DialogFooter className="bg-background px-6 py-4 border-t">
            <Link className="w-full" href="/memories">
              <Button className="w-full">{t("continueToMemories")}</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ResumeBuilderCard = () => {
  const t = useTranslations("onboardingV2");
  return (
    <Card className="flex items-center gap-6 p-6">
      <div className="flex-shrink-0">
        <FileText className="w-8 h-8 text-blue-500" />
      </div>
      <div className="flex-grow text-left">
        <h4 className="text-xl font-semibold text-gray-900 mb-1">
          {t("steps.toolkit.resumeBuilder.title")}
        </h4>
        <p className="text-gray-600 mb-1">
          {t("steps.toolkit.resumeBuilder.description1")}
        </p>
        <p className="text-gray-600 mb-1">
          {t("steps.toolkit.resumeBuilder.description2")}
        </p>
      </div>
    </Card>
  );
};

const TransformResumeCard = () => {
  const t = useTranslations("onboardingV2");
  return (
    <Card className="flex items-center gap-6 p-6">
      <div className="flex-shrink-0">
        <Wand2 className="w-8 h-8 text-amber-500" />
      </div>
      <div className="flex-grow text-left">
        <h4 className="text-xl font-semibold text-gray-900 mb-1">
          {t("steps.toolkit.transformResume.title")}
        </h4>
        <p className="text-gray-600 mb-1">
          {t("steps.toolkit.transformResume.description1")}
        </p>
        <p className="text-gray-600">
          {t("steps.toolkit.transformResume.description2")}
        </p>
      </div>
    </Card>
  );
};

const InterviewPrepCard = () => {
  const t = useTranslations("onboardingV2");
  return (
    <Card className="flex items-center gap-6 p-6">
      <div className="flex-shrink-0">
        <MessageSquare className="w-8 h-8 text-purple-500" />
      </div>
      <div className="flex-grow text-left">
        <h4 className="text-xl font-semibold text-gray-900 mb-1">
          {t("steps.toolkit.interviewPrep.title")}
        </h4>
        <p className="text-gray-600 mb-1">
          {t("steps.toolkit.interviewPrep.description1")}
        </p>
        <p className="text-gray-600">
          {t("steps.toolkit.interviewPrep.description2")}
        </p>
      </div>
    </Card>
  );
};

const InterviewCopilotCard = () => {
  const t = useTranslations("onboardingV2");
  return (
    <Card className="flex items-center gap-6 p-6">
      <div className="flex-shrink-0">
        <Users className="w-8 h-8 text-green-500" />
      </div>
      <div className="flex-grow text-left">
        <h4 className="text-xl font-semibold text-gray-900 mb-1">
          {t("steps.toolkit.interviewCopilot.title")}
        </h4>
        <p className="text-gray-600">
          {t("steps.toolkit.interviewCopilot.description1")}
        </p>
        <p className="text-gray-600">
          {t("steps.toolkit.interviewCopilot.description2")}
        </p>
      </div>
    </Card>
  );
};

const PurchaseScreen = ({
  products,
  isFlashPricingEnabled,
  showFlashPricingUI,
  userSignedUpWithin24Hours,
  userSignUpTimestamp,
}: {
  products: Product[];
  isFlashPricingEnabled: boolean;
  showFlashPricingUI: boolean;
  userSignedUpWithin24Hours: boolean;
  userSignUpTimestamp: string;
}) => {
  const t = useTranslations("purchase");

  const monthlyProduct = products.find((p: any) => p.months === 1);
  const baselineMonthlyPrice =
    typeof monthlyProduct?.increasedPrice === "number"
      ? monthlyProduct.increasedPrice
      : undefined;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 py-2 px-2">
      <TrustBadges />
      <div className="mt-12">
        <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2 text-left">
          {products.map((product: any, idx: number) => (
            <SubscriptionPricingCard
              key={product.prices[0]?.id}
              product={product}
              highlight={idx === 1}
              badge={idx === 1 ? t("mostPopularBadge") : undefined}
              cancelledPurchaseRedirectUrl="/onboarding-v2?step=purchase"
              isFlashPricingEnabled={isFlashPricingEnabled}
              baselineMonthlyPrice={baselineMonthlyPrice}
              showFlashPricingUI={showFlashPricingUI}
              userSignedUpWithin24Hours={userSignedUpWithin24Hours}
              userSignUpTimestamp={userSignUpTimestamp}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
