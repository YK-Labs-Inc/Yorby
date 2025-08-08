"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";
import { InterviewQuestion } from "@/app/recruiting/companies/[id]/jobs/[jobId]/interviews/[interviewId]/page";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/app/recruiting/companies/[id]/jobs/[jobId]/interviews/[interviewId]/actions";

interface QuestionDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  question: InterviewQuestion | null;
  interview: Tables<"job_interviews">;
  jobId: string;
  companyId: string;
}

export default function QuestionDetailPanel({
  isOpen,
  onClose,
  mode,
  question,
  interview,
  jobId,
  companyId,
}: QuestionDetailPanelProps) {
  const { toast } = useToast();
  const { logInfo, logError } = useAxiomLogging();
  const t = useTranslations("apply.recruiting.questionsTable");
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Update form data when question changes or mode changes
  useEffect(() => {
    if (mode === "edit" && question) {
      setFormData({
        question: question.company_interview_question_bank.question,
        answer: question.company_interview_question_bank.answer,
      });
    } else if (mode === "create") {
      setFormData({
        question: "",
        answer: "",
      });
    }
  }, [question, mode]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (mode === "create") {
        // Create new question
        const result = await createQuestion(
          interview.id,
          jobId,
          companyId,
          formData
        );

        if (!result.success) {
          throw new Error(result.error || "Failed to create question");
        }

        logInfo("Question created successfully", {
          interviewId: interview.id,
        });
        toast({
          title: "Question created",
          description: "The new question has been successfully created.",
        });
      } else if (mode === "edit" && question) {
        // Update existing question
        const result = await updateQuestion(
          question.company_interview_question_bank.id,
          interview.id,
          companyId,
          jobId,
          formData
        );

        if (!result.success) {
          throw new Error(result.error || "Failed to update question");
        }

        logInfo("Question updated successfully", {
          questionId: question.id,
          interviewId: interview.id,
        });
        toast({
          title: "Question updated",
          description: "The question has been successfully updated.",
        });
      }

      onClose();
    } catch (error: any) {
      const action = mode === "create" ? "create" : "update";
      logError(`Failed to ${action} question`, {
        error: error.message,
        interviewId: interview.id,
        questionId: question?.id,
      });
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} question`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!question) return;

    setIsDeleting(true);
    try {
      const result = await deleteQuestion(
        question.id,
        interview.id,
        jobId,
        companyId
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to delete question");
      }

      logInfo("Question deleted successfully", {
        questionId: question.id,
        interviewId: interview.id,
      });
      toast({
        title: "Question deleted",
        description: "The question has been successfully deleted.",
      });

      setShowDeleteDialog(false);
      onClose();
    } catch (error: any) {
      logError("Failed to delete question", {
        error: error.message,
        questionId: question.id,
        interviewId: interview.id,
      });
      toast({
        title: "Error",
        description: error.message || "Failed to delete question",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setFormData({ question: "", answer: "" });
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity z-50",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l shadow-xl transition-transform duration-300 ease-in-out z-50",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-semibold">
              {mode === "create"
                ? t("createDialog.title")
                : t("detailPanel.title")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Question Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="panel-question"
                  className="text-base font-medium"
                >
                  {t("editDialog.form.question.label")}
                </Label>
                <Textarea
                  id="panel-question"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder={t("editDialog.form.question.placeholder")}
                  className="min-h-[150px] resize-none text-base"
                />
              </div>

              {/* Answer Guidelines Field */}
              <div className="space-y-2">
                <Label htmlFor="panel-answer" className="text-base font-medium">
                  {t("editDialog.form.answerGuidelines.label")}
                </Label>
                <Textarea
                  id="panel-answer"
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  placeholder={t(
                    "editDialog.form.answerGuidelines.placeholder"
                  )}
                  className="min-h-[200px] resize-none text-base"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t">
            <div className="flex items-center justify-between">
              {mode === "edit" && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("table.actions.delete")}
                </Button>
              )}
              {mode === "create" && <div />}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSaving}
                >
                  {t("editDialog.buttons.cancel")}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !formData.question.trim()}
                >
                  {isSaving
                    ? "Saving..."
                    : mode === "create"
                      ? t("createDialog.buttons.create")
                      : t("editDialog.buttons.save")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("deleteDialog.buttons.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : t("deleteDialog.buttons.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
