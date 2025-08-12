"use client";

import { useCallback, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { Tables } from "@/utils/supabase/database.types";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { InterviewQuestion } from "./page";
import QuestionDetailPanel from "@/app/recruiting/companies/[id]/jobs/[jobId]/interviews/[interviewId]/QuestionDetailPanel";

interface QuestionsTableProps {
  interview: Tables<"job_interviews">;
  jobId: string;
  jobTitle: string;
  companyId: string;
  questions: InterviewQuestion[];
}

export default function QuestionsTable({
  interview,
  jobId,
  jobTitle,
  companyId,
  questions,
}: QuestionsTableProps) {
  const t = useTranslations("apply.recruiting.questionsTable");
  const [selectedQuestion, setSelectedQuestion] =
    useState<InterviewQuestion | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "edit">("edit");

  // Open question detail panel for editing
  const openQuestionDetail = (question: InterviewQuestion) => {
    setSelectedQuestion(question);
    setPanelMode("edit");
    setIsDetailPanelOpen(true);
  };

  // Open panel for creating new question
  const openCreatePanel = () => {
    setSelectedQuestion(null);
    setPanelMode("create");
    setIsDetailPanelOpen(true);
  };

  const onClose = useCallback(() => {
    setIsDetailPanelOpen(false);
    setSelectedQuestion(null);
  }, []);

  return (
    <div className="relative">
      <div className={cn("transition-all duration-300 ease-in-out")}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold">
              {interview.name} {t("title")}
            </h2>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Button onClick={openCreatePanel}>
            <Plus className="h-4 w-4 mr-2" />
            {t("addQuestion")}
          </Button>
        </div>

        {questions.length === 0 ? (
          <div className="py-12">
            <div className="max-w-4xl mx-auto px-4">
              {/* Header Section */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  {t("emptyState.title")}
                </h3>
              </div>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.headers.question")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <TableRow
                    key={question.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors hover:underline"
                    onClick={() => openQuestionDetail(question)}
                  >
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2">
                        {question.company_interview_question_bank.question}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Question Detail Panel */}
        <QuestionDetailPanel
          isOpen={isDetailPanelOpen}
          onClose={onClose}
          mode={panelMode}
          question={selectedQuestion}
          interview={interview}
          jobId={jobId}
          companyId={companyId}
        />
      </div>
    </div>
  );
}
