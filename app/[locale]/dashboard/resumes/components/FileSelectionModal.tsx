"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tables } from "@/utils/supabase/database.types";
import { useTranslations } from "next-intl";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import { uploadResumeFile, deleteResumeFile } from "../actions";
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
import { Progress } from "@/components/ui/progress";

interface Props {
  onFileSelect: (files: Tables<"user_files">[]) => void;
  selectedFiles: Tables<"user_files">[];
}

export function FileSelectionModal({ onFileSelect, selectedFiles }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [existingFiles, setExistingFiles] = useState<Tables<"user_files">[]>(
    []
  );
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logError } = useAxiomLogging();
  const user = useUser();
  const t = useTranslations("resumeBuilder");

  // Fetch user's existing files
  useEffect(() => {
    if (isOpen && user) {
      const fetchUserFiles = async () => {
        setIsFetchingFiles(true);
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("user_files")
          .select("*")
          .eq("user_id", user.id);

        if (error) {
          logError("Error fetching user files:", { error });
          return;
        }

        setExistingFiles(data || []);
        setIsFetchingFiles(false);
      };

      fetchUserFiles();
    }
  }, [isOpen, user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);

    // Validate all files
    const invalidFile = files.find(
      (file) =>
        !file.type.match(
          "application/pdf|application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    );

    if (invalidFile) {
      setError(t("upload.invalidFileType"));
      return;
    }

    setError("");
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload files sequentially and track progress
      const totalFiles = files.length;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadResumeFile(file, user!.id);

        // Optimistically update the UI
        const newFile = {
          id: `temp-${Date.now()}-${i}`, // Temporary ID
          display_name: file.name,
          created_at: new Date().toISOString(),
          user_id: user!.id,
        } as Tables<"user_files">;
        setExistingFiles((prev) => [...prev, newFile]);

        // Update progress
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }
    } catch (error) {
      logError("Error uploading resume:", { error });
      setError(t("upload.uploadError"));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (fileId: string) => {
    setError("");
    setIsDeletingId(fileId);

    // Optimistically update UI
    const fileToDelete = existingFiles.find((f) => f.id === fileId);
    if (fileToDelete) {
      setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
      onFileSelect(selectedFiles.filter((f) => f.id !== fileId));
    }

    try {
      const { error } = await deleteResumeFile(fileId);
      if (error) {
        // Revert optimistic update on error
        if (fileToDelete) {
          setExistingFiles((prev) => [...prev, fileToDelete]);
        }
        setError(t("upload.deleteError"));
      }
    } catch (error) {
      // Revert optimistic update on error
      if (fileToDelete) {
        setExistingFiles((prev) => [...prev, fileToDelete]);
      }
      logError("Error deleting file:", { error });
      setError(t("upload.deleteError"));
    } finally {
      setIsDeletingId(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const toggleFileSelection = (file: Tables<"user_files">) => {
    if (selectedFiles.find((f) => f.id === file.id)) {
      onFileSelect(selectedFiles.filter((f) => f.id !== file.id));
    } else {
      onFileSelect([...selectedFiles, file]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          {t("upload.uploadButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("upload.title")}</DialogTitle>
          <DialogDescription>{t("upload.fileTypesHelper")}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isFetchingFiles ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upload new file section */}
            <div className="space-y-4">
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
                multiple
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("upload.uploading")}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {t("upload.uploadButton")}
                    </>
                  )}
                </Button>
                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {Math.round(uploadProgress)}% uploaded
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("upload.fileTypesHelper")}
                </p>
              </div>
            </div>

            {/* Existing files section */}
            <div className="space-y-2">
              {existingFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 hover:bg-muted/50"
                >
                  <div
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={() => toggleFileSelection(file)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.some((f) => f.id === file.id)}
                      onChange={() => {}}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium truncate">
                      {file.display_name}
                    </span>
                  </div>
                  <AlertDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={isDeletingId === file.id}
                      >
                        {isDeletingId === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "×"
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("upload.deleteTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("upload.deleteConfirmation")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingId === file.id}>
                          {t("upload.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(file.id)}
                          disabled={isDeletingId === file.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeletingId === file.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t("upload.deleting")}
                            </>
                          ) : (
                            t("upload.delete")
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
              {existingFiles.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  {t("upload.noFiles")}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
