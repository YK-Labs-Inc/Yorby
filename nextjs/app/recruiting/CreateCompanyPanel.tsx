"use client";

import { useState, useActionState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
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
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { createCompany } from "@/app/recruiting/actions";
import { cn } from "@/lib/utils";

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, t("form.validation.nameMin")),
    website: z.string().optional(),
    industry: z.string().optional(),
    company_size: z.string().optional(),
  });

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface CreateCompanyPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

const INDUSTRIES = [
  { key: "technology", value: "Technology" },
  { key: "healthcare", value: "Healthcare" },
  { key: "finance", value: "Finance" },
  { key: "education", value: "Education" },
  { key: "retail", value: "Retail" },
  { key: "manufacturing", value: "Manufacturing" },
  { key: "consulting", value: "Consulting" },
  { key: "realEstate", value: "Real Estate" },
  { key: "mediaEntertainment", value: "Media & Entertainment" },
  { key: "transportation", value: "Transportation" },
  { key: "other", value: "Other" },
];

export function CreateCompanyPanel({
  open,
  onOpenChange,
}: CreateCompanyPanelProps) {
  const { logError } = useAxiomLogging();
  const t = useTranslations("recruiting.createCompanyDialog");

  const formSchema = createFormSchema(t);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      website: "",
      industry: "",
      company_size: "",
    },
  });

  const [createState, createFormAction, isCreating] = useActionState(
    createCompany,
    {
      success: false,
      error: null,
    }
  );

  // Handle create state changes
  useEffect(() => {
    if (createState.success) {
      toast.success(t("success"));
      onOpenChange(false);
      form.reset();
    } else if (createState.error) {
      logError("Error creating company:", {
        error: createState.error,
      });
      toast.error(createState.error || t("error"));
    }
  }, [createState, onOpenChange, logError, t, form]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity z-50",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l shadow-xl transition-transform duration-300 ease-in-out z-50",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-semibold">{t("title")}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-muted-foreground mb-6">{t("description")}</p>
            <Form {...form}>
              <form action={createFormAction} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.companyName.label")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("form.companyName.placeholder")}
                          {...field}
                          name="name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.website.label")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("form.website.placeholder")}
                          {...field}
                          name="website"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.industry.label")}</FormLabel>
                      <input
                        type="hidden"
                        name="industry"
                        value={field.value}
                      />
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("form.industry.placeholder")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INDUSTRIES.map((industry) => (
                            <SelectItem
                              key={industry.key}
                              value={industry.value}
                            >
                              {t(`form.industry.options.${industry.key}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.companySize.label")}</FormLabel>
                      <input
                        type="hidden"
                        name="company_size"
                        value={field.value}
                      />
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("form.companySize.placeholder")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMPANY_SIZES.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size} {t("form.companySize.employees")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t">
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isCreating}
              >
                {t("buttons.cancel")}
              </Button>
              <Button
                onClick={() => {
                  const formElement = document.querySelector(
                    "form"
                  ) as HTMLFormElement;
                  formElement?.requestSubmit();
                }}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("buttons.creating")}
                  </>
                ) : (
                  t("buttons.create")
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}