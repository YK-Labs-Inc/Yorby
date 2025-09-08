"use client";

import { useEffect, useActionState, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, X, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import {
  createJobInterview,
  updateJobInterview,
  deleteJobInterview,
} from "./actions";
import { Database } from "@/utils/supabase/database.types";
import { cn } from "@/lib/utils";
import { Tables } from "@/utils/supabase/database.types";

type InterviewType = Database["public"]["Enums"]["job_interview_type"];
type InterviewWeight = Database["public"]["Enums"]["interview_weight"];
type JobInterview = Tables<"job_interviews">;

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, t("form.validation.nameMin")),
    interview_type: z.enum(["general", "coding"] as [
      InterviewType,
      InterviewType,
    ]),
    weight: z.enum(["low", "normal", "high"] as [
      InterviewWeight,
      InterviewWeight,
      InterviewWeight,
    ]),
  });

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface CreateJobInterviewPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  currentInterviewsCount: number;
  mode: "create" | "edit";
  interview: JobInterview | null;
}

export function CreateJobInterviewPanel({
  open,
  onOpenChange,
  jobId,
  currentInterviewsCount,
  mode,
  interview,
}: CreateJobInterviewPanelProps) {
  const { logError } = useAxiomLogging();
  const t = useTranslations("apply.recruiting.createJobInterviewDialog");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formSchema = createFormSchema(t);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      interview_type: "general",
      weight: "normal",
    },
  });

  const [createState, createFormAction, isCreating] = useActionState(
    createJobInterview,
    {
      success: false,
      error: undefined,
    }
  );

  const [updateState, updateFormAction, isUpdating] = useActionState(
    updateJobInterview,
    {
      success: false,
      error: undefined,
    }
  );

  const [deleteState, deleteFormAction, isDeleting] = useActionState(
    deleteJobInterview,
    {
      success: false,
      error: undefined,
    }
  );

  // Determine which state and action to use based on mode
  const formAction = mode === "create" ? createFormAction : updateFormAction;
  const pending = mode === "create" ? isCreating : isUpdating;

  // Update form data when interview changes or mode changes
  useEffect(() => {
    if (mode === "edit" && interview) {
      form.reset({
        name: interview.name,
        interview_type: interview.interview_type as InterviewType,
        weight: interview.weight as InterviewWeight,
      });
    } else if (mode === "create") {
      form.reset({
        name: "",
        interview_type: "general",
        weight: "normal",
      });
    }
  }, [interview, mode, form, open]);

  // Handle create state changes
  useEffect(() => {
    if (createState.success) {
      toast.success(t("success"));
      onOpenChange(false);
    } else if (!createState.success && createState.error) {
      logError("Error creating job interview:", {
        error: createState.error,
        jobId,
      });
      toast.error(createState.error || t("error"));
    }
  }, [createState, onOpenChange, logError, jobId, t]);

  // Handle update state changes
  useEffect(() => {
    if (updateState.success) {
      toast.success(t("updateSuccess"));
      onOpenChange(false);
    } else if (!updateState.success && updateState.error) {
      logError("Error updating job interview:", {
        error: updateState.error,
        jobId,
      });
      toast.error(updateState.error || t("updateError"));
    }
  }, [updateState, onOpenChange, logError, jobId, t]);

  useEffect(() => {
    if (deleteState.success) {
      toast.success(t("deleteSuccess"));
      setShowDeleteDialog(false);
      onOpenChange(false);
    } else if (!deleteState.success && deleteState.error) {
      logError("Failed to delete interview round", {
        error: deleteState.error,
        jobId,
      });
      toast.error(deleteState.error || t("deleteError"));
    }
  }, [deleteState, t, onOpenChange, logError, jobId]);

  // Handle Escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [open]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity z-50",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l shadow-xl transition-transform duration-300 ease-in-out z-50",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-semibold">
              {mode === "create" ? t("title") : t("editTitle")}
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
            <p className="text-muted-foreground mb-6">
              {mode === "create" ? t("description") : t("editDescription")}
            </p>
            <Form {...form}>
              <form
                action={formAction}
                className="space-y-6"
                id="job-interview-form"
              >
                <input type="hidden" name="custom_job_id" value={jobId} />
                {mode === "create" && (
                  <input
                    type="hidden"
                    name="order_index"
                    value={currentInterviewsCount}
                  />
                )}
                {mode === "edit" && interview && (
                  <input
                    type="hidden"
                    name="interview_id"
                    value={interview.id}
                  />
                )}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.name.label")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("form.name.placeholder")}
                          {...field}
                          name="name"
                        />
                      </FormControl>
                      <FormDescription>
                        {t("form.name.description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interview_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.interviewType.label")}</FormLabel>
                      <input
                        type="hidden"
                        name="interview_type"
                        value={field.value}
                      />
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("form.interviewType.placeholder")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">
                            {t("form.interviewType.options.general")}
                          </SelectItem>
                          <SelectItem value="coding">
                            {t("form.interviewType.options.coding")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("form.interviewType.description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.weight.label")}</FormLabel>
                      <input
                        type="hidden"
                        name="weight"
                        value={field.value}
                      />
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("form.weight.placeholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">
                            {t("form.weight.options.low")}
                          </SelectItem>
                          <SelectItem value="normal">
                            {t("form.weight.options.normal")}
                          </SelectItem>
                          <SelectItem value="high">
                            {t("form.weight.options.high")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("form.weight.description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
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
                  {t("buttons.delete")}
                </Button>
              )}
              {mode === "create" && <div />}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={pending}
                >
                  {t("buttons.cancel")}
                </Button>
                <Button
                  onClick={() => {
                    const formElement = document.getElementById(
                      "job-interview-form"
                    ) as HTMLFormElement;
                    formElement?.requestSubmit();
                  }}
                  disabled={pending || !form.formState.isValid}
                >
                  {pending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === "create"
                        ? t("buttons.creating")
                        : t("buttons.updating")}
                    </>
                  ) : mode === "create" ? (
                    t("buttons.create")
                  ) : (
                    t("buttons.update")
                  )}
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
              {t("buttons.cancel")}
            </AlertDialogCancel>
            <form action={deleteFormAction}>
              <input type="hidden" name="custom_job_id" value={jobId} />
              <input type="hidden" name="interview_id" value={interview?.id} />
              <Button type="submit" disabled={isDeleting} variant="destructive">
                {isDeleting ? t("buttons.deleting") : t("buttons.delete")}
              </Button>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden delete form */}
      {mode === "edit" && interview && (
        <form id="delete-interview-form" action={deleteFormAction} hidden>
          <input type="hidden" name="interview_id" value={interview.id} />
          <input type="hidden" name="custom_job_id" value={jobId} />
        </form>
      )}
    </>
  );
}
