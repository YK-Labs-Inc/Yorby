"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tables } from "@/utils/supabase/database.types";
import { uploadAdditionalFiles, deleteFile } from "./actions";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";

interface Props {
  jobId: string;
  existingFiles: Tables<"custom_job_files">[];
}

export function FileUploadComponent({ jobId, existingFiles }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { logError } = useAxiomLogging();
  const t = useTranslations("jobCreation");

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

  const handleExistingFileDelete = async (fileId: string) => {
    setError("");
    setIsDeletingId(fileId);
    try {
      const { error } = await deleteFile(fileId);
      if (error) {
        setError(error);
        logError(error);
      }
    } finally {
      setIsDeletingId(null);
      setIsDialogOpen(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    startTransition(async () => {
      const { error } = await uploadAdditionalFiles({
        jobId,
        files,
      });
      if (error) {
        setError(error);
        logError(error);
      } else {
        setFiles([]);
        setIsUploadMode(false);
      }
    });
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Job Files</h2>
            <Button
              variant="outline"
              onClick={() => setIsUploadMode(!isUploadMode)}
              className="gap-2"
            >
              {isUploadMode ? (
                "Cancel Upload"
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload New Files
                </>
              )}
            </Button>
          </div>

          {isUploadMode && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
              <p className="text-sm text-muted-foreground mb-2">
                {t("fileUpload.pdfOnlyNotice")}
              </p>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                multiple
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                {t("fileUpload.pdfOnlyHelper")}
              </p>
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {file.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleFileDelete(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={isPending || files.length === 0}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload Files"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border p-4">
            {existingFiles.length > 0 ? (
              <ul className="divide-y">
                {existingFiles.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between py-3 group"
                  >
                    <span className="text-sm">
                      {file.display_name}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({file.mime_type.split("/")[1].toUpperCase()})
                      </span>
                    </span>
                    <AlertDialog
                      open={isDialogOpen}
                      onOpenChange={setIsDialogOpen}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete File</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this file? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            disabled={isDeletingId === file.id}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <Button
                            variant="destructive"
                            onClick={() => handleExistingFileDelete(file.id)}
                            disabled={isDeletingId === file.id}
                          >
                            {isDeletingId === file.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No files uploaded yet
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
