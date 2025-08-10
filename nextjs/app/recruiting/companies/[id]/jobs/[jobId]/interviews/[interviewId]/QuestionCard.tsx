import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InterviewQuestion } from "@/app/recruiting/companies/[id]/jobs/[jobId]/interviews/[interviewId]/page";

interface QuestionCardProps {
  question: InterviewQuestion;
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-md">Interview Question</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          {question.company_interview_question_bank.question}
        </p>
      </CardContent>
      {question.company_interview_question_bank.answer && (
        <>
          <CardHeader>
            <CardTitle className="text-md">Answer Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {question.company_interview_question_bank.answer}
            </p>
          </CardContent>
        </>
      )}
    </Card>
  );
}
