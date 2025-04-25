"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ResumePreview from "../../resumes/components/ResumePreview";
import { ResumeDataType } from "../../resumes/components/ResumeBuilder";
import { Tables } from "@/utils/supabase/database.types";
import { uploadUserFile } from "@/app/[locale]/dashboard/resumes/actions";
import { useUser } from "@/context/UserContext";
import { useKnowledgeBase } from "@/app/context/KnowledgeBaseContext";
import ResumeTransformation from "../../resumes/[resumeId]/transform/ResumeTransformation";

type UserFile = Tables<"user_files"> & {
  signedUrl?: string;
};
type Resume = ResumeDataType;
interface TransformResumeClientProps {
  userFiles: UserFile[];
  resumes: Resume[];
}

export default function TransformResumeClient({
  userFiles,
  resumes,
}: TransformResumeClientProps) {
  const [selectedFile, setSelectedFile] = useState<UserFile | null>(null);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingMemories, setIsUpdatingMemories] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);
  const [isTransforming, setIsTransforming] = useState(false);
  const [showTransformation, setShowTransformation] = useState(false);
  const user = useUser();
  const { updateKnowledgeBase } = useKnowledgeBase();

  const handleFileClick = (file: UserFile) => {
    setSelectedFile(file === selectedFile ? null : file);
    setSelectedResume(null);
  };

  const handleResumeClick = (resume: Resume) => {
    setSelectedResume(resume === selectedResume ? null : resume);
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);

    // Validate file count
    if (files.length > 10) {
      setError("You can only upload up to 10 files at once");
      return;
    }

    // Validate all files are PDFs
    const invalidFile = files.find((file) => file.type !== "application/pdf");
    if (invalidFile) {
      setError("Only PDF files are allowed");
      return;
    }

    setError("");
    setSelectedUploadFiles(files);
  };

  const handleUpload = async () => {
    if (!user || selectedUploadFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedUploadFiles.length; i++) {
        const file = selectedUploadFiles[i];
        await uploadUserFile(
          file,
          user.id,
          true,
          "/dashboard/transform-resume"
        );
        setUploadProgress(((i + 1) / selectedUploadFiles.length) * 100);
      }
      setIsUploading(false);
      setIsUpdatingMemories(true);
      void updateKnowledgeBase([]);
      setShowUploadDialog(false);
    } catch (error) {
      setError("Error uploading files. Please try again.");
    } finally {
      setIsUploading(false);
      setIsUpdatingMemories(false);
      setUploadProgress(0);
      setSelectedUploadFiles([]);
    }
  };

  const handleTransformClick = async () => {
    if (!selectedFile && !selectedResume) return;

    setIsTransforming(true);
    try {
      if (selectedFile) {
        // Get the file name without the extension
        const fileName = selectedFile.display_name.replace(/\.[^/.]+$/, "");

        // Call the API to transform the file into a resume
        const response = await fetch("/api/resume/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            additionalFileIds: [selectedFile.id],
            messages: [],
            resume_name_override: fileName,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to transform resume");
        }

        const { resumeId } = await response.json();

        // Fetch the newly created resume
        const resumeResponse = await fetch(`/api/resumes/${resumeId}`);
        if (!resumeResponse.ok) {
          throw new Error("Failed to fetch transformed resume");
        }

        const newResume = await resumeResponse.json();
        setSelectedResume(newResume);
      }

      setShowTransformation(true);
    } catch (error) {
      setError("Failed to transform resume. Please try again.");
    } finally {
      setIsTransforming(false);
    }
  };

  const PDFViewer = ({
    file,
    isMobile = false,
  }: {
    file: UserFile | null;
    isMobile?: boolean;
  }) => {
    if (!file) return null;

    if (isMobile) {
      return (
        <div className="w-full h-full">
          <iframe
            src={file.signedUrl}
            className="w-full h-full border-none"
            title={file.display_name}
          />
        </div>
      );
    }

    return (
      <div className="w-full h-full">
        <object
          data={file.signedUrl}
          type="application/pdf"
          className="w-full h-full"
        >
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Unable to display PDF.{" "}
              <a
                href={file.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Open in new tab
              </a>
            </p>
          </div>
        </object>
      </div>
    );
  };

  if (showTransformation && selectedResume) {
    return <ResumeTransformation resume={selectedResume} />;
  }

  return (
    <>
      <div className="container mx-auto py-4 h-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Transform Resume</h1>
          <Button
            variant="ai"
            onClick={handleTransformClick}
            disabled={(!selectedFile && !selectedResume) || isTransforming}
          >
            Transform Resume
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
          <div
            className={`w-full ${selectedFile || selectedResume ? "lg:w-1/2" : "lg:w-full"} h-full transition-all duration-300 ease-in-out`}
          >
            <Card className="p-4 h-full flex flex-col">
              <CardHeader className="px-0 pt-0 sticky top-0 bg-background z-10 flex flex-row items-center justify-between">
                <CardTitle>Select Resume</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadDialog(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resume
                </Button>
              </CardHeader>
              <div className="overflow-y-auto min-h-0">
                <Card className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userFiles.map((file) => (
                      <div key={file.id} className="space-y-4">
                        <Card
                          className={`cursor-pointer transition-colors ${
                            selectedFile?.id === file.id
                              ? "bg-accent"
                              : "hover:bg-accent/50"
                          }`}
                          onClick={() => handleFileClick(file)}
                        >
                          <CardHeader>
                            <CardTitle className="text-base">
                              {file.display_name}
                            </CardTitle>
                          </CardHeader>
                        </Card>
                        {/* Mobile Preview - Show below selected card */}
                        {selectedFile?.id === file.id && (
                          <div
                            className="lg:hidden border rounded-lg bg-background overflow-hidden max-h-0 transition-all duration-300 ease-in-out"
                            style={{
                              maxHeight:
                                selectedFile?.id === file.id
                                  ? "calc(100vh - 12rem)"
                                  : "0",
                              opacity: selectedFile?.id === file.id ? 1 : 0,
                              marginTop:
                                selectedFile?.id === file.id ? "1rem" : "0",
                            }}
                          >
                            <div className="p-4 border-b flex justify-between items-center">
                              <h2 className="text-lg font-semibold truncate">
                                {file.display_name}
                              </h2>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedFile(null)}
                                className="h-8 w-8 shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="w-full h-[calc(100vh-16rem)]">
                              <PDFViewer file={file} isMobile={true} />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {resumes.map((resume) => (
                      <div key={resume.id} className="space-y-4">
                        <Card
                          className={`cursor-pointer transition-colors ${
                            selectedResume?.id === resume.id
                              ? "bg-accent"
                              : "hover:bg-accent/50"
                          }`}
                          onClick={() => handleResumeClick(resume)}
                        >
                          <CardHeader>
                            <CardTitle className="text-base">
                              {resume.name}
                            </CardTitle>
                          </CardHeader>
                        </Card>
                        {/* Mobile Preview - Show below selected card */}
                        {selectedResume?.id === resume.id && (
                          <div
                            className="lg:hidden border rounded-lg bg-background overflow-hidden max-h-0 transition-all duration-300 ease-in-out"
                            style={{
                              maxHeight:
                                selectedResume?.id === resume.id
                                  ? "calc(100vh - 12rem)"
                                  : "0",
                              opacity: selectedResume?.id === resume.id ? 1 : 0,
                              marginTop:
                                selectedResume?.id === resume.id ? "1rem" : "0",
                            }}
                          >
                            <div className="p-4 border-b flex justify-between items-center">
                              <h2 className="text-lg font-semibold truncate">
                                {resume.name}
                              </h2>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedResume(null)}
                                className="h-8 w-8 shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="p-4">
                              <ResumePreview
                                readOnly={true}
                                loading={false}
                                resume={resume}
                                setResume={() => {}}
                                resumeId={resume.id}
                                hasReachedFreemiumLimit={false}
                                isFreemiumEnabled={false}
                                isLocked={true}
                                removeMaxHeight={true}
                                isEditMode={false}
                                setIsEditMode={() => {}}
                                transformResumeEnabled={false}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </Card>
          </div>

          {/* Preview Panel - Hidden on mobile, animated slide-in/out on desktop */}
          <div
            className={`hidden lg:flex flex-col bg-background border rounded-lg transition-all duration-300 ease-in-out ${
              selectedFile || selectedResume
                ? "w-1/2 opacity-100 translate-x-0"
                : "w-0 opacity-0 translate-x-full"
            }`}
          >
            {selectedFile && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-semibold truncate">
                    {selectedFile.display_name}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                    className="h-8 w-8 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 min-h-0">
                  <PDFViewer file={selectedFile} />
                </div>
              </div>
            )}
            {selectedResume && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-semibold truncate">
                    {selectedResume.name}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedResume(null)}
                    className="h-8 w-8 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  <ResumePreview
                    readOnly={true}
                    loading={false}
                    resume={selectedResume}
                    setResume={() => {}}
                    resumeId={selectedResume.id}
                    hasReachedFreemiumLimit={false}
                    isFreemiumEnabled={false}
                    isLocked={true}
                    removeMaxHeight={true}
                    isEditMode={false}
                    setIsEditMode={() => {}}
                    transformResumeEnabled={false}
                  />
                </div>
              </div>
            )}
          </div>

          {/* File Upload Dialog */}
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Resume</DialogTitle>
                <DialogDescription>
                  Upload your resume in PDF format. You can upload multiple
                  files at once.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="text-red-500 text-sm mb-4">{error}</div>
              )}

              <div className="space-y-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  multiple
                />
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                    className="w-full"
                    disabled={isUploading || isUpdatingMemories}
                  >
                    {isUploading || isUpdatingMemories ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isUploading ? "Uploading..." : "Updating memories..."}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Select PDF files
                      </>
                    )}
                  </Button>
                  {selectedUploadFiles.length > 0 &&
                    !isUploading &&
                    !isUpdatingMemories && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {selectedUploadFiles.length} file(s) selected
                        </p>
                        <div className="space-y-1">
                          {selectedUploadFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded-md"
                            >
                              <span className="truncate">{file.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setSelectedUploadFiles(
                                    selectedUploadFiles.filter(
                                      (_, i) => i !== index
                                    )
                                  );
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  {(isUploading || isUpdatingMemories) && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {isUploading
                          ? `${Math.round(uploadProgress)}% uploaded`
                          : "Updating memories..."}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    You can upload multiple PDF files at once
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleUpload}
                  disabled={
                    selectedUploadFiles.length === 0 ||
                    isUploading ||
                    isUpdatingMemories
                  }
                  className="w-full"
                >
                  {isUploading || isUpdatingMemories ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isUploading ? "Uploading..." : "Updating memories..."}
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isTransforming} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideClose>
          <DialogHeader>
            <DialogTitle>Processing Resume</DialogTitle>
            <DialogDescription className="flex flex-col items-center space-y-4 pt-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-center">
                We're processing your resume to prepare it for transformation.
                <br />
                <br />
                This could take a few minutes depending on the size of the file.
                <br />
                <br />
                Please don't close this window.
              </p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
