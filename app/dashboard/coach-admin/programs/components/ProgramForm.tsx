"use client";

import React, { useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createCustomJob } from "../new/actions";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useTranslations } from "next-intl";
import { updateCustomJob } from "../[programId]/edit/actions";
import { Textarea } from "@/components/ui/textarea";

interface ProgramFormProps {
  initialValues?: {
    title?: string;
    description?: string;
  };
  onCancelRedirectUrl: string;
  isEditing?: boolean;
  programId?: string;
}

export default function ProgramForm({
  initialValues = {},
  onCancelRedirectUrl,
  isEditing = false,
  programId,
}: ProgramFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logError } = useAxiomLogging();
  const router = useRouter();
  const t = useTranslations("coachAdminPortal.programsPage.programForm");

  // Define the form schema with validation (moved inside component to access t)
  const jobFormSchema = z.object({
    title: z.string().min(3, {
      message: t("requiredTitle"),
    }),
    job_description: z.string().optional(),
  });

  type JobFormValues = z.infer<typeof jobFormSchema>;

  // Initialize the form with default values or provided initial values
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: initialValues.title || "",
      job_description: initialValues.description || "",
    },
  });

  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof jobFormSchema>) => {
    setIsSubmitting(true);
    setError(null);
    const title = values.title;
    const job_description = values.job_description || "";
    try {
      if (isEditing && programId) {
        await handleEditJob(title, job_description, programId);
      } else {
        await handleCreateJob(title, job_description);
      }
    } catch (err) {
      setError(t("genericError"));
      logError("Create job form submission error:", { error: err });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateJob = async (title: string, job_description: string) => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("job_description", job_description);
    const result = await createCustomJob(formData);
    if (result.success) {
      router.push(`/dashboard/coach-admin/programs/${result.programId}`);
    } else {
      setError(result.message || t("genericError"));
    }
  };

  const handleEditJob = async (
    title: string,
    job_description: string,
    programId: string
  ) => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("job_description", job_description);
    formData.append("programId", programId);
    const result = await updateCustomJob(formData);
    if (result.success) {
      router.push(`/dashboard/coach-admin/programs/${programId}`);
    } else {
      setError(result.message || t("genericError"));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? t("titleEdit") : t("titleCreate")}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            {/* Error alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("errorTitle")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Program Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("programTitleLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("programTitlePlaceholder")}
                      {...field}
                      name="programTitle"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Program Description */}
            <FormField
              control={form.control}
              name="job_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("programDescriptionLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("programDescriptionPlaceholder")}
                      {...field}
                      name="job_description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => redirect(onCancelRedirectUrl)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? t("saving") : t("creating")}
                </>
              ) : isEditing ? (
                t("saveChanges")
              ) : (
                t("create")
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
