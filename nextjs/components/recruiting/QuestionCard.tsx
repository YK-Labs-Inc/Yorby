import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Question } from "@/app/recruiting/companies/[id]/jobs/[jobId]/questions/AIChatPanel";

interface QuestionCardProps {
  question: Question;
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-md">Interview Question</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{question.question}</p>
      </CardContent>
      {question.answer_guidelines && (
        <>
          <CardHeader>
            <CardTitle className="text-md">Answer Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{question.answer_guidelines}</p>
          </CardContent>
        </>
      )}
    </Card>
  );
}
