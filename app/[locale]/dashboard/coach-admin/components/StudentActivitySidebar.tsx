"use client";

import { useState } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Sparkles, AlertTriangle } from "lucide-react";
import { Tables } from "@/utils/supabase/database.types";
import { useTranslations } from "next-intl";

// Updated types using Tables from database.types.ts
// Define the structure for feedback within a submission
interface SubmissionFeedback
  extends Tables<"custom_job_question_submission_feedback"> {}

// Update QuestionSubmission type to include feedback
interface QuestionSubmission extends Tables<"custom_job_question_submissions"> {
  custom_job_question_submission_feedback: SubmissionFeedback[];
}

export type QuestionWithSubmissions = Tables<"custom_job_questions"> & {
  custom_job_question_submissions: QuestionSubmission[];
};

export type JobData = Tables<"custom_jobs"> & {
  custom_job_questions: QuestionWithSubmissions[];
  custom_job_mock_interviews: Tables<"custom_job_mock_interviews">[];
};

// Removed old interface definitions for QuestionSubmission, QuestionData, MockInterviewData
// The old JobData interface is replaced by the new JobData type above.

interface StudentActivitySidebarProps {
  studentId: string;
  activeJobId: string;
  allJobsForStudent: JobData[]; // Uses the new JobData type
  currentQuestionId?: string;
  currentMockInterviewId?: string;
  locale: string; // For constructing links correctly with Link component
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const configureStatus = (
  status: string | null, // Status can be null from DB
  t: (key: string, params?: any) => string // t function from useTranslations
): string => {
  if (status === null) return t("unknown");
  switch (status) {
    case "complete":
      return t("complete");
    case "in_progress":
      return t("inProgress");
    default:
      return t("unknown");
  }
};

export default function StudentActivitySidebar({
  studentId,
  activeJobId,
  allJobsForStudent,
  locale,
}: StudentActivitySidebarProps) {
  const t = useTranslations("StudentActivitySidebar");
  const params = useParams();
  const {
    questionId: currentQuestionId,
    mockInterviewId: currentMockInterviewId,
  } = params as {
    questionId?: string;
    mockInterviewId?: string;
  };
  const pathname = usePathname();
  const isMockInterview = pathname?.includes("mockInterviews");
  const [selectedTab, setSelectedTab] = useState<
    "questions" | "mockInterviews"
  >(isMockInterview ? "mockInterviews" : "questions");
  const router = useRouter();

  const selectedJob =
    allJobsForStudent.find((job) => job.id === activeJobId) ||
    allJobsForStudent[0];

  if (!selectedJob) {
    return (
      <aside className="w-80 border-r p-6 bg-gray-50 h-full">
        {t("noJobsFound")}
      </aside>
    );
  }

  // Ensure these are always arrays, even if the fetched data might have null/undefined
  const questions: QuestionWithSubmissions[] = Array.isArray(
    selectedJob.custom_job_questions
  )
    ? selectedJob.custom_job_questions
    : [];
  const mockInterviews: Tables<"custom_job_mock_interviews">[] = Array.isArray(
    selectedJob.custom_job_mock_interviews
  )
    ? selectedJob.custom_job_mock_interviews
    : [];

  const handleJobChange = (newJobId: string) => {
    const targetBase = `/dashboard/coach-admin/students/${studentId}/jobs/${newJobId}`;
    const newJobData = allJobsForStudent.find((j) => j.id === newJobId);

    if (selectedTab === "questions") {
      const firstQuestionId = newJobData?.custom_job_questions?.[0]?.id;
      router.push(
        `${targetBase}/questions/${firstQuestionId || "no-questions"}`
      );
    } else {
      const firstMockInterviewId =
        newJobData?.custom_job_mock_interviews?.[0]?.id;
      router.push(
        `${targetBase}/mockInterviews/${firstMockInterviewId || "no-mock-interviews"}`
      );
    }
  };

  // Updated parameter type to QuestionWithSubmissions
  const getQuestionSubmissions = (question: QuestionWithSubmissions) => {
    return Array.isArray(question.custom_job_question_submissions)
      ? question.custom_job_question_submissions
      : [];
  };

  return (
    <aside className="w-80 border-r flex flex-col overflow-y-auto h-full min-h-0">
      <div className="p-4 border-b border-gray-200">
        {allJobsForStudent.length <= 1 ? (
          <Card className="w-full bg-white border rounded-lg shadow-sm">
            <div className="px-4 py-3">
              <CardTitle className="text-base font-semibold text-gray-800 truncate">
                {selectedJob.job_title}
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                {selectedTab === "questions"
                  ? t("questionsCount", { count: questions.length })
                  : t("mockInterviewCount", {
                      count: mockInterviews.length,
                    })}
              </CardDescription>
            </div>
          </Card>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 flex items-center justify-between shadow-sm hover:bg-gray-50 transition text-left"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {selectedJob.job_title}
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedTab === "questions"
                      ? t("questionsCount", { count: questions.length })
                      : t("mockInterviewCount", {
                          count: mockInterviews.length,
                        })}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[calc(theme(space.80)-theme(space.8))] mt-1 bg-white shadow-lg rounded-md border"
            >
              {allJobsForStudent.map((job) => (
                <DropdownMenuItem
                  key={job.id}
                  onSelect={() => handleJobChange(job.id)}
                  className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-gray-800">
                      {job.job_title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t("questions")}: {job.custom_job_questions?.length || 0},
                      {t("mockInterviews")}:{" "}
                      {job.custom_job_mock_interviews?.length || 0}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setSelectedTab("questions")}
          aria-pressed={selectedTab === "questions"}
          className={`flex-1 p-3 text-sm text-center font-medium focus:outline-none focus:z-10 transition-colors
            ${selectedTab === "questions" ? "border-b-2 border-primary text-primary bg-primary/5" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"}`}
        >
          {t("questions")}
        </button>
        <button
          onClick={() => setSelectedTab("mockInterviews")}
          aria-pressed={selectedTab === "mockInterviews"}
          className={`flex-1 p-3 text-sm text-center font-medium focus:outline-none focus:z-10 transition-colors
            ${selectedTab === "mockInterviews" ? "border-b-2 border-primary text-primary bg-primary/5" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"}`}
        >
          {t("mockInterviews")}
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {selectedTab === "questions" && (
          <ul className="space-y-2">
            {questions.map((q) => {
              const submissions = getQuestionSubmissions(q);
              const completed = submissions.length > 0;
              const hasCoachFeedback = submissions.some(
                (submission) =>
                  Array.isArray(
                    submission.custom_job_question_submission_feedback
                  ) &&
                  submission.custom_job_question_submission_feedback.some(
                    (fb) => fb.feedback_role === "user"
                  )
              );
              const latestSubmission =
                submissions.length > 0 ? submissions[0] : null;
              let aiFeedbackNeedsReview = false;

              if (
                latestSubmission &&
                Array.isArray(
                  latestSubmission.custom_job_question_submission_feedback
                )
              ) {
                const lowConfidenceAIFeedbackExists =
                  latestSubmission.custom_job_question_submission_feedback.some(
                    (fb) =>
                      fb.feedback_role === "ai" && fb.confidence_score < 0.8
                  );

                const hasUserFeedbackForSubmission =
                  latestSubmission.custom_job_question_submission_feedback.some(
                    (fb) => fb.feedback_role === "user"
                  );

                if (
                  lowConfidenceAIFeedbackExists &&
                  !hasUserFeedbackForSubmission
                ) {
                  aiFeedbackNeedsReview = true;
                }
              }

              return (
                <li key={q.id}>
                  <Link
                    href={`/dashboard/coach-admin/students/${studentId}/jobs/${activeJobId}/questions/${q.id}`}
                    locale={locale}
                    className={`block rounded-md px-3 py-2.5 transition-all
                    ${
                      currentQuestionId === q.id
                        ? "ring-2 ring-primary border-primary bg-primary/10 shadow-sm"
                        : completed
                          ? "bg-green-50 border border-green-200 hover:bg-green-100"
                          : "bg-white border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-gray-800 truncate flex-1">
                          {q.question}
                        </span>
                        <div className="text-xs text-gray-500">
                          {t("lastSubmission", {
                            date: completed
                              ? formatDate(submissions[0].created_at)
                              : t("dash"),
                          })}
                        </div>
                      </div>
                      {hasCoachFeedback && (
                        <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0 ml-2" />
                      )}
                      {aiFeedbackNeedsReview && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 fill-yellow-400 flex-shrink-0 ml-1" />
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
            {questions.length === 0 && (
              <p className="text-sm text-gray-500 p-3">
                {t("noQuestionsFoundForJob")}
              </p>
            )}
          </ul>
        )}
        {selectedTab === "mockInterviews" && (
          <ul className="space-y-2">
            {mockInterviews.map((mi) => (
              <li key={mi.id}>
                <Link
                  href={`/dashboard/coach-admin/students/${studentId}/jobs/${activeJobId}/mockInterviews/${mi.id}`}
                  locale={locale}
                  className={`block rounded-md px-3 py-2.5 border transition-all cursor-pointer
                    ${
                      currentMockInterviewId === mi.id
                        ? "ring-2 ring-primary border-primary bg-primary/10 shadow-sm"
                        : mi.status === "complete"
                          ? "bg-green-50 border-green-200 hover:bg-green-100"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      {t("mockInterviewDate", {
                        date: formatDate(mi.created_at),
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t("mockInterviewStatus", {
                      status: configureStatus(mi.status, t),
                    })}
                  </div>
                </Link>
              </li>
            ))}
            {mockInterviews.length === 0 && (
              <p className="text-sm text-gray-500 p-3">
                {t("noMockInterviewsFoundForJob")}
              </p>
            )}
          </ul>
        )}
      </div>
    </aside>
  );
}
