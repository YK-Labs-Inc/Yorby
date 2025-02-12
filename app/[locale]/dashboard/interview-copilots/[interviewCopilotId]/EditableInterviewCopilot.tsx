"use client";

import { useState, useActionState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, X, Check, Upload, FileText, Trash2 } from "lucide-react";
import { Tables } from "@/utils/supabase/database.types";
import { FormMessage } from "@/components/form-message";
import { useTranslations } from "next-intl";
import {
  uploadInterviewCopilotFile,
  deleteInterviewCopilotFile,
  updateInterviewCopilot,
} from "./actions";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { AIButton } from "@/components/ai-button";

interface EditableInterviewCopilotProps {
  interviewCopilot: Tables<"interview_copilots"> & {
    interview_copilot_files: Tables<"interview_copilot_files">[];
  };
}

export default function EditableInterviewCopilot({
  interviewCopilot,
}: EditableInterviewCopilotProps) {
  const t = useTranslations("interviewCopilots");
  const [isEditing, setIsEditing] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(
    updateInterviewCopilot,
    null
  );
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadInterviewCopilotFile,
    null
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteInterviewCopilotFile,
    null
  );

  useEffect(() => {
    if (updateState?.success) {
      setIsEditing(false);
    }
  }, [updateState]);

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <>
      {/* Header with Title and Edit Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {isEditing ? (
            <form action={updateAction}>
              <input type="hidden" name="id" value={interviewCopilot.id} />
              <Input
                name="title"
                defaultValue={interviewCopilot.title}
                className="text-3xl font-bold h-auto py-2"
              />
              <div className="space-y-4 mt-4">
                <Input
                  type="hidden"
                  name="job_title"
                  defaultValue={interviewCopilot.job_title || ""}
                />
                <Input
                  type="hidden"
                  name="job_description"
                  defaultValue={interviewCopilot.job_description || ""}
                />
                <Input
                  type="hidden"
                  name="company_name"
                  defaultValue={interviewCopilot.company_name || ""}
                />
                <Input
                  type="hidden"
                  name="company_description"
                  defaultValue={interviewCopilot.company_description || ""}
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    type="button"
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    className="gap-2"
                    type="submit"
                    disabled={updatePending}
                  >
                    <Check className="h-4 w-4" />
                    {updatePending ? t("edit.saving") : t("edit.saveButton")}
                  </Button>
                </div>
              </div>
              {updateState?.error && (
                <FormMessage message={{ error: updateState.error }} />
              )}
              {updateState?.success && (
                <FormMessage message={{ success: t("edit.saveSuccess") }} />
              )}
            </form>
          ) : (
            <h1 className="text-3xl font-bold text-foreground">
              {interviewCopilot.title}
            </h1>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Link
              href={`/dashboard/interview-copilots/${interviewCopilot.id}/on-device-session`}
              className="inline-flex items-center"
            >
              <AIButton pendingText={t("session.startingCopilot")}>
                {t("session.startCopilot")}
              </AIButton>
            </Link>
          </div>
        )}
      </div>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t("jobDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{t("jobTitle.label")}</h3>
            {isEditing ? (
              <Input
                name="job_title"
                defaultValue={interviewCopilot.job_title || ""}
                placeholder={t("createNew.jobTitle.placeholder")}
                form="editForm"
              />
            ) : (
              <p
                className={cn(
                  "text-muted-foreground",
                  !interviewCopilot.job_title && "italic"
                )}
              >
                {interviewCopilot.job_title || t("jobTitle.empty")}
              </p>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2">{t("jobDescription.label")}</h3>
            {isEditing ? (
              <Textarea
                name="job_description"
                defaultValue={interviewCopilot.job_description || ""}
                placeholder={t("createNew.jobDescription.placeholder")}
                className="min-h-[100px]"
                form="editForm"
              />
            ) : (
              <p
                className={cn(
                  "text-muted-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto pr-2",
                  !interviewCopilot.job_description && "italic"
                )}
              >
                {interviewCopilot.job_description || t("jobDescription.empty")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t("companyDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{t("companyName.label")}</h3>
            {isEditing ? (
              <Input
                name="company_name"
                defaultValue={interviewCopilot.company_name || ""}
                placeholder={t("createNew.companyName.placeholder")}
                form="editForm"
              />
            ) : (
              <p
                className={cn(
                  "text-muted-foreground",
                  !interviewCopilot.company_name && "italic"
                )}
              >
                {interviewCopilot.company_name || t("companyName.empty")}
              </p>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2">
              {t("companyDescription.label")}
            </h3>
            {isEditing ? (
              <Textarea
                name="company_description"
                defaultValue={interviewCopilot.company_description || ""}
                placeholder={t("createNew.companyDescription.placeholder")}
                className="min-h-[100px]"
                form="editForm"
              />
            ) : (
              <p
                className={cn(
                  "text-muted-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto pr-2",
                  !interviewCopilot.company_description && "italic"
                )}
              >
                {interviewCopilot.company_description ||
                  t("companyDescription.empty")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>{t("documents.label")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {interviewCopilot.interview_copilot_files.length > 0 ? (
              interviewCopilot.interview_copilot_files.map((file) => (
                <div key={file.id}>
                  <div className="flex items-center justify-between p-2 rounded-md border">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{file.file_path.split("/").pop()}</span>
                    </div>
                    <form action={deleteAction}>
                      <input
                        type="hidden"
                        name="interviewCopilotId"
                        value={interviewCopilot.id}
                      />
                      <input
                        type="hidden"
                        name="fileId"
                        value={file.id}
                        className="hidden"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        type="submit"
                        disabled={deletePending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                  {deleteState?.error && (
                    <FormMessage message={{ error: deleteState.error }} />
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm italic">
                {t("documents.empty")}
              </p>
            )}
          </div>
          <form action={uploadAction}>
            <Input
              type="file"
              id="file"
              name="file"
              accept=".pdf"
              className={cn("cursor-pointer")}
              required
            />
            <input
              type="hidden"
              name="interviewCopilotId"
              value={interviewCopilot.id}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("documents.helper")}
            </p>
            <Button
              variant="secondary"
              disabled={uploadPending}
              className="gap-2 mt-2"
              type="submit"
            >
              <Upload className="h-4 w-4" />
              {uploadPending
                ? t("documents.uploading")
                : t("documents.uploadButton")}
            </Button>
            {uploadState?.error && (
              <FormMessage message={{ error: uploadState.error }} />
            )}
          </form>
        </CardContent>
      </Card>
    </>
  );
}
