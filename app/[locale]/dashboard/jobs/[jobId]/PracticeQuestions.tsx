"use client";

import { Link } from "@/i18n/routing";
import LockedJobComponent from "./LockedJobComponent";
import { CheckCircle } from "lucide-react";

interface Question {
  id: string;
  question: string;
  custom_job_question_submissions: any[];
}

interface PracticeQuestionsProps {
  jobId: string;
  questions: Question[];
  isLocked: boolean;
  userCredits: number;
}

export default function PracticeQuestions({
  jobId,
  questions,
  isLocked,
  userCredits,
}: PracticeQuestionsProps) {
  const firstQuestion = questions[0];
  const remainingQuestions = questions.slice(1);

  return (
    <div className="flex flex-col gap-4 w-full">
      <Link
        key={firstQuestion.id}
        href={`/dashboard/jobs/${jobId}/questions/${firstQuestion.id}`}
        className="rounded p-4 transition-colors flex items-center gap-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/20 dark:hover:bg-gray-800/30"
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">
          01
        </span>
        <span className="font-medium text-gray-900 dark:text-gray-200">
          {firstQuestion.question}
        </span>
        {firstQuestion.custom_job_question_submissions?.length > 0 && (
          <CheckCircle className="ml-auto h-5 w-5 text-green-500 dark:text-green-400" />
        )}
      </Link>

      {isLocked ? (
        <LockedJobComponent jobId={jobId} userCredits={userCredits} />
      ) : (
        remainingQuestions.map((question, index) => (
          <Link
            key={question.id}
            href={`/dashboard/jobs/${jobId}/questions/${question.id}`}
            className={`rounded p-4 transition-colors flex items-center gap-3
              ${
                (index + 1) % 2 === 0
                  ? "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/20 dark:hover:bg-gray-800/30"
                  : "bg-white hover:bg-gray-100 dark:bg-gray-800/10 dark:hover:bg-gray-800/20"
              }`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">
              {(index + 2).toString().padStart(2, "0")}
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-200">
              {question.question}
            </span>
            {question.custom_job_question_submissions?.length > 0 && (
              <CheckCircle className="ml-auto h-5 w-5 text-green-500 dark:text-green-400" />
            )}
          </Link>
        ))
      )}
    </div>
  );
}
