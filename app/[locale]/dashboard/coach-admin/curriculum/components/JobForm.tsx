"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the form schema with validation
const jobFormSchema = z.object({
  jobTitle: z.string().min(3, {
    message: "Job title must be at least 3 characters.",
  }),
  jobDescription: z.string().min(10, {
    message: "Job description must be at least 10 characters.",
  }),
  companyName: z.string().optional(),
  companyDescription: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  initialValues?: {
    jobTitle?: string;
    jobDescription?: string;
    companyName?: string;
    companyDescription?: string;
  };
  onSubmit: (formData: FormData) => Promise<{ success: boolean; message: string }>;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function JobForm({
  initialValues = {},
  onSubmit,
  onCancel,
  isEditing = false,
}: JobFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the form with default values or provided initial values
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      jobTitle: initialValues.jobTitle || "",
      jobDescription: initialValues.jobDescription || "",
      companyName: initialValues.companyName || "",
      companyDescription: initialValues.companyDescription || "",
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
        <CardTitle>{isEditing ? "Edit Job Profile" : "Create New Job Profile"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update the details of this job profile in your curriculum."
            : "Add a new job profile to your curriculum for students to practice with."}
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

            {/* Job Title */}
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Software Engineer, Product Manager" 
                      {...field} 
                      name="jobTitle"
                      defaultValue={initialValues.jobTitle}
                    />
                  </FormControl>
                  <FormDescription>
                    The title of the position students will be interviewing for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Name */}
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Acme Corporation" 
                      {...field} 
                      name="companyName"
                      defaultValue={initialValues.companyName || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    The name of the company (optional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Description */}
            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description*</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter the job description..." 
                      className="min-h-[150px]" 
                      {...field} 
                      name="jobDescription"
                      defaultValue={initialValues.jobDescription}
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed description of the job role, responsibilities, and requirements.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Description */}
            <FormField
              control={form.control}
              name="companyDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter information about the company..." 
                      className="min-h-[100px]" 
                      {...field} 
                      name="companyDescription"
                      defaultValue={initialValues.companyDescription || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Information about the company, its culture, and values (optional).
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
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Save Changes" : "Create Job"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
