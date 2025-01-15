import { Link } from "@/i18n/routing";
import { CheckCircle } from "lucide-react";

interface Question {
  id: string;
  question: string;
  custom_job_question_submissions: any[];
}

interface PracticeQuestionsProps {
  jobId: string;
  questions: Question[];
}

export default function PracticeQuestions({
  jobId,
  questions,
}: PracticeQuestionsProps) {
  return (
    <div className="flex flex-col gap-4">
      {questions.map((question, index) => (
        <Link
          key={question.id}
          href={`/dashboard/jobs/${jobId}/questions/${question.id}`}
          className={`rounded p-4 transition-colors flex items-center gap-3
            ${
              index % 2 === 0
                ? "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/20 dark:hover:bg-gray-800/30"
                : "bg-white hover:bg-gray-100 dark:bg-gray-800/10 dark:hover:bg-gray-800/20"
            }`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">
            {(index + 1).toString().padStart(2, "0")}
          </span>
          <span className="font-medium text-gray-900 dark:text-gray-200">
            {question.question}
          </span>
          {question.custom_job_question_submissions?.length > 0 && (
            <CheckCircle className="ml-auto h-5 w-5 text-green-500 dark:text-green-400" />
          )}
        </Link>
      ))}
    </div>
  );
}
