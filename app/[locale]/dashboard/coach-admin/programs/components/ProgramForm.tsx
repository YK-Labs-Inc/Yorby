"use client";

import React, { useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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

interface JobFormProps {
  initialValues?: {
    title?: string;
    description?: string;
  };
  onCancelRedirectUrl: string;
  isEditing?: boolean;
  submitAction?: (formData: FormData) => Promise<any>; // New prop for custom submit action
}

export default function JobForm({
  initialValues = {},
  onCancelRedirectUrl,
  isEditing = false,
  submitAction,
}: JobFormProps) {
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
  });

  type JobFormValues = z.infer<typeof jobFormSchema>;

  // Initialize the form with default values or provided initial values
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: initialValues.title || "",
    },
  });

  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof jobFormSchema>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", values.title);
      
      // Use the provided submitAction if available, otherwise use createCustomJob
      const result = submitAction 
        ? await submitAction(formData) 
        : await createCustomJob(formData);

      if (result.success) {
        if (isEditing) {
          // For editing, redirect to the cancel URL (which should be the detail page)
          router.push(onCancelRedirectUrl);
        } else {
          // For creating, navigate to the new program page
          router.push(`/dashboard/coach-admin/programs/${result.programId}`);
        }
      } else {
        setError(result.message || t("genericError"));
      }
    } catch (err) {
      setError(t("genericError"));
      logError(`${isEditing ? "Update" : "Create"} job form submission error:`, { error: err });
    } finally {
      setIsSubmitting(false);
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
