"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
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
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { createSampleAnswer } from "../[programId]/questions/[questionId]/sample-answers/new/actions";
import { editSampleAnswer } from "../[programId]/questions/[questionId]/sample-answers/[answerId]/edit/actions";

// Define the form schema with validation
const sampleAnswerFormSchema = z.object({
  answer: z.string().min(1, {
    message: "Sample answer is required",
  }),
});

type SampleAnswerFormValues = z.infer<typeof sampleAnswerFormSchema>;

interface SampleAnswerFormProps {
  initialValues?: {
    answer?: string;
  };
  programId: string;
  questionId: string;
  answerId?: string;
  onCancelRedirectUrl: string;
  isEditing?: boolean;
}

export default function SampleAnswerForm({
  initialValues = {},
  programId,
  questionId,
  answerId,
  onCancelRedirectUrl,
  isEditing = false,
}: SampleAnswerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logError } = useAxiomLogging();
  const router = useRouter();
  const t = useTranslations(
    "coachAdminPortal.sampleAnswersPage.sampleAnswerForm"
  );

  // Initialize the form with default values or provided initial values
  const form = useForm<SampleAnswerFormValues>({
    resolver: zodResolver(sampleAnswerFormSchema),
    defaultValues: {
      answer: initialValues.answer || "",
    },
  });

  // Handle form submission
  const handleSubmit = async (
    values: z.infer<typeof sampleAnswerFormSchema>
  ) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (isEditing && answerId) {
        await handleEditSampleAnswer({
          sampleAnswer: values.answer,
          programId,
          questionId,
          sampleAnswerId: answerId,
        });
      } else {
        await handleCreateSampleAnswer({
          sampleAnswer: values.answer,
          programId,
          questionId,
        });
      }
    } catch (err) {
      setError(t("genericError"));
      logError("Create job form submission error:", { error: err });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSampleAnswer = async ({
    sampleAnswer,
    programId,
    questionId,
    sampleAnswerId,
  }: {
    sampleAnswer: string;
    programId: string;
    questionId: string;
    sampleAnswerId: string;
  }) => {
    const formData = new FormData();
    formData.append("answer", sampleAnswer);
    formData.append("programId", programId);
    formData.append("questionId", questionId);
    formData.append("sampleAnswerId", sampleAnswerId);
    const result = await editSampleAnswer(formData);
    if (result.success) {
      router.push(
        `/dashboard/coach-admin/programs/${programId}/questions/${questionId}`
      );
    } else {
      setError(result.message || t("genericError"));
    }
  };

  const handleCreateSampleAnswer = async ({
    sampleAnswer,
    programId,
    questionId,
  }: {
    sampleAnswer: string;
    programId: string;
    questionId: string;
  }) => {
    const formData = new FormData();
    formData.append("answer", sampleAnswer);
    formData.append("programId", programId);
    formData.append("questionId", questionId);
    const result = await createSampleAnswer(formData);
    if (result.success) {
      router.push(
        `/dashboard/coach-admin/programs/${programId}/questions/${questionId}`
      );
    } else {
      setError(result.message || t("genericError"));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? t("editTitle") : t("createTitle")}</CardTitle>
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

            {/* Sample Answer */}
            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("answerLabel")}*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("answerPlaceholder")}
                      className="min-h-[200px]"
                      {...field}
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
              onClick={() => router.push(onCancelRedirectUrl)}
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
