"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { createJobInterview } from "./actions";
import { Database } from "@/utils/supabase/database.types";

type InterviewType = Database["public"]["Enums"]["job_interview_type"];

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, t("form.validation.nameMin")),
    interview_type: z.enum(["general", "coding"] as [InterviewType, InterviewType]),
  });

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface CreateJobInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  currentInterviewsCount: number;
}

export function CreateJobInterviewDialog({
  open,
  onOpenChange,
  jobId,
  currentInterviewsCount,
}: CreateJobInterviewDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { logError } = useAxiomLogging();
  const t = useTranslations("apply.recruiting.createJobInterviewDialog");

  const formSchema = createFormSchema(t);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      interview_type: "general",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const result = await createJobInterview({
        name: data.name,
        interview_type: data.interview_type,
        custom_job_id: jobId,
        order_index: currentInterviewsCount,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success(t("success"));
      onOpenChange(false);
    } catch (error: any) {
      logError("Error creating job interview:", { error, jobId });
      toast.error(error.message || t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.name.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("form.name.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.name.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interview_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.interviewType.label")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("form.interviewType.placeholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general">
                        {t("form.interviewType.options.general")}
                      </SelectItem>
                      <SelectItem value="coding">
                        {t("form.interviewType.options.coding")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("form.interviewType.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t("buttons.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("buttons.creating")}
                  </>
                ) : (
                  t("buttons.create")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}