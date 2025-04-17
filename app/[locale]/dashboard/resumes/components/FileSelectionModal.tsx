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
import { Loader2, Upload, Brain, BrainCircuit } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

interface Props {
  onFileSelect: (files: Tables<"user_files">[]) => void;
  selectedFiles: Tables<"user_files">[];
  disabledFiles?: Tables<"user_files">[]; // Files that are selected in the other modal
}

export function FileSelectionModal({
  onFileSelect,
  selectedFiles,
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
  const [isMemoryDialogOpen, setIsMemoryDialogOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
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

    // Validate file count
    if (files.length + existingFiles.length > 10) {
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
    setCurrentFile(files[0]);
    setIsMemoryDialogOpen(true);
  };

  const handleMemoryDecision = async (addToMemory: boolean) => {
    if (!currentFile || !user) return;

    setIsUploading(true);
    setUploadProgress(0);
    setIsMemoryDialogOpen(false);

    try {
      await uploadResumeFile(currentFile, user.id, addToMemory);

      // Optimistically update the UI
      const newFile = {
        id: `temp-${Date.now()}`, // Temporary ID
        display_name: currentFile.name,
        created_at: new Date().toISOString(),
        user_id: user.id,
        added_to_memory: addToMemory,
      } as Tables<"user_files">;
      setExistingFiles((prev) => [...prev, newFile]);
      onFileSelect([...selectedFiles, newFile]);

      // Update progress
      setUploadProgress(100);
    } catch (error) {
      logError("Error uploading file:", { error });
      setError(t("upload.uploadError"));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentFile(null);
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

  const toggleMemoryStatus = async (file: Tables<"user_files">) => {
    if (!user) return;

    // Optimistically update the UI
    const newMemoryStatus = !file.added_to_memory;

    // Update local state
    setExistingFiles((prev) =>
      prev.map((f) =>
        f.id === file.id ? { ...f, added_to_memory: newMemoryStatus } : f
      )
    );

    // Also update in selectedFiles if the file is selected
    if (selectedFiles.some((f) => f.id === file.id)) {
      onFileSelect(
        selectedFiles.map((f) =>
          f.id === file.id ? { ...f, added_to_memory: newMemoryStatus } : f
        )
      );
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("user_files")
        .update({ added_to_memory: newMemoryStatus })
        .eq("id", file.id);

      if (error) throw error;
    } catch (error) {
      // Revert optimistic update on error
      setExistingFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, added_to_memory: file.added_to_memory } : f
        )
      );

      // Also revert in selectedFiles if the file is selected
      if (selectedFiles.some((f) => f.id === file.id)) {
        onFileSelect(
          selectedFiles.map((f) =>
            f.id === file.id
              ? { ...f, added_to_memory: file.added_to_memory }
              : f
          )
        );
      }

      logError("Error toggling memory status:", { error });
      setError(t("upload.memoryToggleError"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          {t("upload.uploadContext")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("upload.contextTitle")}</DialogTitle>
          <DialogDescription>
            {t("upload.contextDescription")}
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
                      {t("upload.uploadContext")}
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
                  {t("upload.multiPdfHelper")}
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
                    className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed bg-muted"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className="flex items-center gap-2 cursor-pointer flex-1"
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

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={file.added_to_memory}
                        onCheckedChange={() => toggleMemoryStatus(file)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {t("upload.addToMemories")}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      disabled={isDeletingId === file.id}
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      {isDeletingId === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "×"
                      )}
                    </Button>

                    <AlertDialog
                      open={isDeleteDialogOpen}
                      onOpenChange={setIsDeleteDialogOpen}
                    >
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

      {/* Memory Dialog */}
      <Dialog open={isMemoryDialogOpen} onOpenChange={setIsMemoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("upload.memoryDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("upload.memoryDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {t("upload.memoryDialog.helpText")}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleMemoryDecision(false)}
              >
                {t("upload.memoryDialog.skip")}
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleMemoryDecision(true)}
              >
                {t("upload.memoryDialog.add")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
