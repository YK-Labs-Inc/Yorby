"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FileText, Mail, Phone, Calendar, ExternalLink } from "lucide-react";
import type { CandidateData } from "./actions";

interface CandidateInfoSectionProps {
  candidateData: CandidateData;
}

export default function CandidateInfoSection({
  candidateData,
}: CandidateInfoSectionProps) {
  const tOverview = useTranslations("apply.recruiting.candidates.overview");
  const t = useTranslations("apply.recruiting.candidates.info");
  const { candidate, applicationFiles } = candidateData;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 px-6">
      {/* Candidate Information Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t("contactInfo")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          {candidate.candidate_email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${candidate.candidate_email}`}
                className="text-sm hover:underline"
              >
                {candidate.candidate_email}
              </a>
            </div>
          )}

          {/* Phone */}
          {candidate.candidate_phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${candidate.candidate_phone}`}
                className="text-sm hover:underline"
              >
                {candidate.candidate_phone}
              </a>
            </div>
          )}

          {/* Resume */}
          {candidate.resume_url && (
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <a
                href={candidate.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {tOverview("viewResume")}
              </a>
            </div>
          )}

          {/* Applied Date */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {t("applied", { date: formatDate(candidate.applied_at) })}
            </span>
          </div>
        </div>
      </div>

      {/* Application Files Section */}
      {applicationFiles.length > 0 && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{t("applicationFiles")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("filesCount", { count: applicationFiles.length })}
            </p>
          </div>
          <div className="space-y-2">
            {applicationFiles.map((file) => (
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
  );
}
