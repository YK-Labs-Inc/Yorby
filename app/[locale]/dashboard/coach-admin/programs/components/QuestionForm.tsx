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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { redirect } from "next/navigation";

// Define the form schema with validation
const questionFormSchema = z.object({
  question: z.string().min(5, {
    message: "Question must be at least 5 characters.",
  }),
  answerGuidelines: z.string().min(10, {
    message: "Answer guidelines must be at least 10 characters.",
  }),
  questionType: z.enum(["ai_generated", "user_generated"], {
    required_error: "Question type is required.",
  }),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface QuestionFormProps {
  initialValues?: {
    question?: string;
    answerGuidelines?: string;
    questionType?: "ai_generated" | "user_generated";
  };
  onSubmit: (
    formData: FormData
  ) => Promise<{ success: boolean; message: string }>;
  onCancelRedirectUrl: string;
  isEditing?: boolean;
}

export default function QuestionForm({
  initialValues = {},
  onSubmit,
  onCancelRedirectUrl,
  isEditing = false,
}: QuestionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the form with default values or provided initial values
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: initialValues.question || "",
      answerGuidelines: initialValues.answerGuidelines || "",
      questionType: initialValues.questionType || "user_generated",
    },
  });

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit(formData);

      if (!result.success) {
        setError(result.message);
        setIsSubmitting(false);
        return;
      }

      // Form submitted successfully, let the parent component handle navigation
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Form submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isEditing
            ? "Edit Interview Question"
            : "Create New Interview Question"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Update this interview question and answer guidelines."
            : "Add a new interview question to this job profile."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form action={handleSubmit}>
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
                  <FormLabel>Question*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the interview question..."
                      className="min-h-[100px]"
                      {...field}
                      name="question"
                      defaultValue={initialValues.question}
                    />
                  </FormControl>
                  <FormDescription>
                    The interview question that will be presented to students.
                  </FormDescription>
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
                  <FormLabel>Answer Guidelines*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter guidelines for what makes a good answer..."
                      className="min-h-[150px]"
                      {...field}
                      name="answerGuidelines"
                      defaultValue={initialValues.answerGuidelines}
                    />
                  </FormControl>
                  <FormDescription>
                    Guidelines for what constitutes a good answer to this
                    question.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question Type */}
            <FormField
              control={form.control}
              name="questionType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Question Type*</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={
                        initialValues.questionType || "user_generated"
                      }
                      className="flex flex-col space-y-1"
                      name="questionType"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="user_generated" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          User Generated
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ai_generated" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          AI Generated
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Specify whether this question was manually created or
                    generated by AI.
                  </FormDescription>
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
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Saving..." : "Create Question"}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Question"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
