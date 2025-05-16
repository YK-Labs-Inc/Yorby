"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the form schema with validation
const sampleAnswerFormSchema = z.object({
  answer: z.string().min(10, {
    message: "Sample answer must be at least 10 characters.",
  }),
});

type SampleAnswerFormValues = z.infer<typeof sampleAnswerFormSchema>;

interface SampleAnswerFormProps {
  initialValues?: {
    answer?: string;
  };
  onSubmit: (formData: FormData) => Promise<{ success: boolean; message: string }>;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function SampleAnswerForm({
  initialValues = {},
  onSubmit,
  onCancel,
  isEditing = false,
}: SampleAnswerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the form with default values or provided initial values
  const form = useForm<SampleAnswerFormValues>({
    resolver: zodResolver(sampleAnswerFormSchema),
    defaultValues: {
      answer: initialValues.answer || "",
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
        <CardTitle>{isEditing ? "Edit Sample Answer" : "Add Sample Answer"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update this sample answer for the interview question."
            : "Add a new sample answer to help students understand what makes a good response."}
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

            {/* Sample Answer */}
            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample Answer*</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter a sample answer for this question..." 
                      className="min-h-[200px]" 
                      {...field} 
                      name="answer"
                      defaultValue={initialValues.answer}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a model answer that demonstrates how to effectively respond to this interview question.
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
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Saving..." : "Add Answer"}
                </>
              ) : (
                isEditing ? "Save Changes" : "Add Answer"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
