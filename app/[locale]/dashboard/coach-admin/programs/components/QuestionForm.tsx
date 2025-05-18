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
import { redirect, useRouter } from "next/navigation";
import { createQuestion } from "../[programId]/questions/new/actions";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useTranslations } from "next-intl";

// Define the form schema with validation
const questionFormSchema = z.object({
  question: z.string().min(5, {
    message: "Question must be at least 5 characters.",
  }),
  answerGuidelines: z.string().min(10, {
    message: "Answer guidelines must be at least 10 characters.",
  }),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface QuestionFormProps {
  initialValues?: {
    question?: string;
    answerGuidelines?: string;
    questionType?: "ai_generated" | "user_generated";
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
    },
  });

  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof questionFormSchema>) => {
    setIsSubmitting(true);
    setError(null);
    const { question, answerGuidelines } = values;
    try {
      if (isEditing && questionId) {
        handleEditQuestion({ question, answerGuidelines, questionId });
      } else {
        handleCreateQuestion({ question, answerGuidelines });
      }
    } catch (err) {
      setError(t("genericError"));
      logError("Create job form submission error:", { error: err });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuestion = async ({
    question,
    answerGuidelines,
  }: {
    question: string;
    answerGuidelines: string;
  }) => {
    const formData = new FormData();
    formData.append("question", question);
    formData.append("answerGuidelines", answerGuidelines);
    formData.append("programId", programId);
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
  }: {
    question: string;
    answerGuidelines: string;
    questionId: string;
  }) => {
    const formData = new FormData();
    formData.append("quesiton", question);
    formData.append("answerGuidelines", answerGuidelines);
    formData.append("questionId", questionId);
    // const result = await editQuestion(formData);
    // if (result.success) {
    //   router.push(`/dashboard/coach-admin/programs/${result.questionId}`);
    // } else {
    //   setError(result.message || t("genericError"));
    // }
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
                      defaultValue={initialValues.question}
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
                      defaultValue={initialValues.answerGuidelines}
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
