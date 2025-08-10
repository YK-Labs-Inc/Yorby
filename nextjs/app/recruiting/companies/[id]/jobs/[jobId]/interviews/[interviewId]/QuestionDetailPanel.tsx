"use client";

import React, { useState, useEffect, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Trash2 } from "lucide-react";
import { CodeEditor } from "@/components/ui/code-editor";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";
import { InterviewQuestion } from "@/app/recruiting/companies/[id]/jobs/[jobId]/interviews/[interviewId]/page";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/app/recruiting/companies/[id]/jobs/[jobId]/interviews/[interviewId]/actions";
import { Input } from "@/components/ui/input";

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
  const { logInfo, logError } = useAxiomLogging();
  const t = useTranslations("apply.recruiting.questionsTable");
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    timeLimitMs: 1800000, // Default 30 minutes in milliseconds
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [timeLimitError, setTimeLimitError] = useState<string | null>(null);
  const [solutionCodeError, setSolutionCodeError] = useState<string | null>(
    null
  );

  // Server action states
  const [createState, createFormAction, isCreating] = useActionState(
    createQuestion,
    { success: false, error: undefined }
  );

  const [updateState, updateFormAction, isUpdating] = useActionState(
    updateQuestion,
    { success: false, error: undefined }
  );

  const [deleteState, deleteFormAction, isDeleting] = useActionState(
    deleteQuestion,
    { success: false, error: undefined }
  );

  // Determine which action to use based on mode
  const formAction = mode === "create" ? createFormAction : updateFormAction;
  const isSaving = mode === "create" ? isCreating : isUpdating;

  // Update form data when question changes or mode changes
  useEffect(() => {
    setTimeLimitError(null); // Clear any validation errors
    setSolutionCodeError(null); // Clear solution code errors
    if (mode === "edit" && question) {
      setFormData({
        question: question.company_interview_question_bank.question,
        answer: question.company_interview_question_bank.answer,
        timeLimitMs:
          question.company_interview_question_bank
            .company_interview_coding_question_metadata?.time_limit_ms ||
          1800000,
      });
    } else if (mode === "create") {
      setFormData({
        question: "",
        answer: "",
        timeLimitMs: 1800000, // Default 30 minutes
      });
    }
  }, [question, mode]);

  // Handle create state changes
  useEffect(() => {
    if (createState.success) {
      logInfo("Question created successfully");
      toast.success(t("detailPanel.toast.questionCreated"), {
        description: t("detailPanel.toast.questionCreatedDescription"),
      });
      onClose();
    } else if (createState.error) {
      logError("Failed to create question", {
        error: createState.error,
      });
      toast.error(t("detailPanel.toast.error"), {
        description: createState.error || t("detailPanel.toast.createError"),
      });
    }
  }, [createState, logInfo, logError, onClose]);

  // Handle update state changes
  useEffect(() => {
    if (updateState.success) {
      logInfo("Question updated successfully");
      toast.success(t("detailPanel.toast.questionUpdated"), {
        description: t("detailPanel.toast.questionUpdatedDescription"),
      });
      onClose();
    } else if (updateState.error) {
      logError("Failed to update question", {
        error: updateState.error,
      });
      toast.error(t("detailPanel.toast.error"), {
        description: updateState.error || t("detailPanel.toast.updateError"),
      });
    }
  }, [updateState, logInfo, logError, onClose]);

  // Handle delete state changes
  useEffect(() => {
    if (deleteState.success) {
      logInfo("Question deleted successfully");
      toast.success(t("detailPanel.toast.questionDeleted"), {
        description: t("detailPanel.toast.questionDeletedDescription"),
      });
      setShowDeleteDialog(false);
      onClose();
    } else if (deleteState.error) {
      logError("Failed to delete question", {
        error: deleteState.error,
      });
      toast.error(t("detailPanel.toast.error"), {
        description: deleteState.error || t("detailPanel.toast.deleteError"),
      });
    }
  }, [deleteState, logInfo, logError, onClose]);

  const handleClose = () => {
    setFormData({ question: "", answer: "", timeLimitMs: 1800000 });
    setTimeLimitError(null);
    setSolutionCodeError(null);
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
          "fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l shadow-xl transition-transform duration-300 ease-in-out z-50 overflow-hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
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
          <form
            id="question-form"
            action={formAction}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {/* Hidden fields */}
              <input type="hidden" name="interview_id" value={interview.id} />
              <input type="hidden" name="job_id" value={jobId} />
              <input type="hidden" name="company_id" value={companyId} />
              {mode === "edit" && question && (
                <input
                  type="hidden"
                  name="question_id"
                  value={question.company_interview_question_bank.id}
                />
              )}

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
                    name="question"
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                    placeholder={t("editDialog.form.question.placeholder")}
                    className="min-h-[150px] resize-none text-base"
                  />
                </div>

                {/* Answer Guidelines Field / Code Editor */}
                <div className="space-y-2">
                  <Label
                    htmlFor="panel-answer"
                    className="text-base font-medium"
                  >
                    {interview.interview_type === "coding"
                      ? t("detailPanel.codingQuestion.solutionLabel")
                      : t("editDialog.form.answerGuidelines.label")}
                  </Label>
                  {interview.interview_type === "coding" ? (
                    <>
                      <CodeEditor
                        id="panel-answer"
                        name="answer"
                        value={formData.answer}
                        onChange={(value) => {
                          setFormData({ ...formData, answer: value });
                          // Clear error when user starts typing
                          if (value.trim() && solutionCodeError) {
                            setSolutionCodeError(null);
                          }
                        }}
                        placeholder={t(
                          "detailPanel.codingQuestion.solutionPlaceholder"
                        )}
                        minHeight="200px"
                        className={cn(
                          "text-base",
                          solutionCodeError && "border border-red-500 rounded"
                        )}
                      />
                      {solutionCodeError && (
                        <p className="text-sm text-red-500 mt-1">
                          {solutionCodeError}
                        </p>
                      )}
                    </>
                  ) : (
                    <Textarea
                      id="panel-answer"
                      name="answer"
                      value={formData.answer}
                      onChange={(e) =>
                        setFormData({ ...formData, answer: e.target.value })
                      }
                      placeholder={t(
                        "editDialog.form.answerGuidelines.placeholder"
                      )}
                      className="min-h-[200px] resize-none text-base"
                    />
                  )}
                </div>

                {/* Time Limit Field - Only for coding questions */}
                {interview.interview_type === "coding" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="panel-time-limit"
                      className="text-base font-medium"
                    >
                      {t("detailPanel.timeLimit.label")}
                    </Label>
                    <Input
                      id="panel-time-limit"
                      name="time_limit_minutes"
                      type="number"
                      min="1"
                      max="45"
                      value={
                        formData.timeLimitMs
                          ? Math.floor(formData.timeLimitMs / 60000)
                          : ""
                      }
                      onChange={(e) => {
                        const inputStr = e.target.value;

                        // Allow empty input
                        if (inputStr === "") {
                          setTimeLimitError(
                            t("detailPanel.timeLimit.errors.required")
                          );
                          setFormData({
                            ...formData,
                            timeLimitMs: 0, // Set to 0 to indicate empty
                          });
                          return;
                        }

                        const inputValue = parseInt(inputStr);

                        // Validate the input
                        if (!isNaN(inputValue)) {
                          if (inputValue < 1) {
                            setTimeLimitError(
                              t("detailPanel.timeLimit.errors.minimum")
                            );
                          } else if (inputValue > 45) {
                            setTimeLimitError(
                              t("detailPanel.timeLimit.errors.maximum")
                            );
                          } else {
                            setTimeLimitError(null);
                          }

                          // Always update the form data with the actual input value
                          setFormData({
                            ...formData,
                            timeLimitMs: inputValue * 60000,
                          });
                        }
                      }}
                      onBlur={(e) => {
                        // On blur, if the field is empty or invalid, set to default
                        const inputStr = e.target.value;
                        if (
                          inputStr === "" ||
                          parseInt(inputStr) < 1 ||
                          parseInt(inputStr) > 45
                        ) {
                          setFormData({
                            ...formData,
                            timeLimitMs: 1800000, // Default 30 minutes
                          });
                          setTimeLimitError(null);
                        }
                      }}
                      placeholder={t("detailPanel.timeLimit.placeholder")}
                      className={cn(
                        "text-base",
                        timeLimitError && "border-red-500"
                      )}
                    />
                    <input
                      type="hidden"
                      name="time_limit_ms"
                      value={formData.timeLimitMs || 1800000} // Default to 30 minutes if empty
                    />
                    {timeLimitError ? (
                      <p className="text-sm text-red-500">{timeLimitError}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t("detailPanel.timeLimit.description")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-background flex-shrink-0">
              <div className="flex items-center justify-between">
                {mode === "edit" && (
                  <Button
                    type="button"
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
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSaving}
                  >
                    {t("editDialog.buttons.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isSaving ||
                      !formData.question.trim() ||
                      (interview.interview_type === "coding" &&
                        (!!timeLimitError || !formData.answer.trim()))
                    }
                    onClick={(e) => {
                      // Validate solution code for coding questions
                      if (
                        interview.interview_type === "coding" &&
                        !formData.answer.trim()
                      ) {
                        e.preventDefault();
                        setSolutionCodeError(
                          t("detailPanel.codingQuestion.solutionRequired")
                        );
                      }
                    }}
                  >
                    {isSaving
                      ? t("detailPanel.buttons.saving")
                      : mode === "create"
                        ? t("createDialog.buttons.create")
                        : t("editDialog.buttons.save")}
                  </Button>
                </div>
              </div>
            </div>
          </form>
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
            <form id="delete-form" action={deleteFormAction}>
              <input
                type="hidden"
                name="job_interview_question_id"
                value={question?.id}
              />
              <input type="hidden" name="interview_id" value={interview.id} />
              <input type="hidden" name="job_id" value={jobId} />
              <input type="hidden" name="company_id" value={companyId} />
              <Button type="submit" disabled={isDeleting} variant="destructive">
                {isDeleting
                  ? t("detailPanel.buttons.deleting")
                  : t("deleteDialog.buttons.delete")}
              </Button>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
