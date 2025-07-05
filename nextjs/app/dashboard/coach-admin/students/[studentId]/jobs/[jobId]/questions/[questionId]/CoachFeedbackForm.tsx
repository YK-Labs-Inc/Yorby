"use client";

import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";
import { useRouter } from "next/navigation";
import { createCoachFeedback } from "./actions";
import { updateCoachFeedback } from "./actions";

interface CoachFeedbackFormProps {
  submissionId: string;
  existingFeedback?: Tables<"custom_job_question_submission_feedback"> | null;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function CoachFeedbackForm({
  submissionId,
  existingFeedback,
  onComplete,
  onCancel,
}: CoachFeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("coachAdminPortal.studentsPage.feedbackForm");
  const router = useRouter();

  const feedbackFormSchema = z
    .object({
      pros: z.array(z.string()),
      cons: z.array(z.string()),
    })
    .refine(
      (data) => {
        const hasPros = data.pros && data.pros.some((p) => p.trim().length > 0);
        const hasCons = data.cons && data.cons.some((c) => c.trim().length > 0);
        return hasPros || hasCons;
      },
      {
        message: t("errors.bothEmpty"),
        path: ["pros"], // Attach error to pros for simplicity
      }
    );

  type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      pros: existingFeedback?.pros || [],
      cons: existingFeedback?.cons || [],
    },
  });

  const handleSubmit = async (data: FeedbackFormValues) => {
    setIsSubmitting(true);
    setError(null);
    // Clean up empty single-field arrays
    const cleanedPros =
      data.pros.length === 1 && data.pros[0].trim() === "" ? [] : data.pros;
    const cleanedCons =
      data.cons.length === 1 && data.cons[0].trim() === "" ? [] : data.cons;
    try {
      const formData = new FormData();
      formData.append("submissionId", submissionId);
      formData.append("pros", JSON.stringify(cleanedPros));
      formData.append("cons", JSON.stringify(cleanedCons));
      if (existingFeedback) {
        formData.append("feedbackId", existingFeedback.id);
        await updateCoachFeedback(formData);
      } else {
        await createCoachFeedback(formData);
      }
      router.refresh();
      if (onComplete) onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const addField = (field: "pros" | "cons") => {
    const currentValues = form.getValues(field);
    form.setValue(field, [...currentValues, ""]);
  };

  const removeField = (field: "pros" | "cons", index: number) => {
    const currentValues = form.getValues(field);
    form.setValue(
      field,
      currentValues.filter((_, i) => i !== index)
    );
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>{existingFeedback ? t("editTitle") : t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("errors.title")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {form.formState.errors.pros?.message && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("errors.title")}</AlertTitle>
                <AlertDescription>
                  {form.formState.errors.pros.message}
                </AlertDescription>
              </Alert>
            )}
            {/* Pros */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel>{t("prosLabel")}</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addField("pros")}
                >
                  {t("addPro")}
                </Button>
              </div>
              {form.watch("pros").map((_, index) => (
                <div key={`pro-${index}`} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`pros.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Textarea
                            placeholder={t("prosPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("pros").length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField("pros", index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {/* Cons */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel>{t("consLabel")}</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addField("cons")}
                >
                  {t("addCon")}
                </Button>
              </div>
              {form.watch("cons").map((_, index) => (
                <div key={`con-${index}`} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`cons.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Textarea
                            placeholder={t("consPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("cons").length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField("cons", index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else if (onComplete) {
                  onComplete();
                }
              }}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : existingFeedback ? (
                t("update")
              ) : (
                t("submit")
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
