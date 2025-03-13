"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ResumePreview from "../dashboard/resumes/components/ResumePreview";
import { ResumeDataType } from "../dashboard/resumes/components/ResumeBuilder";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { CoreAssistantMessage, CoreMessage } from "ai";
import * as Sentry from "@sentry/nextjs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { useUser } from "@/context/UserContext";
const demoResumes: { resumeId: string; title: string }[] = [
  {
    resumeId: "4cbdd2c8-a96b-4d3c-bd32-d9b89d924153",
    title: "Customer Service",
  },
  {
    resumeId: "0d4a08c1-4054-4c45-b12f-500081499cad",
    title: "Software Engineer",
  },
];

const DEMO_EDIT_OPTIONS = [
  {
    title: "Add Work Experience",
    prompt:
      "I worked as a Marketing Manager at TechCorp from 2020-2023, where I led digital campaigns that increased user engagement by 45% and managed a team of 5 content creators. Can you add this experience to my resume?",
    aiResponse:
      "I've added your Marketing Manager experience at TechCorp (2020-2023) to your resume. I included the key achievements you mentioned: leading digital campaigns that increased user engagement by 45% and managing a team of 5 content creators. This experience showcases your leadership and marketing skills effectively.",
    resumeData: null as ResumeDataType | null, // This will be populated dynamically when a resume is selected
  },
  {
    title: "Update Personal Info",
    prompt:
      "Could you update my name to Sarah Johnson and add my email address sarah.johnson@email.com to the resume?",
    aiResponse:
      "I've updated your personal information on the resume. Your name has been changed to Sarah Johnson and I've added your email address (sarah.johnson@email.com). These updates will make it easier for potential employers to contact you.",
    resumeData: null as ResumeDataType | null, // This will be populated dynamically when a resume is selected
  },
  {
    title: "Add Education",
    prompt:
      "I completed my Master's in Business Analytics from Stanford University in 2021 with a 3.8 GPA. Please add this to my education section.",
    aiResponse:
      "I've added your Master's in Business Analytics from Stanford University to your education section. I included your graduation year (2021) and your impressive 3.8 GPA. This educational achievement will strengthen your resume and highlight your analytical skills.",
    resumeData: null as ResumeDataType | null, // This will be populated dynamically when a resume is selected
  },
  {
    title: "Add Technical Skills",
    prompt:
      "Please add the following technical skills to my resume: Python, SQL, Tableau, Power BI, and Data Visualization.",
    aiResponse:
      "I've added the technical skills you mentioned to your resume: Python, SQL, Tableau, Power BI, and Data Visualization. These skills are highly sought after in data-focused roles and will make your resume more appealing to potential employers looking for candidates with strong analytical and visualization capabilities.",
    resumeData: null as ResumeDataType | null, // This will be populated dynamically when a resume is selected
  },
];

