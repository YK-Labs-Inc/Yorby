"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";
import type { CandidateData } from "./actions";

interface CandidateApplicationFilesSectionProps {
  candidateData: CandidateData;
}

export default function CandidateApplicationFilesSection({
  candidateData,
}: CandidateApplicationFilesSectionProps) {
  const t = useTranslations("apply.recruiting.candidates.info");
  const { applicationFiles } = candidateData;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };


  // Group files by type
  const resumeFiles = applicationFiles.filter(file => 
    file.user_file.mime_type?.includes("pdf") || 
    file.user_file.mime_type?.includes("document") ||
    file.user_file.display_name.toLowerCase().includes("resume") ||
    file.user_file.display_name.toLowerCase().includes("cv")
  );
  
  const otherFiles = applicationFiles.filter(file => !resumeFiles.includes(file));

  if (applicationFiles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 px-6">
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{t("applicationFiles")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("filesCount", { count: applicationFiles.length })}
          </p>
        </div>

        <div className="space-y-4">
          {/* Resume files from applicationFiles */}
          {resumeFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Resume
              </h4>
              <div className="space-y-2">
                {resumeFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {file.user_file.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.user_file.mime_type} • {formatDate(file.created_at)}
                        </p>
                      </div>
                    </div>
                    {file.user_file.signed_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(file.user_file.signed_url, "_blank")
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other application files */}
          {otherFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Other Documents</h4>
              <div className="space-y-2">
                {otherFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {file.user_file.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.user_file.mime_type} • {formatDate(file.created_at)}
                        </p>
                      </div>
                    </div>
                    {file.user_file.signed_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(file.user_file.signed_url, "_blank")
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}