"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/context/OnboardingContext";
import { useRouter } from "next/navigation";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useActionState, useEffect, useTransition } from "react";
import { startMockInterview } from "@/app/[locale]/dashboard/jobs/[jobId]/actions";
import { useFeatureFlagVariantKey } from "posthog-js/react";

export function OnboardingChecklist() {
  const { onboardingState, isOnboardingComplete } = useOnboarding();
  const t = useTranslations("onboarding");
  const router = useRouter();
  const { logError } = useAxiomLogging();
  const [isPending, startTransition] = useTransition();
  // const enableNewUserOnboarding =
  //   useFeatureFlagVariantKey("enable-new-user-onboarding") === "test";
  const enableNewUserOnboarding = true;

  const [startInterviewState, startInterviewAction, _] = useActionState(
    startMockInterview,
    {
      error: "",
    }
  );

  useEffect(() => {
    if (startInterviewState.error) {
      logError("Error starting mock interview", {
        error: startInterviewState.error,
      });
      alert(startInterviewState.error);
    }
  }, [startInterviewState.error]);

  if (isOnboardingComplete || !enableNewUserOnboarding) return null;
  const lastUnansweredQuestionId = onboardingState?.last_unanswered_question_id;
  const lastCreatedJobId = onboardingState?.last_created_job_id;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">{t("checklistTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="px-2 space-y-1">
        <ChecklistItem
          completed={onboardingState?.first_custom_job_created ?? false}
          label={t("createJob")}
          disabled={false}
          onClick={() => {
            router.push("/dashboard/jobs?newJob=true&onboarding=true");
          }}
        />
        <ChecklistItem
          completed={onboardingState?.first_answer_generated ?? false}
          disabled={!lastCreatedJobId}
          label={t("generateAnswer")}
          onClick={() => {
            router.push(
              `/dashboard/jobs/${lastCreatedJobId}/questions/${lastUnansweredQuestionId}?generateOnboarding=true`
            );
          }}
        />
        <ChecklistItem
          completed={onboardingState?.first_question_answered ?? false}
          disabled={!lastCreatedJobId}
          label={t("answerQuestion")}
          onClick={() => {
            router.push(
              `/dashboard/jobs/${lastCreatedJobId}/questions/${lastUnansweredQuestionId}?answerOnboarding=true`
            );
          }}
        />
        <ChecklistItem
          completed={onboardingState?.first_mock_interview_completed ?? false}
          label={t("completeMockInterview")}
          disabled={!lastCreatedJobId}
          onClick={() => {
            if (!lastCreatedJobId) return;
            startTransition(async () => {
              const formData = new FormData();
              formData.append("jobId", lastCreatedJobId);
              formData.append("onboarding", "true");
              startInterviewAction(formData);
            });
          }}
        />
        <ChecklistItem
          completed={onboardingState?.connected_account_to_email ?? false}
          label={t("signUp")}
          disabled={false}
          onClick={() => router.push("/sign-up")}
        />
      </CardContent>
    </Card>
  );
}

interface ChecklistItemProps {
  completed: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}

function ChecklistItem({
  completed,
  disabled,
  label,
  onClick,
}: ChecklistItemProps) {
  if (disabled) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-2 transition-all duration-200 p-2 rounded-md cursor-default group",
        !completed ? "hover:cursor-pointer hover:bg-accent/50" : ""
      )}
      onClick={() => {
        if (completed) return;
        onClick();
      }}
    >
      <div className="w-5 h-5 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-primary" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <span
        className={cn(
          "text-sm transition-colors duration-200",
          completed ? "text-muted-foreground line-through" : "text-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}
