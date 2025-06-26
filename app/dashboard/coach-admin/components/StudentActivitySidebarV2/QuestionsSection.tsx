import {
  fetchJobQuestions,
  fetchQuestionSubmissions,
} from "@/utils/supabase/queries/studentActivity";
import QuestionItem from "./QuestionItem";
import { getTranslations } from "next-intl/server";

interface QuestionsSectionProps {
  jobId: string;
  studentId: string;
  locale: string;
}

export default async function QuestionsSection({
  jobId,
  studentId,
  locale,
}: QuestionsSectionProps) {
  const t = await getTranslations("StudentActivitySidebar");

  // Fetch questions for this job
  const questions = await fetchJobQuestions(jobId);

  if (!questions || questions.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500 p-3">
          {t("noQuestionsFoundForJob")}
        </p>
      </div>
    );
  }

  // Fetch all submissions for these questions in parallel
  const questionIds = questions.map((q) => q.id);
  const submissionsByQuestion = await fetchQuestionSubmissions(
    questionIds,
    studentId
  );

  // Sort questions - ones with submissions first
  const sortedQuestions = [...questions].sort((a, b) => {
    const submissionsA = submissionsByQuestion[a.id] || [];
    const submissionsB = submissionsByQuestion[b.id] || [];

    if (submissionsA.length > 0 && submissionsB.length === 0) {
      return -1;
    }
    if (submissionsA.length === 0 && submissionsB.length > 0) {
      return 1;
    }
    return 0;
  });

  return (
    <div className="p-4">
      <ul className="space-y-2">
        {sortedQuestions.map((question) => {
          const submissions = submissionsByQuestion[question.id] || [];
          const latestSubmission = submissions[0];
          const hasCoachFeedback = latestSubmission?.hasCoachFeedback || false;

          return (
            <QuestionItem
              key={question.id}
              question={question}
              latestSubmission={latestSubmission}
              hasCoachFeedback={hasCoachFeedback}
              studentId={studentId}
              jobId={jobId}
              locale={locale}
            />
          );
        })}
      </ul>
    </div>
  );
}
