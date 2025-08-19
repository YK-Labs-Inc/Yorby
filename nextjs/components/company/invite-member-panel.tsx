"use client";

import { useEffect, useActionState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { inviteCompanyMember } from "@/app/recruiting/companies/[id]/members/actions";
import { cn } from "@/lib/utils";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .min(1, t("form.validation.emailRequired"))
      .email(t("form.validation.emailInvalid")),
    role: z.string().min(1, t("form.validation.roleRequired")),
  });

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface InviteMemberPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  currentUserRole: string;
}

export function InviteMemberPanel({
  open,
  onOpenChange,
  companyId,
  currentUserRole,
}: InviteMemberPanelProps) {
  const { logError, logInfo } = useAxiomLogging();
  const t = useTranslations("company.invitePanel");

  const formSchema = createFormSchema(t);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "",
    },
  });

  const [state, formAction, isPending] = useActionState(inviteCompanyMember, {
    error: undefined,
    success: false,
  });

  // Handle state changes
  useEffect(() => {
    if (state.success) {
      // Success case - the state.error is undefined and form was submitted
      toast.success(t("success"));
      form.reset();
      onOpenChange(false);
      logInfo("Invitation sent successfully", { companyId });
    } else if (state.error) {
      logError("Error inviting member", {
        error: state.error,
        companyId,
      });
      toast.error(state.error);
    }
  }, [state, onOpenChange, logError, logInfo, companyId, t, form]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  // Handle Escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [open]);

  // Reset form when panel opens
  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  // Determine available roles based on current user's role
  const availableRoles = () => {
    if (currentUserRole === "owner") {
      return ["admin", "recruiter", "viewer"];
    } else if (currentUserRole === "admin") {
      return ["recruiter", "viewer"];
    }
    return [];
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
          "fixed top-0 right-0 h-full w-full max-w-md bg-background border-l shadow-xl transition-transform duration-300 ease-in-out z-50",
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
              <form action={formAction} className="space-y-6">
                <input type="hidden" name="company_id" value={companyId} />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.email.label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t("form.email.placeholder")}
                          {...field}
                          name="email"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.role.label")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("form.role.placeholder")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableRoles().map((role) => (
                            <SelectItem key={role} value={role}>
                              {t(`form.role.options.${role}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("form.role.description")}
                      </FormDescription>
                      <FormMessage />
                      <input type="hidden" name="role" value={field.value} />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t">
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
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
                disabled={isPending || !form.formState.isValid}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("buttons.sending")}
                  </>
                ) : (
                  t("buttons.send")
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
