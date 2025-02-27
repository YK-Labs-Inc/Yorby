"use client";

import { useTranslations } from "next-intl";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ResumeSection {
  title: string;
  content: any[];
}

interface ResumeData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  summary: string;
  sections: ResumeSection[];
}

interface ResumePreviewProps {
  resume: ResumeData | null;
  loading: boolean;
}

export default function ResumePreview({ resume, loading }: ResumePreviewProps) {
  const t = useTranslations("resumeBuilder");
  const [downloading, setDownloading] = useState<boolean>(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  const downloadAsPdf = async () => {
    if (!resume || !resumeRef.current) return;

    setDownloading(true);
    try {
      const response = await fetch("/api/resume/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resume }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.name.replace(/\s+/g, "_")}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(t("downloadError"));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-lg">{t("buildingChatbot")}</p>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="flex flex-col items-center justify-center p-10 h-[600px] w-full bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">
            {t("waitingForAssistant")}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            {t("description")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end mb-4">
        <Button
          onClick={downloadAsPdf}
          disabled={downloading}
          className="flex items-center gap-2"
        >
          {downloading ? (
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
      </div>

      <div
        ref={resumeRef}
        className="flex-grow overflow-auto bg-white dark:bg-gray-800 rounded-md shadow-sm border p-6 max-h-[750px]"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{resume.name}</h1>
          <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-300 mt-1">
            {resume.email && <span>{resume.email}</span>}
            {resume.phone && <span>• {resume.phone}</span>}
            {resume.location && <span>• {resume.location}</span>}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold border-b pb-1 mb-2">
            {t("summary")}
          </h2>
          <p className="text-sm">{resume.summary}</p>
        </div>

        {resume.sections.map((section, index) => (
          <div key={index} className="mb-6">
            <h2 className="text-lg font-semibold border-b pb-1 mb-2">
              {section.title}
            </h2>
            {section.title.toLowerCase().includes("skill") ? (
              <div className="flex flex-wrap gap-2">
                {section.content.map((skill, i) => (
                  <span
                    key={i}
                    className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {section.content.map((item, i) => (
                  <div key={i} className="text-sm">
                    {item.title && (
                      <div className="font-medium">{item.title}</div>
                    )}
                    {item.organization && (
                      <div className="flex justify-between">
                        <div>{item.organization}</div>
                        {item.date && (
                          <div className="text-gray-500">{item.date}</div>
                        )}
                      </div>
                    )}
                    {item.description && (
                      <div className="mt-1 text-gray-600 dark:text-gray-300">
                        {typeof item.description === "string" ? (
                          <p>{item.description}</p>
                        ) : (
                          <ul className="list-disc pl-5 space-y-1">
                            {item.description.map(
                              (point: string, idx: number) => (
                                <li key={idx}>{point}</li>
                              )
                            )}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
