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
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
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
import { usePathname } from "next/navigation";

interface ResumePreviewProps {
  loading: boolean;
  resume: ResumeDataType;
  setResume: Dispatch<SetStateAction<ResumeDataType | null>>;
  resumeId: string;
  editCount?: number;
  hasReachedFreemiumLimit: boolean;
  onShowLimitDialog?: () => void;
  isFreemiumEnabled: boolean;
  isLocked: boolean;
  removeMaxHeight?: boolean;
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

// Add PDF styles after imports
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  contactInfo: {
    fontSize: 10,
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    borderBottom: 1,
    paddingBottom: 3,
  },
  detailItem: {
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 11,
    fontWeight: "bold",
  },
  detailSubtitle: {
    fontSize: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  bulletPoint: {
    fontSize: 10,
    marginLeft: 15,
    marginTop: 2,
  },
  listItem: {
    fontSize: 10,
    marginLeft: 5,
    marginTop: 2,
  },
});

// Add ResumePDF component after styles
const ResumePDF = ({ resume }: { resume: ResumeDataType }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{resume.name}</Text>
        <View style={styles.contactInfo}>
          {resume.email && <Text>{resume.email}</Text>}
          {resume.phone && <Text>• {resume.phone}</Text>}
          {resume.location && <Text>• {resume.location}</Text>}
        </View>
      </View>

      {resume.resume_sections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>

          {section.resume_list_items.length > 0 ? (
            <View>
              {section.resume_list_items.map((item, itemIndex) => (
                <Text key={itemIndex} style={styles.listItem}>
                  • {item.content}
                </Text>
              ))}
            </View>
          ) : (
            <View>
              {section.resume_detail_items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.detailItem}>
                  {item.title && (
                    <Text style={styles.detailTitle}>{item.title}</Text>
                  )}
                  {(item.subtitle || item.date_range) && (
                    <View style={styles.detailSubtitle}>
                      {item.subtitle && <Text>{item.subtitle}</Text>}
                      {item.date_range && <Text>{item.date_range}</Text>}
                    </View>
                  )}
                  {item.resume_item_descriptions && (
                    <View>
                      {item.resume_item_descriptions.map(
                        (point, pointIndex) => (
                          <Text key={pointIndex} style={styles.bulletPoint}>
                            • {point.description}
                          </Text>
                        )
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </Page>
  </Document>
);

export default function ResumePreview({
  loading,
  resume,
  setResume,
  resumeId,
  onShowLimitDialog,
  hasReachedFreemiumLimit,
  isFreemiumEnabled,
  isLocked,
  removeMaxHeight,
}: ResumePreviewProps) {
  const t = useTranslations("resumeBuilder");
  const [downloading, setDownloading] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showNewSectionDialog, setShowNewSectionDialog] =
    useState<boolean>(false);
  const [showReassurance, setShowReassurance] = useState<boolean>(false);
  const isTestResume = TEST_RESUME_IDS.includes(resumeId);
  const resumeRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isSampleResume = pathname?.includes("sample-resumes");

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

  const handleEditClick = () => {
    if (isLocked && isFreemiumEnabled && hasReachedFreemiumLimit) {
      onShowLimitDialog?.();
      return;
    }
    setIsEditMode(!isEditMode);
  };

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
      {!isSampleResume && (
        <div className="flex flex-col sm:flex-row justify-end mb-4 gap-2 mt-1">
          {!isTestResume && (
            <>
              {!isEditMode && (
                <Button
                  onClick={handleEditClick}
                  className="flex items-center gap-2 w-full sm:w-auto"
                  variant="outline"
                >
                  <Edit2 className="h-4 w-4" />
                  {t("editResume")}
                </Button>
              )}
              {isEditMode && (
                <Button
                  className="flex items-center gap-2 w-full sm:w-auto"
                  onClick={() => handleSaveResume(resume, resumeId)}
                >
                  <Save className="h-4 w-4" />
                  {t("saveChanges")}
                </Button>
              )}
            </>
          )}
          {isLocked && isFreemiumEnabled && hasReachedFreemiumLimit ? (
            <Button
              className="flex items-center gap-2 w-full sm:w-auto"
              onClick={() => onShowLimitDialog?.()}
            >
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
            </Button>
          ) : (
            <PDFDownloadLink
              document={<ResumePDF resume={resume} />}
              fileName={`${resume.name.replace(/\s+/g, "_")}_Resume.pdf`}
              className="w-full sm:w-auto"
            >
              {({ loading }: { loading: boolean }) => (
                <Button
                  disabled={loading || downloading}
                  className="flex items-center gap-2 w-full"
                >
                  {loading || downloading ? (
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
          )}
        </div>
      )}

      <div
        ref={resumeRef}
        data-pdf-content
        className={`flex-grow overflow-auto bg-white dark:bg-gray-800 rounded-md shadow-sm border p-4 sm:p-6 ${
          !removeMaxHeight ? "max-h-[750px]" : ""
        } ${isLocked ? "select-none" : ""}`}
      >
        {/* Basic Information Section */}
        {isEditMode ? (
          <Card className="mb-4">
            <CardHeader>
              <Input
                value={resume.name}
                onChange={(e) => updateBasicInfo("name", e.target.value)}
                className="text-xl sm:text-2xl font-bold"
                placeholder={t("form.placeholders.name")}
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
            <h1 className="text-xl sm:text-2xl font-bold">{resume.name}</h1>
            <div className="flex flex-wrap gap-2 text-sm mt-1">
              {resume.email && <span>{resume.email}</span>}
              {resume.phone && <span>• {resume.phone}</span>}
              {resume.location && <span>• {resume.location}</span>}
            </div>
          </div>
        )}

        {resume.resume_sections.map((section, sectionIndex) =>
          isEditMode ? (
            <Card key={sectionIndex} className="mb-4">
              <CardHeader className="flex flex-col space-y-2">
                <div className="flex flex-row items-center justify-between">
                  <Input
                    value={section.title}
                    onChange={(e) =>
                      updateSection(sectionIndex, "title", e.target.value)
                    }
                    placeholder={t("form.placeholders.title")}
                    className="text-base sm:text-lg font-semibold flex-1"
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
              <CardContent className="space-y-4">
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
                          className="flex-1 text-sm"
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
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                            />
                          </div>
                        </div>
                        <div className="mt-2 space-y-2">
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div key={sectionIndex} className="mb-6">
              <h2 className="text-base sm:text-lg font-semibold border-b pb-1 mb-2">
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
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <div>{item.subtitle}</div>
                          {item.date_range && <div>{item.date_range}</div>}
                        </div>
                      )}
                      {item.resume_item_descriptions && (
                        <div className="mt-2">
                          <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                            {item.resume_item_descriptions.map(
                              (point, pointIndex) => (
                                <li
                                  key={pointIndex}
                                  className="flex items-center before:content-['•'] before:mr-2 pl-0 list-none text-sm"
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
          )
        )}

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
