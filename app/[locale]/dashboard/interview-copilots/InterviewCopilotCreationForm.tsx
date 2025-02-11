"use client";

import { useActionState } from "react";
import { createInterviewCopilot } from "./actions";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { FormMessage } from "@/components/form-message";
import { Link } from "@/i18n/routing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface InterviewCopilotCreationFormProps {
  userCredits: number;
}

export const InterviewCopilotCreationForm = ({
  userCredits,
}: InterviewCopilotCreationFormProps) => {
  const [state, action, pending] = useActionState(createInterviewCopilot, {
    error: "",
  });
  const t = useTranslations("interviewCopilots");
  const [files, setFiles] = useState<File[]>([]);
  const [showInsufficientCreditsDialog, setShowInsufficientCreditsDialog] =
    useState(false);
  const [showEmptyFieldsDialog, setShowEmptyFieldsDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
    // Clear the input value so the same file can be selected again if needed
    e.target.value = "";
  };

  const handleFileDelete = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = (formData: FormData) => {
    const jobTitle = formData.get("jobTitle") as string;
    const jobDescription = formData.get("jobDescription") as string;
    const companyName = formData.get("companyName") as string;
    const companyDescription = formData.get("companyDescription") as string;

    // Check if all fields are empty
    if (
      !jobTitle &&
      !jobDescription &&
      !companyName &&
      !companyDescription &&
      files.length === 0
    ) {
      setShowEmptyFieldsDialog(true);
      return;
    }

    if (userCredits < 1) {
      setShowInsufficientCreditsDialog(true);
      return;
    }

    // Remove any existing files from the FormData
    formData.delete("files");

    // Add our managed files
    files.forEach((file) => {
      formData.append("files", file);
    });

    action(formData);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Dialog
        open={showEmptyFieldsDialog}
        onOpenChange={setShowEmptyFieldsDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createNew.emptyFields.title")}</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              {t("createNew.emptyFields.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button onClick={() => setShowEmptyFieldsDialog(false)}>
              {t("createNew.emptyFields.button")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showInsufficientCreditsDialog}
        onOpenChange={setShowInsufficientCreditsDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("credits.insufficientDialog.title")}</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              {t("credits.insufficientDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Link href="/purchase">
              <Button size="lg">
                {t("credits.insufficientDialog.button")}
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <form action={handleSubmit} className="space-y-6">
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
          <Label htmlFor="companyName">
            {t("createNew.companyName.label")}
          </Label>
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
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={triggerFileInput}
              className="w-full"
            >
              Upload PDF Documents
            </Button>
            <p className="text-xs text-muted-foreground">
              {t("createNew.documents.helper")}
            </p>
          </div>
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <span className="text-sm text-muted-foreground truncate">
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
    </>
  );
};
