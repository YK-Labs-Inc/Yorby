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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import { Loader2, X, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { createJob, updateJob, deleteJob } from "./actions";
import { cn } from "@/lib/utils";
import { Tables } from "@/utils/supabase/database.types";

type Job = Tables<"custom_jobs"> & {
  company_job_candidates?: { count: number }[];
};

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    job_title: z.string().min(2, t("form.validation.titleMin")),
    job_description: z.string().min(10, t("form.validation.descriptionMin")),
  });

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface JobDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  mode: "create" | "edit";
  job: Job | null;
}

export function JobDetailPanel({
  open,
  onOpenChange,
  companyId,
  mode,
  job,
}: JobDetailPanelProps) {
  const { logError } = useAxiomLogging();
  const t = useTranslations("apply.createJobDialog");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formSchema = createFormSchema(t);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      job_title: "",
      job_description: "",
    },
  });

  const [createState, createFormAction, isCreating] = useActionState(
    createJob,
    {
      success: false,
      error: "",
    }
  );

  const [updateState, updateFormAction, isUpdating] = useActionState(
    updateJob,
    {
      success: false,
      error: undefined,
    }
  );

  const [deleteState, deleteFormAction, isDeleting] = useActionState(
    deleteJob,
    {
      success: false,
      error: undefined,
    }
  );

  // Determine which state and action to use based on mode
  const formAction = mode === "create" ? createFormAction : updateFormAction;
  const pending = mode === "create" ? isCreating : isUpdating;

  // Update form data when job changes or mode changes
  useEffect(() => {
    if (mode === "edit" && job) {
      form.reset({
        job_title: job.job_title,
        job_description: job.job_description || "",
      });
    } else if (mode === "create") {
      form.reset({
        job_title: "",
        job_description: "",
      });
    }
  }, [job, mode, form, open]);

  // Handle create state changes
  useEffect(() => {
    if (createState.error) {
      logError("Error creating job:", {
        error: createState.error,
        companyId,
      });
      toast.error(createState.error || t("createError"));
    }
  }, [createState, onOpenChange, logError, companyId, t]);

  // Handle update state changes
  useEffect(() => {
    if (updateState.success) {
      toast.success(t("updateSuccess"));
      onOpenChange(false);
    } else if (!updateState.success && updateState.error) {
      logError("Error updating job:", {
        error: updateState.error,
        companyId,
      });
      toast.error(updateState.error || t("updateError"));
    }
  }, [updateState, onOpenChange, logError, companyId, t]);

  // Handle delete state changes
  useEffect(() => {
    if (deleteState.success) {
      toast.success(t("deleteSuccess"));
      setShowDeleteDialog(false);
      onOpenChange(false);
    } else if (!deleteState.success && deleteState.error) {
      logError("Failed to delete job", {
        error: deleteState.error,
        companyId,
      });
      toast.error(deleteState.error || t("deleteError"));
    }
  }, [deleteState, t, onOpenChange, logError, companyId]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

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
              {mode === "create" ? t("title") : t("title")}
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
              {mode === "create" ? t("description") : t("description")}
            </p>
            <Form {...form}>
              <form
                id="job-detail-form"
                action={formAction}
                className="space-y-6"
              >
                <input type="hidden" name="company_id" value={companyId} />
                {mode === "edit" && job && (
                  <input type="hidden" name="job_id" value={job.id} />
                )}
                <FormField
                  control={form.control}
                  name="job_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.jobTitle.label")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("form.jobTitle.placeholder")}
                          {...field}
                          name="job_title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="job_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.jobDescription.label")}</FormLabel>
                      <FormControl>
                        <div>
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t("form.jobDescription.placeholder")}
                            minHeight="200px"
                          />
                          <input
                            type="hidden"
                            name="job_description"
                            value={field.value}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        {t("form.jobDescription.description")}
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
                  {t("buttons.delete") || "Delete"}
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
                      "job-detail-form"
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
                        : t("buttons.creating")}
                    </>
                  ) : mode === "create" ? (
                    t("buttons.create")
                  ) : (
                    t("buttons.create")
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
            <AlertDialogTitle>
              {t("deleteDialog.title") || "Delete Job?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description") ||
                "This action cannot be undone. This will permanently delete the job and all associated data."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("buttons.cancel")}
            </AlertDialogCancel>
            <form action={deleteFormAction}>
              <input type="hidden" name="company_id" value={companyId} />
              <input type="hidden" name="job_id" value={job?.id} />
              <Button type="submit" disabled={isDeleting} variant="destructive">
                {isDeleting
                  ? t("buttons.deleting") || "Deleting..."
                  : t("buttons.delete") || "Delete"}
              </Button>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
