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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { createJob } from "@/app/recruiting/actions";

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    job_title: z.string().min(2, t("form.validation.titleMin")),
    job_description: z.string().min(10, t("form.validation.descriptionMin")),
  });

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export function CreateJobDialog({
  open,
  onOpenChange,
  companyId,
}: CreateJobDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { logError } = useAxiomLogging();
  const t = useTranslations("recruiting.createJobDialog");

  const formSchema = createFormSchema(t);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      job_title: "",
      job_description: "",
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
      const result = await createJob({
        job_title: data.job_title,
        job_description: data.job_description,
        company_id: companyId,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success(t("success"));
      onOpenChange(false);
    } catch (error: any) {
      logError("Error creating job:", { error, companyId });
      toast.error(error.message || t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.jobTitle.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("form.jobTitle.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="job_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.jobDescription.label")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.jobDescription.placeholder")}
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.jobDescription.description")}
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
