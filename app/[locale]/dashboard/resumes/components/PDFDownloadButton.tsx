"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ResumeDataType } from "./ResumeBuilder";
import { ResumePDF } from "./ResumePDF";

interface PDFDownloadButtonProps {
  resume: ResumeDataType;
  loading: boolean;
}

export default function PDFDownloadButton({
  resume,
  loading,
}: PDFDownloadButtonProps) {
  const t = useTranslations("resumeBuilder");
  const [downloading, setDownloading] = useState(false);

  if (typeof window === "undefined") {
    return null;
  }

  return (
    <PDFDownloadLink
      document={<ResumePDF resume={resume} />}
      fileName={`${resume.name ? resume.name.replace(/\s+/g, "_") : "Resume"}.pdf`}
      className="w-full sm:w-auto"
    >
      {({ loading: pdfLoading }) => (
        <Button
          disabled={pdfLoading || downloading || loading}
          className="flex items-center gap-2 w-full"
        >
          {pdfLoading || downloading ? (
            <>
              <span className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
              {t("downloading")}
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {t("downloadResume")}
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
