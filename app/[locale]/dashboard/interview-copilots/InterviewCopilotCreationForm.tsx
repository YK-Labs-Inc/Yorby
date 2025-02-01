"use client";

import { useActionState } from "react";
import { createInterviewCopilot } from "./actions";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FormMessage } from "@/components/form-message";

export const InterviewCopilotCreationForm = () => {
  const [state, action, pending] = useActionState(createInterviewCopilot, {
    error: "",
  });
  const t = useTranslations("interviewCopilots");
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
  };

  const handleFileDelete = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  return (
    <form
      action={(data) => {
        files.forEach((file) => {
          data.append("files", file);
        });
        action(data);
      }}
      className="space-y-6"
    >
      {state.error && <FormMessage message={{ error: state.error }} />}

      <div className="space-y-2">
        <Label htmlFor="jobTitle">{t("createNew.jobTitle.label")}</Label>
        <Input
          type="text"
          id="jobTitle"
          name="jobTitle"
          placeholder={t("createNew.jobTitle.placeholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobDescription">
          {t("createNew.jobDescription.label")}
        </Label>
        <Textarea
          id="jobDescription"
          name="jobDescription"
          placeholder={t("createNew.jobDescription.placeholder")}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName">{t("createNew.companyName.label")}</Label>
        <Input
          type="text"
          id="companyName"
          name="companyName"
          placeholder={t("createNew.companyName.placeholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyDescription">
          {t("createNew.companyDescription.label")}
        </Label>
        <Textarea
          id="companyDescription"
          name="companyDescription"
          placeholder={t("createNew.companyDescription.placeholder")}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="files">{t("createNew.documents.label")}</Label>
        <Input
          type="file"
          id="files"
          name="files"
          multiple
          accept={".pdf"}
          onChange={handleFileChange}
          className={cn("cursor-pointer")}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t("createNew.documents.helper")}
        </p>
        {files.length > 0 && (
          <div className="mt-2 space-y-1">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {file.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleFileDelete(index)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("createNew.submitting") : t("createNew.submit")}
      </Button>
    </form>
  );
};
