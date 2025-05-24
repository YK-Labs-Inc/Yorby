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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { createQuestion } from "../[programId]/questions/new/actions";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useTranslations } from "next-intl";
import { editQuestion } from "../[programId]/questions/[questionId]/edit/actions";
import { Switch } from "@/components/ui/switch";

// Define the form schema with validation
const questionFormSchema = z.object({
  question: z.string().min(5, {
    message: "Question must be at least 5 characters.",
  }),
  answerGuidelines: z.string().min(10, {
    message: "Answer guidelines must be at least 10 characters.",
  }),
  publishImmediately: z.boolean().default(false).optional(),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface QuestionFormProps {
  initialValues?: {
    question?: string;
    answerGuidelines?: string;
    questionType?: "ai_generated" | "user_generated";
    publication_status?: "draft" | "published";
  };
  programId: string;
  onCancelRedirectUrl: string;
  isEditing?: boolean;
  questionId?: string;
}

export default function QuestionForm({
  initialValues = {},
  onCancelRedirectUrl,
  isEditing = false,
  questionId,
  programId,
}: QuestionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logError } = useAxiomLogging();
  const t = useTranslations("coachAdminPortal.questionsPage.questionForm");
  const router = useRouter();

  // Initialize the form with default values or provided initial values
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: initialValues.question || "",
      answerGuidelines: initialValues.answerGuidelines || "",
      publishImmediately: initialValues.publication_status === "published",
    },
  });

  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof questionFormSchema>) => {
    setIsSubmitting(true);
    setError(null);
    const { question, answerGuidelines, publishImmediately } = values;
    try {
      if (isEditing && questionId) {
        await handleEditQuestion({
          question,
          answerGuidelines,
          questionId,
          publishImmediately,
        });
      } else {
        await handleCreateQuestion({
          question,
          answerGuidelines,
          publishImmediately,
        });
      }
    } catch (err) {
      setError(t("genericError"));
      logError("Question form submission error:", { error: err });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuestion = async ({
    question,
    answerGuidelines,
    publishImmediately,
  }: {
    question: string;
    answerGuidelines: string;
    publishImmediately?: boolean;
  }) => {
    const formData = new FormData();
    formData.append("question", question);
    formData.append("answerGuidelines", answerGuidelines);
    formData.append("programId", programId);
    formData.append(
      "publication_status",
      publishImmediately ? "published" : "draft"
    );
    const result = await createQuestion(formData);
    if (result.success) {
      router.push(
        `/dashboard/coach-admin/programs/${programId}/questions/${result.questionId}`
      );
    } else {
      setError(result.message || t("genericError"));
    }
  };

  const handleEditQuestion = async ({
    question,
    answerGuidelines,
    questionId,
    publishImmediately,
  }: {
    question: string;
    answerGuidelines: string;
    questionId: string;
    publishImmediately?: boolean;
  }) => {
    const formData = new FormData();
    formData.append("question", question);
    formData.append("answerGuidelines", answerGuidelines);
    formData.append("questionId", questionId);
    formData.append("programId", programId);
    formData.append(
      "publication_status",
      publishImmediately ? "published" : "draft"
    );
    const result = await editQuestion(formData);
    if (result.success) {
      router.push(
        `/dashboard/coach-admin/programs/${programId}/questions/${result.questionId}`
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
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Question */}
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("questionSectionHeader")}*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("questionPlaceholder")}
                      className="min-h-[100px]"
                      {...field}
                      name="question"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Answer Guidelines */}
            <FormField
              control={form.control}
              name="answerGuidelines"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("answerGuidelinesSectionHeader")}*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("answerGuidelinesPlaceholder")}
                      className="min-h-[150px]"
                      {...field}
                      name="answerGuidelines"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Publish Immediately Toggle */}
            <FormField
              control={form.control}
              name="publishImmediately"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t("publishImmediatelyLabel")}
                    </FormLabel>
                    <FormDescription>
                      {t("publishImmediatelyDescription")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                  {isEditing ? t("savingChanges") : t("creatingQuestion")}
                </>
              ) : isEditing ? (
                t("saveChanges")
              ) : (
                t("createQuestion")
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