export default function ResumeBuilderDemo() {
  const t = useTranslations("resumeBuilder");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [resumeId, setResumeId] = useState<string>("");
  const [resume, setResume] = useState<ResumeDataType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(
    new Set()
  );
  const user = useUser();
  const [messages, setMessages] = useState<CoreMessage[]>([
    {
      role: "assistant",
      content: t("demo.createInitialResume"),
    },
  ]);
  const { logError } = useAxiomLogging();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchResumeData = useCallback(
    async (resumeId: string) => {
      setIsGenerating(true);
      try {
        const supabase = createSupabaseBrowserClient();

        // Fetch basic resume data
        const { data, error } = await supabase
          .from("resumes")
          .select(
            `*, 
              resume_sections(
                *, 
                resume_list_items(*), 
                resume_detail_items(
                  *,
                  resume_item_descriptions(*))
              )`
          )
          .eq("id", resumeId)
          .single();

        if (error || !data) {
          throw new Error(error?.message || "Resume not found");
        }

        // Sort all nested arrays by display_order
        const sortedData = {
          ...data,
          resume_sections: data.resume_sections
            .sort((a, b) => a.display_order - b.display_order)
            .map((section) => ({
              ...section,
              resume_list_items: section.resume_list_items.sort(
                (a, b) => a.display_order - b.display_order
              ),
              resume_detail_items: section.resume_detail_items
                .sort((a, b) => a.display_order - b.display_order)
                .map((detailItem) => ({
                  ...detailItem,
                  resume_item_descriptions:
                    detailItem.resume_item_descriptions.sort(
                      (a, b) => a.display_order - b.display_order
                    ),
                })),
            })),
        };

        setResume(sortedData);
      } catch (error) {
        logError("Error fetching resume data:", { error });
        setResume(null);
      } finally {
        setIsGenerating(false);
      }
    },
    [resumeId]
  );

  useEffect(() => {
    if (resumeId) {
      fetchResumeData(resumeId);
    }
  }, [resumeId]);

  const handleResumeSelection = async (resumeId: string, title: string) => {
    setIsGenerating(true);
    // Reset selected options when a new resume is selected
    setSelectedOptions(new Set());
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `I'd like to create a ${title} resume`,
      },
      {
        role: "assistant" as const,
        content: t("demo.editResumeInitialMessage"),
      },
    ]);
    setResumeId(resumeId);
  };

  // Update DEMO_EDIT_OPTIONS when resume changes
  useEffect(() => {
    if (resume) {
      // Update the DEMO_EDIT_OPTIONS with the current resume data
      DEMO_EDIT_OPTIONS.forEach((option, index) => {
        // Create modified versions of the resume for each option
        if (index === 0) {
          // Add Work Experience
          const updatedResume = createWorkExperienceResume(resume);
          DEMO_EDIT_OPTIONS[index].resumeData = updatedResume;
        } else if (index === 1) {
          // Update Personal Info
          const updatedResume = createUpdatedPersonalInfoResume(resume);
          DEMO_EDIT_OPTIONS[index].resumeData = updatedResume;
        } else if (index === 2) {
          // Add Education
          const updatedResume = createEducationResume(resume);
          DEMO_EDIT_OPTIONS[index].resumeData = updatedResume;
        } else if (index === 3) {
          // Add Technical Skills
          const updatedResume = createTechnicalSkillsResume(resume);
          DEMO_EDIT_OPTIONS[index].resumeData = updatedResume;
        }
      });
    }
  }, [resume]);

  // Helper functions to create modified resume data for each demo option
  const createWorkExperienceResume = (
    originalResume: ResumeDataType
  ): ResumeDataType => {
    // Create a deep copy of the resume
    const updatedResume = JSON.parse(
      JSON.stringify(originalResume)
    ) as ResumeDataType;

    // Find the work experience section or create one if it doesn't exist
    let workSection = updatedResume.resume_sections.find(
      (section) =>
        section.title.toLowerCase().includes("experience") ||
        section.title.toLowerCase().includes("work")
    );

    if (!workSection) {
      // Create a new work experience section if it doesn't exist
      const newSectionId = crypto.randomUUID();
      workSection = {
        id: newSectionId,
        resume_id: updatedResume.id,
        title: "Work Experience",
        display_order: updatedResume.resume_sections.length,
        created_at: null,
        updated_at: null,
        resume_list_items: [],
        resume_detail_items: [],
      };
      updatedResume.resume_sections.push(workSection);
    }

    // Add the new work experience
    const newDetailItemId = crypto.randomUUID();
    const newWorkExperience = {
      id: newDetailItemId,
      section_id: workSection.id,
      title: "Marketing Manager",
      subtitle: "TechCorp",
      date_range: "2020-2023",
      display_order: workSection.resume_detail_items.length,
      created_at: null,
      updated_at: null,
      resume_item_descriptions: [
        {
          id: crypto.randomUUID(),
          detail_item_id: newDetailItemId,
          description:
            "Led digital campaigns that increased user engagement by 45%",
          display_order: 0,
          created_at: null,
          updated_at: null,
        },
        {
          id: crypto.randomUUID(),
          detail_item_id: newDetailItemId,
          description: "Managed a team of 5 content creators",
          display_order: 1,
          created_at: null,
          updated_at: null,
        },
      ],
    };

    workSection.resume_detail_items.push(newWorkExperience);
    return updatedResume;
  };

  const createUpdatedPersonalInfoResume = (
    originalResume: ResumeDataType
  ): ResumeDataType => {
    // Create a deep copy of the resume
    const updatedResume = JSON.parse(
      JSON.stringify(originalResume)
    ) as ResumeDataType;

    // Update personal information
    updatedResume.name = "Sarah Johnson";
    updatedResume.email = "sarah.johnson@email.com";

    return updatedResume;
  };

  const createEducationResume = (
    originalResume: ResumeDataType
  ): ResumeDataType => {
    // Create a deep copy of the resume
    const updatedResume = JSON.parse(
      JSON.stringify(originalResume)
    ) as ResumeDataType;

    // Find the education section or create one if it doesn't exist
    let educationSection = updatedResume.resume_sections.find((section) =>
      section.title.toLowerCase().includes("education")
    );

    if (!educationSection) {
      // Create a new education section if it doesn't exist
      const newSectionId = crypto.randomUUID();
      educationSection = {
        id: newSectionId,
        resume_id: updatedResume.id,
        title: "Education",
        display_order: updatedResume.resume_sections.length,
        created_at: null,
        updated_at: null,
        resume_list_items: [],
        resume_detail_items: [],
      };
      updatedResume.resume_sections.push(educationSection);
    }

    // Add the new education
    const newDetailItemId = crypto.randomUUID();
    const newEducation = {
      id: newDetailItemId,
      section_id: educationSection.id,
      title: "Master's in Business Analytics",
      subtitle: "Stanford University",
      date_range: "2021",
      display_order: educationSection.resume_detail_items.length,
      created_at: null,
      updated_at: null,
      resume_item_descriptions: [
        {
          id: crypto.randomUUID(),
          detail_item_id: newDetailItemId,
          description: "GPA: 3.8",
          display_order: 0,
          created_at: null,
          updated_at: null,
        },
      ],
    };

    educationSection.resume_detail_items.push(newEducation);
    return updatedResume;
  };

  const createTechnicalSkillsResume = (
    originalResume: ResumeDataType
  ): ResumeDataType => {
    // Create a deep copy of the resume
    const updatedResume = JSON.parse(
      JSON.stringify(originalResume)
    ) as ResumeDataType;

    // Find the skills section or create one if it doesn't exist
    let skillsSection = updatedResume.resume_sections.find((section) =>
      section.title.toLowerCase().includes("skill")
    );

    if (!skillsSection) {
      // Create a new skills section if it doesn't exist
      const newSectionId = crypto.randomUUID();
      skillsSection = {
        id: newSectionId,
        resume_id: updatedResume.id,
        title: "Skills",
        display_order: updatedResume.resume_sections.length,
        created_at: null,
        updated_at: null,
        resume_list_items: [],
        resume_detail_items: [],
      };
      updatedResume.resume_sections.push(skillsSection);
    }

    // Add the new skills as individual items
    const skills = [
      "Python",
      "SQL",
      "Tableau",
      "Power BI",
      "Data Visualization",
    ];

    // Check if the skills already exist to avoid duplicates
    const existingSkills = skillsSection.resume_list_items.map((item) =>
      item.content.toLowerCase()
    );

    skills.forEach((skill, index) => {
      if (!existingSkills.includes(skill.toLowerCase())) {
        skillsSection.resume_list_items.push({
          id: crypto.randomUUID(),
          section_id: skillsSection.id,
          content: skill,
          display_order: skillsSection.resume_list_items.length + index,
          created_at: null,
          updated_at: null,
        });
      }
    });

    return updatedResume;
  };

  const sendEditMessage = async (messageContent: string) => {
    if (!resumeId) {
      logError("No resume found");
      throw new Error("No resume found");
    }

    const updatedMessages: CoreMessage[] = [
      ...messages,
      {
        role: "user",
        content: messageContent,
      },
    ];

    setMessages(updatedMessages);

    // Add a temporary message to indicate AI is thinking
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "",
        isLoading: true,
      },
    ]);

    try {
      // Find the matching demo option
      const selectedOptionIndex = DEMO_EDIT_OPTIONS.findIndex(
        (option) => option.prompt === messageContent
      );
      const selectedOption =
        selectedOptionIndex !== -1
          ? DEMO_EDIT_OPTIONS[selectedOptionIndex]
          : null;

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 4000));

      // Remove the temporary loading message
      setMessages((prev) => prev.slice(0, -1));

      if (selectedOption && selectedOption.resumeData) {
        // Mark this option as selected
        setSelectedOptions((prev) => {
          const updated = new Set(prev);
          updated.add(selectedOptionIndex);
          return updated;
        });

        const aiMessage: CoreAssistantMessage = {
          role: "assistant",
          content: selectedOption.aiResponse,
        };

        setMessages((prev) => [...prev, aiMessage]);
        setResume(selectedOption.resumeData);
      } else {
        // For the demo, we only support the predefined options
        const aiMessage: CoreAssistantMessage = {
          role: "assistant",
          content:
            "I'm sorry, in this demo I can only process the predefined options. Please select one of the provided buttons to see how the resume builder works.",
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      // Remove the temporary loading message
      setMessages((prev) => prev.slice(0, -1));

      const aiMessage: CoreAssistantMessage = {
        role: "assistant",
        content: t("errors.resumeEditError"),
      };

      setMessages((prev) => [...prev, aiMessage]);
      Sentry.captureException(error);
    }
  };

  const sendMessage = async (messageContent: string) => {
    setIsGenerating(true);
    await sendEditMessage(messageContent);
    setIsGenerating(false);
  };

  const shouldShowSplitView = messages.length > 1;
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div
        className={`flex-1 grid ${
          shouldShowSplitView ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        } gap-8 p-8 overflow-hidden max-w-[2000px] mx-auto w-full h-full`}
      >
        <div
          className={`m-1 flex flex-col h-full overflow-hidden ${
            shouldShowSplitView ? "" : "lg:col-span-2 max-w-3xl mx-auto w-full"
          }`}
        >
          {/* Title Section */}
          <div className="flex-none mb-4 space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Resume Builder Demo
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create a professional resume with our AI-powered builder
            </p>
          </div>

          <Card className="flex-1 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg flex flex-col border-0 transition-all duration-300 overflow-hidden min-h-0">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto space-y-6 p-4 rounded-xl custom-scrollbar min-h-0">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 shadow-sm transition-all duration-300 ${
                        message.role === "user"
                          ? "bg-gray-900 text-white dark:bg-gray-700 transform hover:scale-[1.02]"
                          : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transform hover:scale-[1.02]"
                      }`}
                    >
                      {(message as any).isLoading ? (
                        <div className="flex items-center justify-center">
                          <LoadingSpinner variant="muted" />
                        </div>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content as string}
                        </ReactMarkdown>
                      )}
                    </div>
                  </motion.div>
                ))}
                {messages.length === 1 && (
                  <div className="w-full relative">
                    <AnimatePresence>
                      <div className="w-full relative">
                        <div className="relative transition-all duration-300 hover:transform hover:scale-[1.01] p-4">
                          <div className="flex gap-2 items-start justify-start">
                            {demoResumes.map((demoResume) => (
                              <Button
                                key={demoResume.resumeId}
                                onClick={() =>
                                  handleResumeSelection(
                                    demoResume.resumeId,
                                    demoResume.title
                                  )
                                }
                                className="max-w-md flex items-center justify-center gap-2"
                                variant="outline"
                              >
                                {demoResume.title}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AnimatePresence>
                  </div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {shouldShowSplitView && (
              <div className="w-full relative">
                <AnimatePresence>
                  <div className="relative transition-all duration-300 hover:transform hover:scale-[1.01] p-4">
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-2 gap-3">
                        {DEMO_EDIT_OPTIONS.map((option, index) => (
                          <Button
                            key={index}
                            onClick={() => {
                              sendMessage(option.prompt);
                            }}
                            className="w-full h-auto py-2"
                            variant="outline"
                            disabled={
                              isGenerating || selectedOptions.has(index)
                            }
                          >
                            {option.title}
                            {selectedOptions.has(index) && " ✓"}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={user ? "/dashboard/resumes" : "/sign-in"}
                      className="w-full"
                    >
                      <Button size="lg" className="gap-2 w-full">
                        {t("demo.createYourOwnResume") ||
                          "Create Your Own Resume"}
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </Link>
                  </div>
                </AnimatePresence>
              </div>
            )}
          </Card>
        </div>
        {!resume && shouldShowSplitView && isGenerating && (
          <div className="h-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-300" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {t("generation.title")}
              </p>
            </motion.div>
          </div>
        )}
        {shouldShowSplitView && resume && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-full overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <ResumePreview
                loading={isGenerating}
                // @ts-ignore
                resume={resume}
                setResume={setResume}
                resumeId={resumeId}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
