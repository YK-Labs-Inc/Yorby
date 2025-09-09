"use client";

import { useTranslations } from "next-intl";
import { Mail, Phone, Calendar } from "lucide-react";
import type { CandidateData } from "./actions";

interface CandidateInfoSectionProps {
  candidateData: CandidateData;
}

export default function CandidateInfoSection({
  candidateData,
}: CandidateInfoSectionProps) {
  const t = useTranslations("apply.recruiting.candidates.info");

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
          {candidateData.candidate.candidateEmail && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${candidateData.candidate.candidateEmail}`}
                className="text-sm hover:underline"
              >
                {candidateData.candidate.candidateEmail}
              </a>
            </div>
          )}

          {/* Phone */}
          {candidateData.candidate.candidatePhoneNumber && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm hover:underline">
                {candidateData.candidate.candidatePhoneNumber}
              </p>
            </div>
          )}

          {/* Applied Date */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {t("applied", {
                date: formatDate(candidateData.candidate.applied_at),
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Additional Information Section */}
      {candidateData.additionalInfo && candidateData.additionalInfo.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">{t("additionalInfo")}</h3>
          <div className="space-y-3">
            {candidateData.additionalInfo.map((info, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg">
                <span className="text-sm">
                  {info.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
