"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Save,
  Upload,
  Trash2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface KnowledgeBaseFile {
  id: string;
  created_at: string;
  custom_job_id: string;
  coach_id: string;
  display_name: string;
  file_path: string;
  bucket_name: string;
  mime_type: string;
  google_file_name: string;
  google_file_uri: string;
}

interface KnowledgeBaseManagerProps {
  programId: string;
  coachId: string;
  initialKnowledgeBase: string | null;
  initialFiles: KnowledgeBaseFile[];
}

export default function KnowledgeBaseManager({
  programId,
  coachId,
  initialKnowledgeBase,
  initialFiles,
}: KnowledgeBaseManagerProps) {
  const t = useTranslations("coachAdminPortal.programsPage.knowledgeBase");
  const { logError, logInfo } = useAxiomLogging();
  const [knowledgeBase, setKnowledgeBase] = useState(
    initialKnowledgeBase || ""
  );
  const [files, setFiles] = useState<KnowledgeBaseFile[]>(initialFiles);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = createSupabaseBrowserClient();

    try {
      // Check if knowledge base exists
      const { data: existingKB } = await supabase
        .from("custom_job_knowledge_base")
        .select("id")
        .eq("custom_job_id", programId)
        .single();

      if (existingKB) {
        // Update existing
        const { error } = await supabase
          .from("custom_job_knowledge_base")
          .update({ knowledge_base: knowledgeBase })
          .eq("custom_job_id", programId);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("custom_job_knowledge_base")
          .insert({
            custom_job_id: programId,
            knowledge_base: knowledgeBase,
          });

        if (error) throw error;
      }

      logInfo("Knowledge base saved", { programId });
      toast({
        title: t("saveSuccess"),
      });
    } catch (error) {
      logError("Error saving knowledge base", { error, programId });
      toast({
        variant: "destructive",
        title: t("saveError"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("programId", programId);
    formData.append("coachId", coachId);

    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("/api/job-knowledge-base/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { files: uploadedFiles } = await response.json();

      setFiles((prevFiles) => [...uploadedFiles, ...prevFiles]);
      setSelectedFiles([]);

      // Reset the file input
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      logInfo("Files uploaded", { programId, count: uploadedFiles.length });
      toast({
        title: t("uploadSuccess"),
      });
    } catch (error) {
      logError("Error uploading files", { error, programId });
      toast({
        variant: "destructive",
        title: t("uploadError"),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm(t("deleteConfirm"))) return;

    const supabase = createSupabaseBrowserClient();

    try {
      // Note: Gemini files are automatically deleted after their expiration time
      // We only need to remove the database record

      // Delete from database
      const { error: dbError } = await supabase
        .from("custom_job_knowledge_base_files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      setFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId));
      logInfo("File deleted", { fileId, programId });
      toast({
        title: t("deleteSuccess"),
      });
    } catch (error) {
      logError("Error deleting file", { error, fileId });
      toast({
        variant: "destructive",
        title: t("deleteError"),
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">{t("textTab")}</TabsTrigger>
            <TabsTrigger value="files">{t("filesTab")}</TabsTrigger>
          </TabsList>

          {/* Text Knowledge Base Tab */}
          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="knowledge-base">Content</Label>
              <Textarea
                id="knowledge-base"
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                placeholder={t("placeholder")}
                className="min-h-[400px] font-mono text-sm"
                disabled={isSaving}
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {t("savingButton")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t("saveButton")}
                </>
              )}
            </Button>
          </TabsContent>

          {/* File Upload Tab */}
          <TabsContent value="files" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select Files to Upload</Label>
                <div className="flex gap-4">
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || selectedFiles.length === 0}
                  >
                    {isUploading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {t("uploading")}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {t("uploadButton")}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("supportedFormats")}
                </p>
              </div>

              {/* Files List */}
              <div className="space-y-2">
                <Label>Uploaded Files</Label>
                {files.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{t("noFiles")}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{file.display_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(file.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
