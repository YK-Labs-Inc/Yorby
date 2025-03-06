"use client";

import { useTranslations } from "next-intl";
import {
  useState,
  useRef,
  Dispatch,
  SetStateAction,
  useEffect,
  useActionState,
} from "react";
import { Button } from "@/components/ui/button";
import { ResumeDataType } from "./ResumeBuilder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Save, Plus, Trash2 } from "lucide-react";
import { saveResumeServerAction } from "../actions";
import React from "react";
import html2pdf from "html2pdf.js";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Switch } from "@/components/ui/switch";

interface ResumePreviewProps {
  loading: boolean;
  resume: ResumeDataType;
  setResume: Dispatch<SetStateAction<ResumeDataType | null>>;
  resumeId: string;
}

export default function ResumePreview({
  loading,
  resume,
  setResume,
  resumeId,
}: ResumePreviewProps) {
  const t = useTranslations("resumeBuilder");
  const [downloading, setDownloading] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showEmptySections, setShowEmptySections] = useState<boolean>(true);
  const resumeRef = useRef<HTMLDivElement>(null);
  const { logError } = useAxiomLogging();

  const [saveState, saveAction, pending] = useActionState(
    saveResumeServerAction,
    {
      error: "",
    }
  );

  useEffect(() => {
    if (saveState?.error) {
      alert(saveState.error);
    } else {
      setIsEditMode(false);
    }
  }, [saveState]);

  const downloadAsPdf = async () => {
    if (!resume || !resumeRef.current) return;

    setDownloading(true);
    try {
      // Force light mode for PDF generation
      const currentTheme = document.documentElement.classList.contains("dark");
      if (currentTheme) {
        document.documentElement.classList.remove("dark");
      }

      // Clone the resume div to avoid modifying the actual DOM
      const element = resumeRef.current.cloneNode(true) as HTMLElement;

      // Remove any buttons or interactive elements from the clone
      element.querySelectorAll("button").forEach((button) => button.remove());

      // Set white background explicitly and optimize for PDF generation
      element.style.backgroundColor = "white";
      element.style.border = "none";
      element.style.padding = "20px";
      element.style.width = "210mm"; // A4 width
      element.style.margin = "0";
      element.style.height = "auto"; // Let height be determined by content

      // Configure pdf options
      const opt = {
        margin: [15, 15], // Slightly larger margins for better readability
        filename: `${resume.name.replace(/\s+/g, "_")}_Resume.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: -window.scrollY,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          logging: false,
          removeContainer: true, // Remove the temporary container after rendering
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          compress: true,
          putOnlyUsedFonts: true,
          precision: 16,
          floatPrecision: 16,
        },
        pagebreak: {
          mode: ["avoid-all", "css", "legacy"],
          before: ".page-break",
          avoid: ["tr", "td", ".description-item"],
          after: [".avoid-break-after"],
        },
      };

      // Generate PDF
      await html2pdf().set(opt).from(element).save();

      // Restore dark mode if it was enabled
      if (currentTheme) {
        document.documentElement.classList.add("dark");
      }
    } catch (error) {
      logError("Error generating PDF", { error });
      alert(t("downloadError"));
    } finally {
      setDownloading(false);
    }
  };

  const updateBasicInfo = (field: keyof ResumeDataType, value: string) => {
    setResume(
      (prev: ResumeDataType | null) =>
        ({
          ...prev,
          [field]: value,
        }) as ResumeDataType
    );
  };

  const updateSection = (sectionIndex: number, field: string, value: any) => {
    setResume(
      (prev) =>
        ({
          ...prev,
          sections: prev?.sections.map((section, idx) =>
            idx === sectionIndex ? { ...section, [field]: value } : section
          ),
        }) as ResumeDataType
    );
  };

  const updateDetailItem = (
    sectionIndex: number,
    itemIndex: number,
    field: string,
    value: any
  ) => {
    setResume(
      (prev) =>
        ({
          ...prev,
          sections: prev?.sections.map((section, idx) => {
            if (idx === sectionIndex) {
              const newContent = (section.content as any[]).map(
                (item, contentIdx) =>
                  contentIdx === itemIndex ? { ...item, [field]: value } : item
              );
              return { ...section, content: newContent };
            }
            return section;
          }),
        }) as ResumeDataType
    );
  };

  const updateSkills = (sectionIndex: number, skillsString: string) => {
    const skills = skillsString.split("\n");
    setResume(
      (prev) =>
        ({
          ...prev,
          sections: prev?.sections.map((section, idx) =>
            idx === sectionIndex ? { ...section, content: skills } : section
          ),
        }) as ResumeDataType
    );
  };

  const addNewDetailItem = (sectionIndex: number) => {
    setResume(
      (prev) =>
        ({
          ...prev,
          sections: prev?.sections.map((section, idx) => {
            if (
              idx === sectionIndex &&
              !section.title.toLowerCase().includes("skill")
            ) {
              const newItem = {
                title: t("newItemDefaults.title"),
                organization: t("newItemDefaults.organization"),
                date: t("newItemDefaults.date"),
                description: [t("newItemDefaults.description.0")],
              };

              return {
                ...section,
                content: [...(section.content as Array<any>), newItem],
              };
            }
            return section;
          }),
        }) as ResumeDataType
    );
  };

  const addNewSection = () => {
    setResume(
      (prev) =>
        ({
          ...prev,
          sections: [
            ...(prev?.sections || []),
            {
              title: t("newSectionTitle"),
              content: [],
            },
          ],
        }) as ResumeDataType
    );
  };

  const deleteDetailItem = (sectionIndex: number, itemIndex: number) => {
    setResume(
      (prev) =>
        ({
          ...prev,
          sections: prev?.sections.map((section, idx) => {
            if (idx === sectionIndex) {
              const newContent = (section.content as Array<any>).filter(
                (_, i) => i !== itemIndex
              );
              return { ...section, content: newContent };
            }
            return section;
          }),
        }) as ResumeDataType
    );
  };

  const getSectionCTA = (sectionTitle: string) => {
    if (sectionTitle.toLowerCase().includes("skill")) {
      return t("addSkill");
    }
    if (sectionTitle.toLowerCase().includes("education")) {
      return t("addEducation");
    }
    if (sectionTitle.toLowerCase().includes("work experience")) {
      return t("addWorkExperience");
    }
    return t("addItem");
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
      <div className="flex justify-end mb-4 gap-2 mt-1">
        {!isEditMode && (
          <>
            <div className="flex items-center gap-2">
              <Switch
                checked={showEmptySections}
                onCheckedChange={setShowEmptySections}
                aria-label={t("showEmptySections")}
              />
              <span className="text-sm">{t("showEmptySections")}</span>
            </div>
            <Button
              onClick={() => setIsEditMode(!isEditMode)}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Edit2 className="h-4 w-4" />
              {t("editResume")}
            </Button>
          </>
        )}
        {isEditMode && (
          <form action={saveAction}>
            <input type="hidden" name="resumeId" value={resumeId} />
            <input type="hidden" name="resume" value={JSON.stringify(resume)} />
            <Button
              disabled={pending}
              type="submit"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {pending ? t("savingChanges") : t("saveChanges")}
            </Button>
          </form>
        )}
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
          {isEditMode ? (
            <div className="space-y-2">
              <Input
                value={resume.name}
                onChange={(e) => updateBasicInfo("name", e.target.value)}
                className="text-2xl font-bold"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  value={resume.email}
                  onChange={(e) => updateBasicInfo("email", e.target.value)}
                  placeholder="Email"
                />
                <Input
                  value={resume.phone}
                  onChange={(e) => updateBasicInfo("phone", e.target.value)}
                  placeholder="Phone"
                />
                <Input
                  value={resume.location}
                  onChange={(e) => updateBasicInfo("location", e.target.value)}
                  placeholder="Location"
                />
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{resume.name}</h1>
              <div className="flex flex-wrap gap-2 text-sm mt-1">
                {resume.email && <span>{resume.email}</span>}
                {resume.phone && <span>• {resume.phone}</span>}
                {resume.location && <span>• {resume.location}</span>}
              </div>
            </>
          )}
        </div>

        {resume.sections.map((section, sectionIndex) => {
          // Skip rendering empty sections in view mode unless showEmptySections is true
          if (!isEditMode && !showEmptySections) {
            const isEmpty =
              Array.isArray(section.content) &&
              (section.content.length === 0 ||
                (section.content.length === 1 && section.content[0] === ""));
            if (isEmpty) return null;
          }

          return (
            <div key={sectionIndex} className="mb-6">
              {isEditMode ? (
                <div className="mb-2">
                  <Input
                    value={section.title}
                    onChange={(e) =>
                      updateSection(sectionIndex, "title", e.target.value)
                    }
                    className="text-lg font-semibold"
                  />
                </div>
              ) : (
                <h2 className="text-lg font-semibold border-b pb-1 mb-2">
                  {section.title}
                </h2>
              )}

              {section.title.toLowerCase().includes("skill") ? (
                isEditMode ? (
                  <Textarea
                    value={(section.content as string[]).join("\n")}
                    onChange={(e) => {
                      let descriptions = e.target.value.split("\n");
                      if (descriptions.length === 1 && descriptions[0] === "") {
                        descriptions = [];
                      }
                      updateSkills(sectionIndex, e.target.value);
                    }}
                    placeholder="Enter skills (one per line)"
                    className="w-full min-h-[100px]"
                  />
                ) : (
                  <div className="flex flex-col flex-wrap gap-0.5">
                    {(section.content as Array<string>).map(
                      (skill, skillIndex) => (
                        <span key={skillIndex} className="text-sm px-2 ">
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                )
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
                      {isEditMode ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={item.title}
                              onChange={(e) =>
                                updateDetailItem(
                                  sectionIndex,
                                  itemIndex,
                                  "title",
                                  e.target.value
                                )
                              }
                              className="font-medium flex-1"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() =>
                                deleteDetailItem(sectionIndex, itemIndex)
                              }
                              className="shrink-0"
                              type="button"
                              title={t("deleteItem")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={item.organization || ""}
                              onChange={(e) =>
                                updateDetailItem(
                                  sectionIndex,
                                  itemIndex,
                                  "organization",
                                  e.target.value
                                )
                              }
                              placeholder="Organization"
                              className="flex-1"
                            />
                            <Input
                              value={item.date || ""}
                              onChange={(e) =>
                                updateDetailItem(
                                  sectionIndex,
                                  itemIndex,
                                  "date",
                                  e.target.value
                                )
                              }
                              placeholder="Date"
                              className="w-1/3"
                            />
                          </div>
                          <Textarea
                            value={item.description.join("\n")}
                            onChange={(e) => {
                              let descriptions = e.target.value.split("\n");
                              if (
                                descriptions.length === 1 &&
                                descriptions[0] === ""
                              ) {
                                descriptions = [];
                              }
                              updateDetailItem(
                                sectionIndex,
                                itemIndex,
                                "description",
                                descriptions
                              );
                            }}
                            placeholder="Description (one point per line)"
                            className="min-h-[100px]"
                          />
                        </div>
                      ) : (
                        <>
                          {item.title && (
                            <div className="font-medium">{item.title}</div>
                          )}
                          {item.organization && (
                            <div className="flex justify-between">
                              <div>{item.organization}</div>
                              {item.date && <div>{item.date}</div>}
                            </div>
                          )}
                          {item.description && (
                            <div className="mt-1">
                              <ul className="list-disc pl-5 space-y-1">
                                {item.description.map((point, pointIndex) => (
                                  <li
                                    key={pointIndex}
                                    className="flex items-center before:content-['•'] before:mr-2 pl-0 list-none"
                                  >
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  {isEditMode && (
                    <Button
                      onClick={() => addNewDetailItem(sectionIndex)}
                      className="w-full mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {getSectionCTA(section.title)}
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Section Button */}
        {isEditMode && (
          <div className="mt-6">
            <Button
              onClick={addNewSection}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("addSection")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
