"use client";

import { useState, useActionState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
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
  AlertDialogAction,
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
  createCompany,
  updateCompany,
  deleteCompany,
} from "@/app/recruiting/actions";
import { cn } from "@/lib/utils";
import { Tables } from "@/utils/supabase/database.types";

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, t("form.validation.nameMin")),
    website: z.string().optional(),
    industry: z.string().optional(),
    company_size: z.string().optional(),
  });

type FormData = z.infer<ReturnType<typeof createFormSchema>>;
type Company = Tables<"companies">;

interface CompanyDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  mode: "create" | "edit";
  company: Company | null;
}

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

const INDUSTRIES = [
  { key: "technology", value: "Technology" },
  { key: "healthcare", value: "Healthcare" },
  { key: "finance", value: "Finance" },
  { key: "education", value: "Education" },
  { key: "retail", value: "Retail" },
  { key: "manufacturing", value: "Manufacturing" },
  { key: "consulting", value: "Consulting" },
  { key: "realEstate", value: "Real Estate" },
  { key: "mediaEntertainment", value: "Media & Entertainment" },
  { key: "transportation", value: "Transportation" },
  { key: "other", value: "Other" },
];

export function CompanyDetailPanel({
  open,
  onOpenChange,
  userId,
  mode,
  company,
}: CompanyDetailPanelProps) {
  const { logError } = useAxiomLogging();
  const t = useTranslations("recruiting.createCompanyDialog");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formSchema = createFormSchema(t);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      website: "",
      industry: "",
      company_size: "",
    },
  });

  const [createState, createFormAction, isCreating] = useActionState(
    createCompany,
    {
      success: false,
      error: "",
    }
  );

  const [updateState, updateFormAction, isUpdating] = useActionState(
    updateCompany,
    {
      success: false,
      error: undefined,
    }
  );

  const [deleteState, deleteFormAction, isDeleting] = useActionState(
    deleteCompany,
    {
      success: false,
      error: undefined,
    }
  );

  // Determine which state and action to use based on mode
  const formAction = mode === "create" ? createFormAction : updateFormAction;
  const pending = mode === "create" ? isCreating : isUpdating;

  // Update form data when company changes or mode changes
  useEffect(() => {
    if (mode === "edit" && company) {
      form.reset({
        name: company.name,
        website: company.website || "",
        industry: company.industry || "",
        company_size: company.company_size || "",
      });
    } else if (mode === "create") {
      form.reset({
        name: "",
        website: "",
        industry: "",
        company_size: "",
      });
    }
  }, [company, mode, form]);

  // Handle create state changes
  useEffect(() => {
    if (createState.success) {
      toast.success(t("success"));
      onOpenChange(false);
      form.reset();
    } else if (createState.error) {
      logError("Error creating company:", {
        error: createState.error,
      });
      toast.error(createState.error || t("error"));
    }
  }, [createState, onOpenChange, logError, t, form]);

  // Handle update state changes
  useEffect(() => {
    if (updateState.success) {
      toast.success(t("updateSuccess") || "Company updated successfully!");
      onOpenChange(false);
    } else if (!updateState.success && updateState.error) {
      logError("Error updating company:", {
        error: updateState.error,
      });
      toast.error(
        updateState.error || t("updateError") || "Failed to update company"
      );
    }
  }, [updateState, onOpenChange, logError, t]);

  // Handle delete state changes
  useEffect(() => {
    if (deleteState.success) {
      toast.success(t("deleteSuccess") || "Company deleted successfully!");
      setShowDeleteDialog(false);
      onOpenChange(false);
    } else if (!deleteState.success && deleteState.error) {
      logError("Failed to delete company", {
        error: deleteState.error,
      });
      toast.error(
        deleteState.error || t("deleteError") || "Failed to delete company"
      );
    }
  }, [deleteState, t, onOpenChange, logError]);

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
              {mode === "create"
                ? t("title")
                : t("editTitle") || "Edit Company"}
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
              {mode === "create"
                ? t("description")
                : t("editDescription") || "Update the company information"}
            </p>
            <Form {...form}>
              <form action={formAction} className="space-y-6">
                {mode === "edit" && company && (
                  <input type="hidden" name="company_id" value={company.id} />
                )}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.companyName.label")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("form.companyName.placeholder")}
                          {...field}
                          name="name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.website.label")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("form.website.placeholder")}
                          {...field}
                          name="website"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.industry.label")}</FormLabel>
                      <input
                        type="hidden"
                        name="industry"
                        value={field.value}
                      />
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("form.industry.placeholder")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INDUSTRIES.map((industry) => (
                            <SelectItem
                              key={industry.key}
                              value={industry.value}
                            >
                              {t(`form.industry.options.${industry.key}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.companySize.label")}</FormLabel>
                      <input
                        type="hidden"
                        name="company_size"
                        value={field.value}
                      />
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("form.companySize.placeholder")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMPANY_SIZES.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size} {t("form.companySize.employees")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    const formElement = document.querySelector(
                      "form"
                    ) as HTMLFormElement;
                    formElement?.requestSubmit();
                  }}
                  disabled={pending}
                >
                  {pending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === "create"
                        ? t("buttons.creating")
                        : t("buttons.updating") || "Updating..."}
                    </>
                  ) : mode === "create" ? (
                    t("buttons.create")
                  ) : (
                    t("buttons.update") || "Update"
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
              {t("deleteDialog.title") || "Delete Company?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description") ||
                "This action cannot be undone. This will permanently delete the company and all associated data including jobs, candidates, and interviews."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("buttons.cancel")}
            </AlertDialogCancel>
            <form action={deleteFormAction}>
              <input type="hidden" name="company_id" value={company?.id} />
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
