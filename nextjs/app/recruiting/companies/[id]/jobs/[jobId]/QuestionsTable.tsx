"use client";

import { useState } from "react";
import useSWR from "swr";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { createQuestion, updateQuestion, deleteQuestion } from "./actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  MoreHorizontal,
  Pencil,
  Trash,
  Plus,
  Loader2,
} from "lucide-react";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Tables } from "@/utils/supabase/database.types";
import { useTranslations } from "next-intl";

type Question = Tables<"custom_job_questions">;

interface QuestionsTableProps {
  jobId: string;
}

// Fetcher function for SWR
const fetchQuestions = async (jobId: string) => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("custom_job_questions")
    .select("*")
    .eq("custom_job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Question[];
};

export default function QuestionsTable({ jobId }: QuestionsTableProps) {
  const { toast } = useToast();
  const { logInfo, logError } = useAxiomLogging();
  const t = useTranslations("recruiting.questionsTable");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    question: "",
    answer_guidelines: "",
    publication_status: "published" as "published" | "draft",
  });
  const [createForm, setCreateForm] = useState({
    question: "",
    answer_guidelines: "",
    publication_status: "published" as "published" | "draft",
  });

  const {
    data: questions,
    error,
    isLoading,
    mutate: mutateQuestions,
  } = useSWR(`questions-${jobId}`, () => fetchQuestions(jobId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // Start editing a question
  const startEditing = (question: Question) => {
    setEditingId(question.id);
    setEditForm({
      question: question.question,
      answer_guidelines: question.answer_guidelines,
      publication_status: question.publication_status,
    });
    setIsEditDialogOpen(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({
      question: "",
      answer_guidelines: "",
      publication_status: "published",
    });
    setIsEditDialogOpen(false);
  };

  // Save edited question
  const saveQuestion = async () => {
    if (!editingId) return;
    
    try {
      const result = await updateQuestion(editingId, jobId, editForm);

      if (!result.success) {
        throw new Error(result.error || "Failed to update question");
      }

      logInfo("Question updated successfully", { questionId: editingId, jobId });
      toast({
        title: t("toast.questionUpdated.title"),
        description: t("toast.questionUpdated.description"),
      });

      // Revalidate the data
      await mutateQuestions();
      cancelEditing();
    } catch (error: any) {
      logError("Failed to update question", {
        error: error.message,
        questionId: editingId,
        jobId,
      });
      toast({
        title: t("toast.error.title"),
        description:
          error.message || t("toast.error.updateFailed"),
        variant: "destructive",
      });
    }
  };

  // Create new question
  const handleCreateQuestion = async () => {
    try {
      const result = await createQuestion(jobId, {
        ...createForm,
        question_type: "user_generated",
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create question");
      }

      logInfo("Question created successfully", { jobId });
      toast({
        title: t("toast.questionCreated.title"),
        description: t("toast.questionCreated.description"),
      });

      // Revalidate the data
      await mutateQuestions();
      setIsCreateDialogOpen(false);
      setCreateForm({
        question: "",
        answer_guidelines: "",
        publication_status: "published",
      });
    } catch (error: any) {
      logError("Failed to create question", {
        error: error.message,
        jobId,
      });
      toast({
        title: t("toast.error.title"),
        description:
          error.message || t("toast.error.createFailed"),
        variant: "destructive",
      });
    }
  };

  // Delete question
  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const result = await deleteQuestion(questionId, jobId);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete question");
      }

      logInfo("Question deleted successfully", { questionId, jobId });
      toast({
        title: t("toast.questionDeleted.title"),
        description: t("toast.questionDeleted.description"),
      });

      // Revalidate the data
      await mutateQuestions();
      setDeletingId(null);
    } catch (error: any) {
      logError("Failed to delete question", {
        error: error.message,
        questionId,
        jobId,
      });
      toast({
        title: t("toast.error.title"),
        description:
          error.message || t("toast.error.deleteFailed"),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        {t("loading.error")}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("addQuestion")}
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.headers.question")}</TableHead>
              <TableHead>{t("table.headers.answerGuidelines")}</TableHead>
              <TableHead className="w-[100px]">{t("table.headers.status")}</TableHead>
              <TableHead className="w-[70px]">{t("table.headers.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions?.map((question) => (
              <TableRow key={question.id}>
                <TableCell>
                  <p className="whitespace-pre-wrap">{question.question}</p>
                </TableCell>
                <TableCell>
                  <p className="whitespace-pre-wrap line-clamp-3">
                    {question.answer_guidelines}
                  </p>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      question.publication_status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {t(`table.status.${question.publication_status}`)}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => startEditing(question)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        {t("table.actions.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingId(question.id)}
                        className="text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        {t("table.actions.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Question Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("createDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("createDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="question">{t("createDialog.form.question.label")}</Label>
              <Textarea
                id="question"
                value={createForm.question}
                onChange={(e) =>
                  setCreateForm({ ...createForm, question: e.target.value })
                }
                placeholder={t("createDialog.form.question.placeholder")}
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="answer_guidelines">{t("createDialog.form.answerGuidelines.label")}</Label>
              <Textarea
                id="answer_guidelines"
                value={createForm.answer_guidelines}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    answer_guidelines: e.target.value,
                  })
                }
                placeholder={t("createDialog.form.answerGuidelines.placeholder")}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="publication_status"
                checked={createForm.publication_status === "published"}
                onCheckedChange={(checked) =>
                  setCreateForm({
                    ...createForm,
                    publication_status: checked ? "published" : "draft",
                  })
                }
              />
              <Label htmlFor="publication_status">{t("createDialog.form.publishImmediately")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              {t("createDialog.buttons.cancel")}
            </Button>
            <Button onClick={handleCreateQuestion}>{t("createDialog.buttons.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("editDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("editDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-question">{t("editDialog.form.question.label")}</Label>
              <Textarea
                id="edit-question"
                value={editForm.question}
                onChange={(e) =>
                  setEditForm({ ...editForm, question: e.target.value })
                }
                placeholder={t("editDialog.form.question.placeholder")}
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-answer_guidelines">{t("editDialog.form.answerGuidelines.label")}</Label>
              <Textarea
                id="edit-answer_guidelines"
                value={editForm.answer_guidelines}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    answer_guidelines: e.target.value,
                  })
                }
                placeholder={t("editDialog.form.answerGuidelines.placeholder")}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-publication_status"
                checked={editForm.publication_status === "published"}
                onCheckedChange={(checked) =>
                  setEditForm({
                    ...editForm,
                    publication_status: checked ? "published" : "draft",
                  })
                }
              />
              <Label htmlFor="edit-publication_status">{t("editDialog.form.published")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelEditing}
            >
              {t("editDialog.buttons.cancel")}
            </Button>
            <Button onClick={saveQuestion}>{t("editDialog.buttons.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("deleteDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              {t("deleteDialog.buttons.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingId && handleDeleteQuestion(deletingId)}
            >
              {t("deleteDialog.buttons.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
