"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { Tables } from "@/utils/supabase/database.types";

interface ResumePreviewProps {
  loading: boolean;
  resumeId: string;
}

// Define types to structure the aggregated resume data using Tables types
type ResumeSection = {
  title: Tables<"resume_sections">["title"];
  content:
    | Tables<"resume_list_items">["content"][]
    | {
        title: Tables<"resume_detail_items">["title"];
        organization: Tables<"resume_detail_items">["subtitle"];
        date: Tables<"resume_detail_items">["date_range"];
        description: Tables<"resume_item_descriptions">["description"][];
      }[];
};

type ResumeDataType = {
  name: Tables<"resumes">["name"];
  email: NonNullable<Tables<"resumes">["email"]>;
  phone: NonNullable<Tables<"resumes">["phone"]>;
  location: NonNullable<Tables<"resumes">["location"]>;
  summary: NonNullable<Tables<"resumes">["summary"]>;
  sections: ResumeSection[];
};

export default function ResumePreview({
  loading: initialLoading,
  resumeId,
}: ResumePreviewProps) {
  const t = useTranslations("resumeBuilder");
  const [downloading, setDownloading] = useState<boolean>(false);
  const resumeRef = useRef<HTMLDivElement>(null);
  const [resume, setResume] = useState<ResumeDataType | null>(null);
  const [loading, setLoading] = useState<boolean>(initialLoading);

  useEffect(() => {
    // If resumeId is provided, fetch the resume data
    if (resumeId) {
      const fetchResumeData = async () => {
        setLoading(true);
        try {
          const supabase = createSupabaseBrowserClient();

          // Fetch basic resume data
          const { data: resumeData, error: resumeError } = await supabase
            .from("resumes")
            .select("*")
            .eq("id", resumeId)
            .single();

          if (resumeError || !resumeData) {
            throw new Error(resumeError?.message || "Resume not found");
          }

          // Fetch resume sections
          const { data: sectionsData, error: sectionsError } = await supabase
            .from("resume_sections")
            .select("*")
            .eq("resume_id", resumeId)
            .order("display_order", { ascending: true });

          if (sectionsError) {
            throw new Error(sectionsError.message);
          }

          // Create an array to hold all section data with their content
          const formattedSections = [];

          // Process each section
          for (const section of sectionsData as Tables<"resume_sections">[]) {
            // Check if it's a skills section (usually just list items)
            const isSkillsSection = section.title
              .toLowerCase()
              .includes("skill");

            if (isSkillsSection) {
              // Fetch skills list items
              const { data: listItems, error: listError } = await supabase
                .from("resume_list_items")
                .select("*")
                .eq("section_id", section.id)
                .order("display_order", { ascending: true });

              if (listError) {
                throw new Error(listError.message);
              }

              // Add skills section with list items as content
              formattedSections.push({
                title: section.title,
                content: (listItems as Tables<"resume_list_items">[]).map(
                  (item) => item.content
                ),
              });
            } else {
              // Fetch detail items for this section
              const { data: detailItems, error: detailError } = await supabase
                .from("resume_detail_items")
                .select("*")
                .eq("section_id", section.id)
                .order("display_order", { ascending: true });

              if (detailError) {
                throw new Error(detailError.message);
              }

              // Process each detail item to get its descriptions
              const formattedItems = [];
              for (const item of detailItems as Tables<"resume_detail_items">[]) {
                // Fetch descriptions for this detail item
                const { data: descriptions, error: descError } = await supabase
                  .from("resume_item_descriptions")
                  .select("*")
                  .eq("detail_item_id", item.id)
                  .order("display_order", { ascending: true });

                if (descError) {
                  throw new Error(descError.message);
                }

                // Format the detail item with its descriptions
                formattedItems.push({
                  title: item.title,
                  organization: item.subtitle,
                  date: item.date_range,
                  description: (
                    descriptions as Tables<"resume_item_descriptions">[]
                  ).map((desc) => desc.description),
                });
              }

              // Add the section with its formatted detail items
              formattedSections.push({
                title: section.title,
                content: formattedItems,
              });
            }
          }

          // Create the complete resume data object
          const formattedResume: ResumeDataType = {
            name: resumeData.name,
            email: resumeData.email || "",
            phone: resumeData.phone || "",
            location: resumeData.location || "",
            summary: resumeData.summary || "",
            sections: formattedSections,
          };

          setResume(formattedResume);
        } catch (error) {
          console.error("Error fetching resume data:", error);
          setResume(null);
        } finally {
          setLoading(false);
        }
      };

      fetchResumeData();
    }
  }, [resumeId]);

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
    return null;
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

        {resume.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <h2 className="text-lg font-semibold border-b pb-1 mb-2">
              {section.title}
            </h2>
            {section.title.toLowerCase().includes("skill") ? (
              <div className="flex flex-wrap gap-2">
                {(section.content as string[]).map((skill, skillIndex) => (
                  <span
                    key={skillIndex}
                    className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(
                  section.content as Array<{
                    title: string;
                    organization?: string | null;
                    date?: string | null;
                    description: string[];
                  }>
                ).map((item, itemIndex) => (
                  <div key={itemIndex} className="text-sm">
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
                        <ul className="list-disc pl-5 space-y-1">
                          {item.description.map((point, pointIndex) => (
                            <li key={pointIndex}>{point}</li>
                          ))}
                        </ul>
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
