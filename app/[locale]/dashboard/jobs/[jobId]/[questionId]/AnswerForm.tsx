"use client";

import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";
import { useActionState, useEffect, useState } from "react";
import { submitAnswer } from "./actions";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import AnswerGuideline from "./AnswerGuideline";

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
};

export default function AnswerForm({
  question,
  jobId,
  submissions,
}: {
  question: Tables<"custom_job_questions">;
  jobId: string;
  submissions: Tables<"custom_job_question_submissions">[];
}) {
  const params = useSearchParams();
  const submissionId = params.get("submissionId");
  const t = useTranslations("interviewQuestion");
  const [state, action, isPending] = useActionState(submitAnswer, {
    error: "",
  });
  const [currentSubmission, setCurrentSubmission] =
    useState<Tables<"custom_job_question_submissions"> | null>(
      submissions.length > 0
        ? (submissions.find((submission) => submission.id === submissionId) ??
            submissions[0])
        : null
    );
  const feedback = currentSubmission?.feedback as {
    pros: string[];
    cons: string[];
  };
  const router = useRouter();
  const [view, setView] = useState<"question" | "submissions">("question");

  useEffect(() => {
    if (state.error) {
      alert(state.error);
    }
  }, [state]);

  const handleSubmissionSelect = (submissionId: string) => {
    const submission = submissions.find((s) => s.id === submissionId);
    setCurrentSubmission(submission || null);
    setView("question");
    router.push(`?submissionId=${submissionId}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-center">
            <CardTitle>
              {view === "question" ? t("questionLabel") : t("submissionsLabel")}
            </CardTitle>
            <Button
              variant="ghost"
              onClick={() =>
                setView(view === "question" ? "submissions" : "question")
              }
            >
              {view === "question"
                ? t("submissionsLabel")
                : t("backToQuestion")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {view === "question" ? (
            <>
              <p>{question.question}</p>
              <Separator />
              <form action={action} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="answer">{t("answerLabel")}</Label>
                  <Textarea
                    id="answer"
                    name="answer"
                    rows={8}
                    placeholder={t("answerPlaceholder")}
                    defaultValue={currentSubmission?.answer}
                  />
                </div>
                <input type="hidden" name="jobId" value={jobId} />
                <input type="hidden" name="questionId" value={question.id} />
                <div className="flex gap-4">
                  <SubmitButton
                    disabled={isPending}
                    pendingText={t("buttons.submitting")}
                    type="submit"
                  >
                    {t("buttons.submit")}
                  </SubmitButton>
                </div>
              </form>
            </>
          ) : (
            <div className="space-y-4">
              {submissions.length === 0 ? (
                <p className="text-muted-foreground italic">
                  {t("noSubmissions")}
                </p>
              ) : (
                submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {t("submissionDate", {
                          date: formatDate(new Date(submission.created_at)),
                        })}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSubmissionSelect(submission.id)}
                      >
                        {t("viewSubmission")}
                      </Button>
                    </div>
                    <p className="mt-2 line-clamp-3">{submission.answer}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {feedback && view === "question" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("feedbackLabel")}</CardTitle>
            </CardHeader>
            <CardContent>
              {feedback.pros.length === 0 && feedback.cons.length === 0 ? (
                <p>{t("noFeedback")}</p>
              ) : (
                <div className="grid grid-cols-2 gap-8">
                  <div className="rounded-lg bg-green-50/50 dark:bg-green-950/20 p-6 overflow-y-auto border border-green-100 dark:border-green-900 max-h-[400px] relative">
                    <div className="flex items-center gap-2 mb-4 sticky -top-6 -mx-6 -mt-6 px-6 pt-6 pb-2 bg-green-50 dark:bg-green-950 border-b border-green-100 dark:border-green-900">
                      <svg
                        className="w-5 h-5 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h3 className="font-semibold text-lg text-green-900 dark:text-green-100">
                        {t("pros")}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {feedback.pros.length === 0 ? (
                        <p className="text-green-800 dark:text-green-200 italic">
                          {t("noPros")}
                        </p>
                      ) : (
                        feedback.pros.map((pro, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <span className="text-green-600 dark:text-green-400 mt-1">
                              •
                            </span>
                            <p className="text-green-800 dark:text-green-200">
                              {pro}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg bg-red-50/50 dark:bg-red-950/20 p-6 overflow-y-auto border border-red-100 dark:border-red-900 max-h-[400px] relative">
                    <div className="flex items-center gap-2 mb-4 sticky -top-6 -mx-6 -mt-6 px-6 pt-6 pb-2 bg-red-50 dark:bg-red-950 border-b border-red-100 dark:border-red-900">
                      <svg
                        className="w-5 h-5 text-red-600 dark:text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <h3 className="font-semibold text-lg text-red-900 dark:text-red-100">
                        {t("cons")}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {feedback.cons.length === 0 ? (
                        <p className="text-red-800 dark:text-red-200 italic">
                          {t("noCons")}
                        </p>
                      ) : (
                        feedback.cons.map((con, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <span className="text-red-600 dark:text-red-400 mt-1">
                              •
                            </span>
                            <p className="text-red-800 dark:text-red-200">
                              {con}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <AnswerGuideline question={question} />
        </>
      )}
    </div>
  );
}
