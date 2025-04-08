"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tables } from "@/utils/supabase/database.types";
import { useTranslations } from "next-intl";
import { Loader2, Upload } from "lucide-react";
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
  mode: "resume" | "context";
  disabledFiles?: Tables<"user_files">[]; // Files that are selected in the other modal
}

export function FileSelectionModal({
  onFileSelect,
  selectedFiles,
  mode,
  disabledFiles = [],
}: Props) {
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

    // Validate file count based on mode
    if (mode === "resume" && files.length > 1) {
      setError(t("upload.singleFileOnly"));
      return;
    }

    if (mode === "context" && files.length + existingFiles.length > 10) {
      setError(t("upload.maxFilesExceeded"));
      return;
    }

    // Validate all files are PDFs
    const invalidFile = files.find((file) => file.type !== "application/pdf");
    if (invalidFile) {
      setError(t("upload.pdfOnly"));
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
      logError("Error uploading file:", { error });
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
    // Don't allow selection of disabled files
    if (disabledFiles.some((f) => f.id === file.id)) {
      return;
    }

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
          {mode === "resume"
            ? t("upload.uploadResume")
            : t("upload.uploadContext")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "resume"
              ? t("upload.resumeTitle")
              : t("upload.contextTitle")}
          </DialogTitle>
          <DialogDescription>
            {mode === "resume"
              ? t("upload.resumeDescription")
              : t("upload.contextDescription")}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isFetchingFiles ? (
          <div className="flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upload new file section */}
            <div className="space-y-4">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
                multiple={mode === "context"}
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
                      {mode === "resume"
                        ? t("upload.uploadResume")
                        : t("upload.uploadContext")}
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
                  {mode === "resume"
                    ? t("upload.singlePdfOnly")
                    : t("upload.multiPdfHelper")}
                </p>
              </div>
            </div>

            {/* Existing files section */}
            <div className="space-y-2">
              {existingFiles.map((file) => {
                const isDisabled = disabledFiles.some((f) => f.id === file.id);
                return (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed bg-muted"
                        : "hover:bg-muted/50 cursor-pointer"
                    }`}
                  >
                    <div
                      className="flex items-center gap-2 flex-1"
                      onClick={() => !isDisabled && toggleFileSelection(file)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFiles.some((f) => f.id === file.id)}
                        disabled={isDisabled}
                        onChange={() => {}}
                        className="h-4 w-4 disabled:cursor-not-allowed"
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
                          <AlertDialogCancel
                            disabled={isDeletingId === file.id}
                          >
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
                );
              })}
              {existingFiles.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  {t("upload.noFiles")}
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button className="w-full" onClick={() => setIsOpen(false)}>
            {t("upload.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
