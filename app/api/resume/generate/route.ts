import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { AxiomRequest, Logger, withAxiom } from "next-axiom";
import { CoreMessage } from "ai";
import { z } from "zod";
import { trackServerEvent } from "@/utils/tracking/serverUtils";
import { getAllFiles } from "../utils";
import { getAllUserMemories } from "../../memories/utils";

export const POST = withAxiom(async (req: AxiomRequest) => {
  const logger = req.log.with({
    route: "/api/resume/generate",
  });
  try {
    const { messages, additionalFileIds = [] } = (await req.json()) as {
      messages: CoreMessage[];
      additionalFileIds: string[];
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Valid messages array is required" },
        { status: 400 }
      );
    }
    // Get user ID from Supabase
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      logger.error("User not found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }
    const userId = user.id;

    // Get user memories and files
    const { files: userFiles, knowledge_base } =
      await getAllUserMemories(userId);
    const additionalFiles = await getAllFiles(additionalFileIds);
    const combinedFiles = [...userFiles, ...additionalFiles];

    let finalMessages = messages;
    if (knowledge_base) {
      finalMessages = [
        ...messages,
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Here is additional information about the user's work history and experience — use it to help you write the resume: 
            
            ${knowledge_base}`,
            },
          ],
        },
      ];
    }

    logger.info("Generating resume from conversation history", {
      numAdditionalFiles: additionalFiles.length,
      numUserFiles: userFiles.length,
    });

    const resumeCoreMessage = await generateResumeCoreMessage(
      finalMessages,
      logger,
      combinedFiles
    );

    const resumeId = await saveResumeCoreMessage(resumeCoreMessage, logger);

    await trackServerEvent({
      userId,
      eventName: "resume_generated",
      args: { resumeId },
    });

    return NextResponse.json({ resumeId });
  } catch (extractionError) {
    logger.error("Resume extraction failed", { error: extractionError });
    return NextResponse.json(
      {
        error: "Failed to extract resume data",
        details:
          extractionError instanceof Error
            ? extractionError.message
            : String(extractionError),
      },
      { status: 500 }
    );
  }
});

const saveResumeCoreMessage = async (
  resumeCoreMessage: {
    personalInfo: {
      name: string;
      email: string | null;
      phone: string | null;
      location: string | null;
    };
    educationHistory: {
      name: string;
      degree: string | null;
      startDate: string | null;
      endDate: string | null;
      gpa: string | null;
      additionalInfo: string[] | null;
    }[];
    workExperience: {
      companyName: string;
      jobTitle: string | null;
      startDate: string | null;
      endDate: string | null;
      description: string[];
    }[];
    skills: {
      category: string;
      skills: string[];
    }[];
  },
  logger: Logger
) => {
  const resumeId = await saveResumePersonalInfo(resumeCoreMessage.personalInfo);
  await saveResumeEducation(
    resumeId,
    resumeCoreMessage.educationHistory,
    logger
  );
  await saveResumeWorkExperience(
    resumeId,
    resumeCoreMessage.workExperience,
    logger
  );
  await saveResumeSkills(resumeId, resumeCoreMessage.skills, logger);
  return resumeId;
};

const saveResumePersonalInfo = async (personalInfo: {
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
}) => {
  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUser();
  const { data, error } = await supabase
    .from("resumes")
    .insert({
      title: `${new Date().toLocaleDateString()} Resume`,
      name: personalInfo.name,
      email: personalInfo.email,
      phone: personalInfo.phone,
      location: personalInfo.location,
      user_id: userId,
      locked_status: "locked",
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data.id;
};

const saveResumeEducation = async (
  resumeId: string,
  educationHistory: {
    name: string;
    degree: string | null;
    startDate: string | null;
    endDate: string | null;
    gpa: string | null;
    additionalInfo: string[] | null;
  }[],
  logger: Logger
) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }
  if (!user) {
    throw new Error("User not found");
  }
  if (educationHistory.length === 0) {
    return;
  }
  const { data, error } = await supabase
    .from("resume_sections")
    .insert({
      title: "Education",
      resume_id: resumeId,
      display_order: 0,
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  const educationSectionId = data.id;
  await Promise.all(
    educationHistory.map(async (education) => {
      let subtitle = "";
      if (education.gpa && education.degree) {
        subtitle = `${education.degree} - ${education.gpa}`;
      } else if (education.degree) {
        subtitle = education.degree;
      } else if (education.gpa) {
        subtitle = education.gpa;
      }
      const { data, error } = await supabase
        .from("resume_detail_items")
        .insert({
          title: education.name,
          subtitle,
          date_range: `${education.startDate} - ${education.endDate}`,
          section_id: educationSectionId,
          display_order: 0,
        })
        .select("id")
        .single();
      if (error) {
        logger.error("Failed to insert resume detail item", {
          error,
        });
        return;
      }
      const { id: resumeDetailItemId } = data;
      if (education.additionalInfo) {
        await Promise.all(
          education.additionalInfo.map(async (info, index) => {
            const { error } = await supabase
              .from("resume_item_descriptions")
              .insert({
                detail_item_id: resumeDetailItemId,
                description: info,
                display_order: index,
              });
            if (error) {
              logger.error("Failed to insert resume item description", {
                error,
              });
            }
          })
        );
      }
    })
  );
};

const saveResumeWorkExperience = async (
  resumeId: string,
  workExperience: {
    companyName: string;
    jobTitle: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string[];
  }[],
  logger: Logger
) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }
  if (!user) {
    throw new Error("User not found");
  }
  if (workExperience.length === 0) {
    return;
  }
  const { data, error } = await supabase
    .from("resume_sections")
    .insert({
      title: "Work Experience",
      resume_id: resumeId,
      display_order: 0,
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  const workExperienceSectionId = data.id;
  await Promise.all(
    workExperience.map(async (experience) => {
      const { data, error } = await supabase
        .from("resume_detail_items")
        .insert({
          title: experience.companyName,
          subtitle: experience.jobTitle,
          date_range: `${experience.startDate} - ${experience.endDate}`,
          section_id: workExperienceSectionId,
          display_order: 0,
        })
        .select("id")
        .single();
      if (error) {
        logger.error("Failed to insert resume detail item", {
          error,
        });
        return;
      }
      const { id: resumeDetailItemId } = data;
      if (experience.description) {
        await Promise.all(
          experience.description.map(async (description, index) => {
            const { error } = await supabase
              .from("resume_item_descriptions")
              .insert({
                detail_item_id: resumeDetailItemId,
                description,
                display_order: index,
              });
            if (error) {
              logger.error("Failed to insert resume item description", {
                error,
              });
            }
          })
        );
      }
    })
  );
};

const saveResumeSkills = async (
  resumeId: string,
  skills: {
    category: string;
    skills: string[];
  }[],
  logger: Logger
) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }
  if (!user) {
    throw new Error("User not found");
  }
  if (skills.length === 0) {
    return;
  }
  const { data, error } = await supabase
    .from("resume_sections")
    .insert({
      title: "Skills",
      resume_id: resumeId,
      display_order: 0,
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  const skillsSectionId = data.id;
  await Promise.all(
    skills.map(async (skill) => {
      const { error } = await supabase.from("resume_list_items").insert({
        content: `${skill.category ? `${skill.category}: ` : ""}${skill.skills.join(", ")}`,
        section_id: skillsSectionId,
        display_order: 0,
      });

      if (error) {
        logger.error("Failed to insert resume detail item", {
          error,
        });
      }
    })
  );
};

const generateResumeCoreMessage = async (
  messages: CoreMessage[],
  logger: Logger,
  combinedFiles: Awaited<ReturnType<typeof getAllFiles>>
) => {
  const personalInfo = await extractPersonalInfo(
    messages,
    logger,
    combinedFiles
  );
  const educationHistory = await extractEducationHistory(
    messages,
    logger,
    combinedFiles
  );
  const workExperience = await extractWorkExperience(
    messages,
    logger,
    combinedFiles
  );
  const skills = await extractSkills(messages, logger, combinedFiles);
  return {
    personalInfo,
    educationHistory,
    workExperience,
    skills,
  };
};

const extractPersonalInfo = async (
  messages: CoreMessage[],
  logger: Logger,
  combinedFiles: Awaited<ReturnType<typeof getAllFiles>>
) => {
  const functionLogger = logger.with({
    path: "api/resume/generate",
    dataToExtract: "personal information",
  });
  try {
    const prompt = `
    Extract the following information from the conversation:
    - Name
    - Email
    - Phone
    - Location


    If you are unable to extract the name return a placeholder for that field in the final JSON response.

    If you are unable to extract the email return a null value for the field in the final JSON response.

    If you are unable to extract the phone return a null value for the field in the final JSON response.

    If you are unable to extract the location return a null value for the field in the final JSON response.

    Your JSON response cannot have any new line characters added to it. It will not be read by a human so the new line
    characters are not needed. Just return the raw JSON object string.
    `;

    const result = await generateObjectWithFallback({
      systemPrompt: prompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the information from the conversation, using the following file(s) as additional context if provided:",
            },
            ...combinedFiles.map((file) => ({
              type: "file" as "file",
              data: file.fileData.fileUri,
              mimeType: file.fileData.mimeType,
            })),
          ],
        },
        ...messages,
      ],
      schema: z.object({
        name: z.string(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
        location: z.string().nullable(),
      }),
      loggingContext: {
        path: "api/resume/generate",
        dataToExtract: "personal information",
      },
    });

    functionLogger.info("Personal information extracted", {
      result,
    });

    return result;
  } catch (error) {
    logger.error("Failed to extract personal information", {
      error,
    });
    return {
      name: "John Doe",
      email: null,
      phone: null,
      location: null,
    };
  }
};

const extractEducationHistory = async (
  messages: CoreMessage[],
  logger: Logger,
  combinedFiles: Awaited<ReturnType<typeof getAllFiles>>
) => {
  const functionLogger = logger.with({
    path: "api/resume/generate",
    dataToExtract: "education",
  });
  try {
    const prompt = `
    You are analyzing the conversation history of a user and an interviewer who is helping the user create a resume.
    Your job is to extract the education history of the user from the conversation history.

    The education history should include the following information:
    - School name
    - Degree
    - Start date
    - End date
    - GPA
    - Additional information about the education (e.g. awards, accolades, etc) 

    There could be multiple education entries so you must extract the above information for each education entry.

    If you are unable to extract the school name return a placeholder for that field in the final JSON response.

    If you are unable to extract the degree return a null value for the field in the final JSON response.

    If you are unable to extract the start date return a null value for the field in the final JSON response.

    If you are unable to extract the end date return a null value for the field in the final JSON response.

    If you are unable to extract the GPA return a null value for the field in the final JSON response.

    If you are unable to extract the additional information return an empty array for the field in the final JSON response.

    Your JSON response cannot have any new line characters added to it. It will not be read by a human so the new line
    characters are not needed. Just return the raw JSON object string.
  `;

    const result = await generateObjectWithFallback({
      systemPrompt: prompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the information from the conversation, using the following file(s) as additional context if provided:",
            },
            ...combinedFiles.map((file) => ({
              type: "file" as "file",
              data: file.fileData.fileUri,
              mimeType: file.fileData.mimeType,
            })),
          ],
        },
        ...messages,
      ],
      schema: z.array(
        z.object({
          name: z.string(),
          degree: z.string().nullable(),
          startDate: z.string().nullable(),
          endDate: z.string().nullable(),
          gpa: z.string().nullable(),
          additionalInfo: z.array(z.string()).nullable(),
        })
      ),
      loggingContext: {
        path: "api/resume/generate",
        dataToExtract: "personal information",
      },
    });

    functionLogger.info("Education history extracted", {
      result,
    });

    return result;
  } catch (error) {
    logger.error("Failed to extract personal information", {
      error,
    });
    return [
      {
        name: "Perfect Interview College",
        degree: null,
        startDate: null,
        endDate: null,
        gpa: null,
        additionalInfo: null,
      },
    ];
  }
};

const extractWorkExperience = async (
  messages: CoreMessage[],
  logger: Logger,
  combinedFiles: Awaited<ReturnType<typeof getAllFiles>>
) => {
  const functionLogger = logger.with({
    path: "api/resume/generate",
    dataToExtract: "work experience",
  });
  try {
    const prompt = `
    You are analyzing the conversation history of a user and an interviewer who is helping the user create a resume.
    Your job is to extract the work experience of the user from the conversation history.

    The work experience should include the following information:
    - Company name
    - Job title
    - Start date
    - End date
    - Description of the job (e.g. responsibilities, accomplishments, etc) 

    There could be multiple work experience entries so you must extract the above information for each work experience entry.

    If you are unable to extract the company name return a placeholder for that field in the final JSON response.

    If you are unable to extract the job title return a null value for the field in the final JSON response.

    If you are unable to extract the start date return a null value for the field in the final JSON response.

    If you are unable to extract the end date return a null value for the field in the final JSON response.

    If you are unable to extract the description of the job return an empty array for the field in the final JSON response.

    When generating the descriptions of the job, use your knowledge as an expert resume writer to extract the most important information from the conversation
    and to create 3-5 blocks of information that will be used to demonstrate what the candidate has done at the job. Format your response to maximize the chances that it will be
    noticed by a hiring manager and that it will pass any resume screening software.

    Your JSON response cannot have any new line characters added to it. It will not be read by a human so the new line
    characters are not needed. Just return the raw JSON object string.
  `;

    const result = await generateObjectWithFallback({
      systemPrompt: prompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the information from the conversation, using the following file(s) as additional context if provided:",
            },
            ...combinedFiles.map((file) => ({
              type: "file" as "file",
              data: file.fileData.fileUri,
              mimeType: file.fileData.mimeType,
            })),
          ],
        },
        ...messages,
      ],
      schema: z.array(
        z.object({
          companyName: z.string(),
          jobTitle: z.string().nullable(),
          startDate: z.string().nullable(),
          endDate: z.string().nullable(),
          description: z.array(z.string()),
        })
      ),
      loggingContext: {
        path: "api/resume/generate",
        dataToExtract: "work experience",
      },
    });

    functionLogger.info("Work experience extracted", {
      result,
    });

    return result;
  } catch (error) {
    logger.error("Failed to extract personal information", {
      error,
    });
    return [
      {
        companyName: "Perfect Interview",
        jobTitle: null,
        startDate: null,
        endDate: null,
        description: [],
      },
    ];
  }
};

const extractSkills = async (
  messages: CoreMessage[],
  logger: Logger,
  combinedFiles: Awaited<ReturnType<typeof getAllFiles>>
) => {
  const functionLogger = logger.with({
    path: "api/resume/generate",
    dataToExtract: "skills",
  });

  try {
    const prompt = `
    You are analyzing the conversation history of a user and an interviewer who is helping the user create a resume.
    Your job is to extract the work skills of the user from the conversation history.

    Your response type will be an array of objects. Each object will have a category and an array of skills.

    For the skills, try to group them into categories that the user mentions. Some examples of categories are
    proficiency level, programming languages, frameworks, toosl, etc.

    If skills cannot be grouped into categories, return a single object with a category set to an empty string and an array of all
    of the skills.

    If you are unable to extract any skills return an empty array in the final JSON response.

    Your JSON response cannot have any new line characters added to it. It will not be read by a human so the new line
    characters are not needed. Just return the raw JSON object string.
  `;

    const result = await generateObjectWithFallback({
      systemPrompt: prompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the information from the conversation, using the following file(s) as additional context if provided:",
            },
            ...combinedFiles.map((file) => ({
              type: "file" as "file",
              data: file.fileData.fileUri,
              mimeType: file.fileData.mimeType,
            })),
          ],
        },
        ...messages,
      ],
      schema: z.array(
        z.object({
          category: z.string(),
          skills: z.array(z.string()),
        })
      ),
      loggingContext: {
        path: "api/resume/generate",
        dataToExtract: "skills",
      },
    });

    functionLogger.info("Skills extracted", {
      result,
    });

    return result;
  } catch (error) {
    logger.error("Failed to extract personal information", {
      error,
    });
    return [
      {
        category: "",
        skills: [],
      },
    ];
  }
};

const getCurrentUser = async () => {
  const supabase = await createSupabaseServerClient();
  const loggedInUserId = (await supabase.auth.getUser()).data.user?.id;
  if (!loggedInUserId) {
    throw new Error("User not found");
  } else {
    return loggedInUserId;
  }
};
