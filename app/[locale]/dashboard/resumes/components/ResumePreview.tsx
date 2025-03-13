"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, Dispatch, SetStateAction, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ResumeDataType } from "./ResumeBuilder";
import { Input } from "@/components/ui/input";
import {
  Edit2,
  Save,
  Plus,
  Trash2,
  ListTodo,
  Layout,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { saveResume } from "../actions";
import React from "react";
import html2pdf from "html2pdf.js";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ResumePreviewProps {
  loading: boolean;
  resume: ResumeDataType;
  setResume: Dispatch<SetStateAction<ResumeDataType | null>>;
  resumeId: string;
}

const reorderItem = (items: any[], fromIndex: number, toIndex: number) => {
  if (toIndex < 0 || toIndex >= items.length) return items;

  const newItems = [...items];
  const [movedItem] = newItems.splice(fromIndex, 1);
  newItems.splice(toIndex, 0, movedItem);

  // Update display_order to be consecutive starting from 0
  return newItems.map((item, index) => ({
    ...item,
    display_order: index,
  }));
};

const TEST_RESUME_IDS = [
  "4cbdd2c8-a96b-4d3c-bd32-d9b89d924153",
  "0d4a08c1-4054-4c45-b12f-500081499cad",
];

export default function ResumePreview({
  loading,
  resume,
  setResume,
  resumeId,
}: ResumePreviewProps) {
  const t = useTranslations("resumeBuilder");
  const [downloading, setDownloading] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showNewSectionDialog, setShowNewSectionDialog] =
    useState<boolean>(false);
  const [showReassurance, setShowReassurance] = useState<boolean>(false);
  const isTestResume = TEST_RESUME_IDS.includes(resumeId);
  const resumeRef = useRef<HTMLDivElement>(null);
  const { logError } = useAxiomLogging();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading) {
      timeoutId = setTimeout(() => {
        setShowReassurance(true);
      }, 7000);
    } else {
      setShowReassurance(false);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  const handleSaveResume = async (resume: ResumeDataType, resumeId: string) => {
    if (!isTestResume) {
      saveResume(resume, resumeId).then(({ error }) => {
        if (error) {
          setIsEditMode(true);
          alert(error);
        }
      });
    }
    setIsEditMode(false);
  };

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
      element.style.padding = "10px 10px 20px 10px";
      // A4 size in mm (210mm x 297mm), accounting for margins
      element.style.width = "190mm";
      element.style.margin = "auto";
      element.style.minHeight = "297mm";
      element.style.height = "fit-content";
      element.style.position = "relative";
      element.style.maxWidth = "100%";
      element.style.wordWrap = "break-word";

      // Configure pdf options
      const opt = {
        margin: [10, 10, 20, 10],
        filename: `${resume.name.replace(/\s+/g, "_")}_Resume.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
          scale: 4,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight + 40,
          logging: false,
          removeContainer: true,
          onclone: (clonedDoc: Document) => {
            const clonedElement = clonedDoc.querySelector(
              "[data-pdf-content]"
            ) as HTMLElement;
            if (clonedElement) {
              clonedElement.style.height = "auto";
              clonedElement.style.overflow = "visible";
              clonedElement.style.width = "190mm";
              clonedElement.style.margin = "auto";
              clonedElement.style.maxWidth = "100%";
              clonedElement.style.wordWrap = "break-word";
              clonedElement.style.padding = "10px 10px 20px 10px";
            }
          },
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          compress: true,
          putOnlyUsedFonts: true,
          precision: 16,
          floatPrecision: 16,
          hotfixes: ["px_scaling"],
        },
        pagebreak: {
          mode: ["avoid-all", "css", "legacy"],
          before: ".page-break",
          avoid: ["tr", "td", ".description-item"],
          after: [".avoid-break-after"],
          allowTags: ["DIV", "P", "LI", "UL"],
        },
      };

      // Generate PDF with page numbers
      const worker = html2pdf();
      worker.from(element).set(opt).save();

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
          resume_sections: prev?.resume_sections.map((section, idx) =>
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
          resume_sections: prev?.resume_sections.map((section, idx) => {
            if (idx === sectionIndex) {
              const newContent = (section.resume_detail_items as any[]).map(
                (item, contentIdx) =>
                  contentIdx === itemIndex ? { ...item, [field]: value } : item
              );
              return { ...section, resume_detail_items: newContent };
            }
            return section;
          }),
        }) as ResumeDataType
    );
  };

  const updateDetailItemDescription = (
    sectionIndex: number,
    detailIndex: number,
    descriptionIndex: number,
    value: string
  ) => {
    setResume(
      (prev) =>
        ({
          ...prev,
          resume_sections: prev?.resume_sections.map((section, idx) => {
            if (idx === sectionIndex) {
              return {
                ...section,
                resume_detail_items: section.resume_detail_items.map(
                  (detailItem, detailIdx) => {
                    if (detailIdx === detailIndex) {
                      return {
                        ...detailItem,
                        resume_item_descriptions:
                          detailItem.resume_item_descriptions.map(
                            (desc, descIdx) => {
                              if (descIdx === descriptionIndex) {
                                return {
                                  ...desc,
                                  description: value,
                                };
                              }
                              return desc;
                            }
                          ),
                      };
                    }
                    return detailItem;
                  }
                ),
              };
            }
            return section;
          }),
        }) as ResumeDataType
    );
  };

  const addNewDetailItem = (sectionIndex: number) => {
    setResume(
      (prev) =>
        ({
          ...prev,
          resume_sections: prev?.resume_sections.map((section, idx) => {
            if (
              idx === sectionIndex &&
              !section.title.toLowerCase().includes("skill")
            ) {
              const newItem = {
                title: t("newItemDefaults.title"),
                organization: t("newItemDefaults.organization"),
                date: t("newItemDefaults.date"),
                description: [t("newItemDefaults.description.0")],
                resume_item_descriptions: [],
              };

              return {
                ...section,
                resume_detail_items: [
                  ...(section.resume_detail_items as Array<any>),
                  newItem,
                ],
              };
            }
            return section;
          }),
        }) as ResumeDataType
    );
  };

  const addNewDetailItemDescription = (
    sectionIndex: number,
    itemIndex: number
  ) => {
    setResume(
      (prev) =>
        ({
          ...prev,
          resume_sections: prev?.resume_sections.map((section, idx) =>
            idx === sectionIndex
              ? {
                  ...section,
                  resume_detail_items: section.resume_detail_items.map(
                    (item, idx) =>
                      idx === itemIndex
                        ? {
                            ...item,
                            resume_item_descriptions: [
                              ...item.resume_item_descriptions,
                              {
                                description: "",
                                display_order:
                                  item.resume_item_descriptions.length,
                              },
                            ],
                          }
                        : item
                  ),
                }
              : section
          ),
        }) as ResumeDataType
    );
  };

  const addNewListItem = (sectionIndex: number) => {
    setResume(
      (prev) =>
        ({
          ...prev,
          resume_sections: prev?.resume_sections.map((section, idx) =>
            idx === sectionIndex
              ? {
                  ...section,
                  resume_list_items: [
                    ...section.resume_list_items,
                    {
                      content: "",
                      display_order: section.resume_list_items.length,
                    },
                  ],
                }
              : section
          ),
        }) as ResumeDataType
    );
  };
  const addNewSection = (type: "detail" | "list") => {
    setResume(
      (prev) =>
        ({
          ...prev,
          resume_sections: [
            ...(prev?.resume_sections || []),
            {
              title: t("newItemDefaults.title"),
              resume_detail_items:
                type === "detail"
                  ? [
                      {
                        title: t("newItemDefaults.title"),
                        display_order: 0,
                        description: [],
                        resume_item_descriptions: [
                          { description: "", display_order: 0 },
                        ],
                      },
                    ]
                  : [],
              resume_list_items:
                type === "list"
                  ? [
                      {
                        content: "",
                      },
                    ]
                  : [],
              display_order: prev?.resume_sections.length,
            },
          ],
        }) as ResumeDataType
    );
    setShowNewSectionDialog(false);
  };

  const deleteDetailItem = (sectionIndex: number, itemIndex: number) => {
    setResume(
      (prev) =>
        ({
          ...prev,
          resume_sections: prev?.resume_sections.map((section, idx) => {
            if (idx === sectionIndex) {
              const newContent = (
                section.resume_detail_items as Array<any>
              ).filter((_, i) => i !== itemIndex);
              return { ...section, resume_detail_items: newContent };
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

  const deleteSection = (sectionIndex: number) => {
    setResume(
      (prev) =>
        ({
          ...prev,
          resume_sections: prev?.resume_sections.filter(
            (_, idx) => idx !== sectionIndex
          ),
        }) as ResumeDataType
    );
  };

  const moveSection = (sectionIndex: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? sectionIndex - 1 : sectionIndex + 1;
    setResume((prev) => ({
      ...prev!,
      resume_sections: reorderItem(
        prev!.resume_sections,
        sectionIndex,
        newIndex
      ),
    }));
  };

  const moveDetailItem = (
    sectionIndex: number,
    itemIndex: number,
    direction: "up" | "down"
  ) => {
    const newIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
    setResume((prev) => ({
      ...prev!,
      resume_sections: prev!.resume_sections.map((section, idx) => {
        if (idx === sectionIndex) {
          return {
            ...section,
            resume_detail_items: reorderItem(
              section.resume_detail_items,
              itemIndex,
              newIndex
            ),
          };
        }
        return section;
      }),
    }));
  };

  const moveListItem = (
    sectionIndex: number,
    itemIndex: number,
    direction: "up" | "down"
  ) => {
    const newIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
    setResume((prev) => ({
      ...prev!,
      resume_sections: prev!.resume_sections.map((section, idx) => {
        if (idx === sectionIndex) {
          return {
            ...section,
            resume_list_items: reorderItem(
              section.resume_list_items,
              itemIndex,
              newIndex
            ),
          };
        }
        return section;
      }),
    }));
  };

  const deleteResumeListItem = (sectionIndex: number, itemIndex: number) => {
    setResume((prev) => ({
      ...prev!,
      resume_sections: prev!.resume_sections.map((section, idx) =>
        idx === sectionIndex
          ? {
              ...section,
              resume_list_items: section.resume_list_items.filter(
                (_, idx) => idx !== itemIndex
              ),
            }
          : section
      ),
    }));
  };

  const moveDetailItemDescription = (
    sectionIndex: number,
    detailIndex: number,
    descriptionIndex: number,
    direction: "up" | "down"
  ) => {
    const newIndex =
      direction === "up" ? descriptionIndex - 1 : descriptionIndex + 1;
    setResume((prev) => ({
      ...prev!,
      resume_sections: prev!.resume_sections.map((section, idx) => {
        if (idx === sectionIndex) {
          return {
            ...section,
            resume_detail_items: section.resume_detail_items.map(
              (detailItem, detailIdx) => {
                if (detailIdx === detailIndex) {
                  return {
                    ...detailItem,
                    resume_item_descriptions: reorderItem(
                      detailItem.resume_item_descriptions,
                      descriptionIndex,
                      newIndex
                    ),
                  };
                }
                return detailItem;
              }
            ),
          };
        }
        return section;
      }),
    }));
  };

  const deleteDetailItemDescription = (
    sectionIndex: number,
    detailIndex: number,
    descriptionIndex: number
  ) => {
    setResume((prev) => ({
      ...prev!,
      resume_sections: prev!.resume_sections.map((section, idx) =>
        idx === sectionIndex
          ? {
              ...section,
              resume_detail_items: section.resume_detail_items.map(
                (detailItem, detailIdx) =>
                  detailIdx === detailIndex
                    ? {
                        ...detailItem,
                        resume_item_descriptions:
                          detailItem.resume_item_descriptions.filter(
                            (_, idx) => idx !== descriptionIndex
                          ),
                      }
                    : detailItem
              ),
            }
          : section
      ),
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-md shadow-sm border p-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t("updating.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {t("updating.description")}
            </p>
            {showReassurance && (
              <p className="text-gray-600 dark:text-gray-300 mt-2 animate-fade-in">
                {t("updating.reassurance", {
                  defaultValue:
                    "We're still working on it, just a little longer...",
                })}
              </p>
            )}
          </div>

          {/* Decorative Elements */}
          <div className="relative mt-12">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-32 h-32 rounded-full bg-primary/10 blur-xl"
              />
            </div>
            <div className="relative z-10 flex justify-center">
              <LoadingSpinner size="xl" className="text-primary" />
            </div>
          </div>
        </div>
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
          <Button
            onClick={() => setIsEditMode(!isEditMode)}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Edit2 className="h-4 w-4" />
            {t("editResume")}
          </Button>
        )}
        {isEditMode && (
          <Button
            className="flex items-center gap-2"
            onClick={() => handleSaveResume(resume, resumeId)}
          >
            <Save className="h-4 w-4" />
            {t("saveChanges")}
          </Button>
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
        data-pdf-content
        className="flex-grow overflow-auto bg-white dark:bg-gray-800 rounded-md shadow-sm border p-6 max-h-[750px]"
      >
        {/* Basic Information Section */}
        {isEditMode ? (
          <Card className="mb-4">
            <CardHeader>
              <Input
                value={resume.name}
                onChange={(e) => updateBasicInfo("name", e.target.value)}
                className="text-2xl font-bold"
                placeholder={t("form.placeholders.name")}
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  value={resume.email || ""}
                  onChange={(e) => updateBasicInfo("email", e.target.value)}
                  placeholder={t("form.placeholders.email")}
                />
                <Input
                  value={resume.phone || ""}
                  onChange={(e) => updateBasicInfo("phone", e.target.value)}
                  placeholder={t("form.placeholders.phone")}
                />
                <Input
                  value={resume.location || ""}
                  onChange={(e) => updateBasicInfo("location", e.target.value)}
                  placeholder={t("form.placeholders.location")}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{resume.name}</h1>
            <div className="flex flex-wrap gap-2 text-sm mt-1">
              {resume.email && <span>{resume.email}</span>}
              {resume.phone && <span>• {resume.phone}</span>}
              {resume.location && <span>• {resume.location}</span>}
            </div>
          </div>
        )}

        {resume.resume_sections.map((section, sectionIndex) => {
          return isEditMode ? (
            <Card key={sectionIndex} className="mb-4">
              <CardHeader className="flex flex-col space-y-2">
                <div className="flex flex-row items-center justify-between">
                  <Input
                    value={section.title}
                    onChange={(e) =>
                      updateSection(sectionIndex, "title", e.target.value)
                    }
                    placeholder={t("form.placeholders.title")}
                    className="text-lg font-semibold flex-1"
                  />
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveSection(sectionIndex, "up")}
                      disabled={sectionIndex === 0}
                      className="h-8 w-8"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveSection(sectionIndex, "down")}
                      disabled={
                        sectionIndex === resume.resume_sections.length - 1
                      }
                      className="h-8 w-8"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {section.resume_list_items.length > 0 ? (
                  <div className="space-y-2">
                    {section.resume_list_items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-2">
                        <Input
                          value={item.content}
                          onChange={(e) => {
                            const newItems = [...section.resume_list_items];
                            newItems[itemIndex] = {
                              ...item,
                              content: e.target.value,
                            };
                            updateSection(
                              sectionIndex,
                              "resume_list_items",
                              newItems
                            );
                          }}
                          className="flex-1"
                        />
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              moveListItem(sectionIndex, itemIndex, "up")
                            }
                            disabled={itemIndex === 0}
                            className="h-8 w-8"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              moveListItem(sectionIndex, itemIndex, "down")
                            }
                            disabled={
                              itemIndex === section.resume_list_items.length - 1
                            }
                            className="h-8 w-8"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              deleteResumeListItem(sectionIndex, itemIndex)
                            }
                            disabled={section.resume_list_items.length === 1}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {section.resume_detail_items.map((item, itemIndex) => (
                      <div key={itemIndex} className="text-sm">
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
                              placeholder={t("form.placeholders.title")}
                              className="font-medium flex-1"
                            />
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  moveDetailItem(sectionIndex, itemIndex, "up")
                                }
                                disabled={itemIndex === 0}
                                className="h-8 w-8"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  moveDetailItem(
                                    sectionIndex,
                                    itemIndex,
                                    "down"
                                  )
                                }
                                disabled={
                                  itemIndex ===
                                  section.resume_detail_items.length - 1
                                }
                                className="h-8 w-8"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                deleteDetailItem(sectionIndex, itemIndex)
                              }
                              disabled={
                                section.resume_detail_items.length === 1
                              }
                              type="button"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={item.subtitle || ""}
                              onChange={(e) =>
                                updateDetailItem(
                                  sectionIndex,
                                  itemIndex,
                                  "subtitle",
                                  e.target.value
                                )
                              }
                              placeholder={t("form.placeholders.subtitle")}
                              className="flex-1"
                            />
                            <Input
                              value={item.date_range || ""}
                              onChange={(e) =>
                                updateDetailItem(
                                  sectionIndex,
                                  itemIndex,
                                  "date_range",
                                  e.target.value
                                )
                              }
                              placeholder={t("form.placeholders.dateRange")}
                              className="w-1/3"
                            />
                          </div>
                          {item.resume_item_descriptions.map(
                            (description, descriptionIndex) => (
                              <div
                                key={descriptionIndex}
                                className="flex items-center gap-2"
                              >
                                <Input
                                  value={description.description}
                                  onChange={(e) =>
                                    updateDetailItemDescription(
                                      sectionIndex,
                                      itemIndex,
                                      descriptionIndex,
                                      e.target.value
                                    )
                                  }
                                  placeholder={t(
                                    "form.placeholders.description"
                                  )}
                                  className="flex-1"
                                />
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      moveDetailItemDescription(
                                        sectionIndex,
                                        itemIndex,
                                        descriptionIndex,
                                        "up"
                                      )
                                    }
                                    disabled={descriptionIndex === 0}
                                    className="h-8 w-8"
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      moveDetailItemDescription(
                                        sectionIndex,
                                        itemIndex,
                                        descriptionIndex,
                                        "down"
                                      )
                                    }
                                    disabled={
                                      descriptionIndex ===
                                      item.resume_item_descriptions.length - 1
                                    }
                                    className="h-8 w-8"
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      deleteDetailItemDescription(
                                        sectionIndex,
                                        itemIndex,
                                        descriptionIndex
                                      )
                                    }
                                    disabled={
                                      item.resume_item_descriptions.length === 1
                                    }
                                    className="h-8 w-8"
                                  >
                                    <X className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            )
                          )}
                          <Button
                            variant="outline"
                            onClick={() =>
                              addNewDetailItemDescription(
                                sectionIndex,
                                itemIndex
                              )
                            }
                          >
                            <Plus className="h-4 w-4" />
                            {t("form.newItem")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSection(sectionIndex)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("deleteSection")}
                </Button>
                <Button
                  onClick={() => {
                    if (section.resume_list_items.length > 0) {
                      addNewListItem(sectionIndex);
                    } else {
                      addNewDetailItem(sectionIndex);
                    }
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {getSectionCTA(section.title)}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div key={sectionIndex} className="mb-6">
              <h2 className="text-lg font-semibold border-b pb-1 mb-2">
                {section.title}
              </h2>
              {section.resume_list_items.length > 0 ? (
                <div className="flex flex-col flex-wrap gap-0.5">
                  {section.resume_list_items.map((item, itemIndex) => (
                    <span key={itemIndex} className="text-sm px-2">
                      {item.content}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {section.resume_detail_items.map((item, itemIndex) => (
                    <div key={itemIndex} className="text-sm">
                      {item.title && (
                        <div className="font-medium">{item.title}</div>
                      )}
                      {item.subtitle && (
                        <div className="flex justify-between">
                          <div>{item.subtitle}</div>
                          {item.date_range && <div>{item.date_range}</div>}
                        </div>
                      )}
                      {item.resume_item_descriptions && (
                        <div className="mt-1">
                          <ul className="list-disc pl-5 space-y-1">
                            {item.resume_item_descriptions.map(
                              (point, pointIndex) => (
                                <li
                                  key={pointIndex}
                                  className="flex items-center before:content-['•'] before:mr-2 pl-0 list-none"
                                >
                                  {point.description}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Section Button */}
        {isEditMode && (
          <div className="mt-4">
            <Dialog
              open={showNewSectionDialog}
              onOpenChange={setShowNewSectionDialog}
            >
              <Button
                onClick={() => setShowNewSectionDialog(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("addSection")}
              </Button>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t("chooseSectionType")}</DialogTitle>
                  <DialogDescription>
                    {t("chooseSectionTypeDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 pt-4">
                  <Button
                    onClick={() => addNewSection("detail")}
                    variant="outline"
                    className="h-auto p-6 flex flex-col items-center gap-4 group hover:border-primary"
                  >
                    <Layout className="h-8 w-8 group-hover:text-primary" />
                    <div className="text-center space-y-1.5">
                      <h3 className="font-semibold group-hover:text-primary">
                        {t("detailedSection")}
                      </h3>
                      <p className="text-sm text-muted-foreground text-pretty">
                        {t("detailedSectionDescription")}
                      </p>
                    </div>
                  </Button>
                  <Button
                    onClick={() => addNewSection("list")}
                    variant="outline"
                    className="h-auto p-6 flex flex-col items-center gap-4 group hover:border-primary"
                  >
                    <ListTodo className="h-8 w-8 group-hover:text-primary" />
                    <div className="text-center space-y-1.5">
                      <h3 className="font-semibold group-hover:text-primary">
                        {t("listSection")}
                      </h3>
                      <p className="text-sm text-muted-foreground text-pretty">
                        {t("listSectionDescription")}
                      </p>
                    </div>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
