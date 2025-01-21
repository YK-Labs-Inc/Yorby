"use client";

import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";
import { useActionState } from "react";
import { submitAnswer, generateAnswer } from "./actions";
import { useSearchParams } from "next/navigation";
import { AIButton } from "@/components/ai-button";
import AnswerGuideline from "./AnswerGuideline";
import { Link } from "@/i18n/routing";
import { FormMessage, Message } from "@/components/form-message";
import { useRef, useState } from "react";

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
  submissionId,
}: {
  question: Tables<"custom_job_questions">;
  jobId: string;
  submissions: Tables<"custom_job_question_submissions">[];
  submissionId?: string;
}) {
  const t = useTranslations("interviewQuestion");
  const [_, submitAnswerAction, isSubmitAnswerPending] = useActionState(
    submitAnswer,
    null
  );
  const [__, generateAnswerAction, isGenerateAnswerPending] = useActionState(
    generateAnswer,
    null
  );
  let currentSubmission: Tables<"custom_job_question_submissions"> | null =
    submissionId && submissions.length > 0
      ? (submissions.find((submission) => submission.id === submissionId) ??
        null)
      : null;

  const initialAnswer = useRef(currentSubmission?.answer || "");
  const [currentAnswer, setCurrentAnswer] = useState(initialAnswer.current);
  const hasAnswerChanged = currentAnswer !== initialAnswer.current;

  const feedback = currentSubmission?.feedback as {
    pros: string[];
    cons: string[];
  } | null;
  const searchParams = useSearchParams();
  const error = searchParams.get("error") as string;
  const view = searchParams.get("view") || "question";
  let formMessage: Message | null = null;
  if (error) {
    formMessage = {
      error,
    };
  }

  const newViewParams = new URLSearchParams(searchParams);
  newViewParams.set("view", view === "question" ? "submissions" : "question");

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-center">
            <CardTitle>
              {view === "question" ? t("questionLabel") : t("submissionsLabel")}
            </CardTitle>
            <Link
              href={`/dashboard/jobs/${jobId}/questions/${question.id}?${newViewParams.toString()}`}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              {view === "question"
                ? t("submissionsLabel")
                : t("backToQuestion")}
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {view === "question" ? (
            <>
              <p>{question.question}</p>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-4 items-center w-full justify-between">
                    <Label htmlFor="answer">{t("answerLabel")}</Label>
                    <form action={generateAnswerAction}>
                      <input
                        type="hidden"
                        name="questionId"
                        value={question.id}
                      />
                      <input type="hidden" name="jobId" value={jobId} />
                      <AIButton
                        type="submit"
                        disabled={
                          isGenerateAnswerPending || isSubmitAnswerPending
                        }
                        pending={isGenerateAnswerPending}
                        pendingText={t("buttons.generatingAnswer")}
                        variant="outline"
                      >
                        {t("buttons.generateAnswer")}
                      </AIButton>
                    </form>
                  </div>
                  <form action={submitAnswerAction}>
                    <div className="relative">
                      <Textarea
                        id="answer"
                        name="answer"
                        rows={8}
                        placeholder={t("answerPlaceholder")}
                        defaultValue={currentSubmission?.answer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        disabled={
                          isSubmitAnswerPending || isGenerateAnswerPending
                        }
                        className={
                          isGenerateAnswerPending || isSubmitAnswerPending
                            ? "opacity-50"
                            : ""
                        }
                      />
                      {isGenerateAnswerPending && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                          <div className="animate-pulse text-muted-foreground">
                            {t("buttons.generatingAnswer")}...
                          </div>
                        </div>
                      )}
                    </div>
                    <input type="hidden" name="jobId" value={jobId} />
                    <input
                      type="hidden"
                      name="questionId"
                      value={question.id}
                    />
                    <SubmitButton
                      className="mt-4"
                      disabled={
                        isGenerateAnswerPending ||
                        isSubmitAnswerPending ||
                        !hasAnswerChanged
                      }
                      pendingText={t("buttons.submitting")}
                      type="submit"
                    >
                      {t("buttons.submit")}
                    </SubmitButton>
                  </form>
                  {formMessage && <FormMessage message={formMessage} />}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {submissions.length === 0 ? (
                <p className="text-muted-foreground italic">
                  {t("noSubmissions")}
                </p>
              ) : (
                submissions.map((submission) => (
                  <Link
                    key={submission.id}
                    href={`/dashboard/jobs/${jobId}/questions/${question.id}?submissionId=${submission.id}`}
                    className="block p-4 border rounded-lg hover:bg-accent transition-colors w-full text-left"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {t("submissionDate", {
                          date: formatDate(new Date(submission.created_at)),
                        })}
                      </p>
                    </div>
                    <p className="mt-2 line-clamp-3">{submission.answer}</p>
                  </Link>
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
                        feedback.pros.map((pro: string, index: number) => (
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
                        feedback.cons.map((con: string, index: number) => (
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
