import { streamObjectWithFallback } from "@/utils/ai/gemini";
import { NextResponse } from "next/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { z } from "zod";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { ipAddress } from "@vercel/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { trackServerEvent } from "@/utils/tracking/serverUtils";
import { CoreMessage } from "ai";
import { ResumeDataType } from "@/app/dashboard/resumes/components/ResumeBuilder";
import { getAllUserMemories } from "../../memories/utils";

const resumeItemDescriptionsSchema = z.object({
  created_at: z.string().nullable(),
  description: z.string(),
  detail_item_id: z.string(),
  display_order: z.number(),
  id: z.string(),
  updated_at: z.string().nullable(),
});

const resumeDetailItemsSchema = z.object({
  created_at: z.string().nullable(),
  date_range: z.string().nullable(),
  display_order: z.number(),
  id: z.string(),
  section_id: z.string(),
  subtitle: z.string().nullable(),
  title: z.string(),
  updated_at: z.string().nullable(),
  resume_item_descriptions: z.array(resumeItemDescriptionsSchema).default([]),
});

const resumeListItemsSchema = z.object({
  content: z.string(),
  created_at: z.string().nullable(),
  display_order: z.number(),
  id: z.string(),
  section_id: z.string(),
  updated_at: z.string().nullable(),
});

const resumeSectionsSchema = z.object({
  created_at: z.string().nullable(),
  display_order: z.number(),
  id: z.string(),
  resume_id: z.string(),
  title: z.string(),
  updated_at: z.string().nullable(),
  resume_list_items: z.array(resumeListItemsSchema).default([]),
  resume_detail_items: z.array(resumeDetailItemsSchema).default([]),
});

const resumeSchema = z.object({
  created_at: z.string().nullable(),
  email: z.string().nullable(),
  id: z.string(),
  location: z.string().nullable(),
  locked_status: z.enum(["locked", "unlocked"]),
  name: z.string(),
  phone: z.string().nullable(),
  summary: z.string().nullable(),
  title: z.string(),
  updated_at: z.string().nullable(),
  user_id: z.string(),
  resume_sections: z.array(resumeSectionsSchema).default([]),
});

const redis = Redis.fromEnv();

const rateLimits = {
  regular: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(300, "1 h"),
    analytics: true,
    prefix: "regular-resume-edit",
  }),
  demo: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 h"),
    analytics: true,
    prefix: "demo-resume-edit",
  }),
};

const updateResume = async (
  resume: ResumeDataType,
  messages: CoreMessage[],
  speakingStyle?: string,
  files?: {
    fileData: {
      fileUri: string;
      mimeType: string;
    };
  }[],
) => {
  const systemPrompt = `
    You are an AI assistant that can help users edit their resume.
    
    You will be given a resume in JSON format and a comment from the user about what they want to change.

    Resumes have the following schema written in zod:

    ## Resume Schema
    const resumeItemDescriptionsSchema = z.object({
      created_at: z.string().nullable(),
      description: z.string(),
      detail_item_id: z.string(),
      display_order: z.number(),
      id: z.string(),
      updated_at: z.string().nullable(),
    });

    const resumeDetailItemsSchema = z.object({
      created_at: z.string().nullable(),
      date_range: z.string().nullable(),
      display_order: z.number(),
      id: z.string(),
      section_id: z.string(),
      subtitle: z.string().nullable(),
      title: z.string(),
      updated_at: z.string().nullable(),
      resume_item_descriptions: z.array(resumeItemDescriptionsSchema).default([]),
    });

    const resumeListItemsSchema = z.object({
      content: z.string(),
      created_at: z.string().nullable(),
      display_order: z.number(),
      id: z.string(),
      section_id: z.string(),
      updated_at: z.string().nullable(),
    });

    const resumeSectionsSchema = z.object({
      created_at: z.string().nullable(),
      display_order: z.number(),
      id: z.string(),
      resume_id: z.string(),
      title: z.string(),
      updated_at: z.string().nullable(),
      resume_list_items: z.array(resumeListItemsSchema).default([]),
      resume_detail_items: z.array(resumeDetailItemsSchema).default([]),
    });

    const resumeSchema = z.object({
      created_at: z.string().nullable(),
      email: z.string().nullable(),
      id: z.string(),
      location: z.string().nullable(),
      locked_status: z.enum(["locked", "unlocked"]),
      name: z.string(),
      phone: z.string().nullable(),
      summary: z.string().nullable(),
      title: z.string(),
      updated_at: z.string().nullable(),
      user_id: z.string(),
      resume_sections: z.array(resumeSectionsSchema).default([]),
    });

    ## Resume Schema Explanation
    Resumes are made up of sections, and each section is made up of either resume_detail_items or resume_list_items.

    A resume_list_items section is just a list of items that are displayed in a list where each item is represented by
    a resuemListItem. Common resume_list_items sections are "skills", "accomplishments", "certifications", or any other section
    that has a list of items that are not detailed and are just a list of items.

    A resume_detail_item section is a section that displays a title, subtitle, date range, and a list of resumeItemDescriptions.
    An example of this section is a "work experience" section where the title is the company they worked for, subtitle is the job title,
    date range is the start and end date of the job, and the array of resumeItemDescriptions are the responsibilities and accomplishments of the job.
    Common resume_detail_item sections are "work experience", "education", "projects" or any other section that has lots of details
    and additionl information.

    ## Prompt Instructions
    
    Your job is to acknowledge the users request, perform the necessary changes to the resume, and then provide a response to the user
    about the changes you made. Your responses to the users should be written in a friendly and engaging manner to keep the user
    engaged and excited about the changes you are making to their resume. Your conclusion message should always ask the user
    if they would like any more changes made to the resume.

    When editing the resume, make sure to keep the same format and structure of the resume. Do not change the layout of the resume.
    You should almost always try to only make edits within existing sections of the resume. If you need to add or delete a new section,
    make sure to ask the user if they would like to add a new section before doing so.

    Your response must be in the following format:
    {
      "introMessage": string //intro message to the user acknowledging the changes you are going to make
      "updatedResumeJSON": string //updated resume in JSON format that needs to match the resume schema
      "conclusionMessage": string //response to the user about the changes you made and asking them if they would like to make any more changes
    }
${
    speakingStyle
      ? `

    IMPORTANT: Your introMessage and conclusionMessage to the user should be written in the following speaking style
    but the updatedResumeJSON should be written in a professional manner to maximize
    the chances of the user getting the job they want and passing the ATS.

    ${speakingStyle}`
      : ""
  }

    When returning the updatedResumeJSON, make sure to return the entire resume in the same exact JSON format as the original resume
    and only change the sections that the user has requested to change. The updatedResumeJSON should be a representation of the
    entire resume after the changes have been made. It IS NOT acceptable to return only the portion of the resume that was updated
    or changed.

    Only make the changes if you have >95% confidence that the changes you are making are correct. If you are not
    confident about the changes you are making, ask the user to clarify their request and keep doing so until
    you reach your 95% confidence threshold.
    
    Here is the resume:
    ${JSON.stringify(resume)}
    `;

  const result = await streamObjectWithFallback({
    messages: files && files.length > 0
      ? [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Use the following files as additional context to form your responses",
            },
            ...files.map((file) => ({
              type: "file" as "file",
              data: file.fileData.fileUri,
              mimeType: file.fileData.mimeType,
            })),
          ],
        },
        ...messages,
      ]
      : messages,
    systemPrompt,
    schema: z.object({
      introMessage: z.string(),
      updatedResumeJSON: resumeSchema,
      conclusionMessage: z.string(),
    }),
    loggingContext: {
      path: "api/resume/edit",
    },
    modelConfig: {
      primaryModel: "gemini-2.5-flash-preview-04-17",
      fallbackModel: "gemini-2.0-flash",
    },
  });
  return result;
};

export const POST = withAxiom(async (req: AxiomRequest) => {
  const { resume, messages, isDemo, speakingStyle } = (await req.json()) as {
    resume: ResumeDataType;
    messages: CoreMessage[];
    isDemo: boolean;
    speakingStyle?: string;
  };
  const logger = req.log.with({
    resume,
    messages,
    path: "api/resume/edit",
    speakingStyle,
    isDemo,
  });
  try {
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

    // Get user memories and knowledge base
    const { files, knowledge_base } = await getAllUserMemories(userId);

    let finalMessages = messages;
    if (knowledge_base) {
      finalMessages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                `Here is additional information about the user's work history and experience — use it to help you edit the resume: 
            
            ${knowledge_base}`,
            },
          ],
        },
        ...messages,
      ];
    }

    const result = await updateResume(
      resume,
      finalMessages,
      speakingStyle,
      files,
    );

    logger.info("Resume updated", {});

    await trackServerEvent({
      userId,
      eventName: "resume_edited",
      args: {
        speakingStyle,
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result) {
            // Stringify and encode the chunk into a Uint8Array
            const encoded = new TextEncoder().encode(JSON.stringify(chunk));
            controller.enqueue(encoded);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=utf-8");
    logger.info("Returning updated resume");
    return new Response(stream, { headers });
  } catch (error) {
    logger.error("Failed to update resume", { error });
    return NextResponse.json(
      { error: "Failed to update resume" },
      { status: 500 },
    );
  }
});

const checkIsRateLimited = async (req: AxiomRequest) => {
  const ip = ipAddress(req);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const identifier = user?.id || ip;
  if (!identifier) {
    return true;
  }
  const { success } = await rateLimits.regular.limit(identifier);
  return !success;
};

const checkIsRateLimitedDemo = async (req: AxiomRequest) => {
  const ip = ipAddress(req);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const identifier = user?.id || ip;
  if (!identifier) {
    return true;
  }
  const { success } = await rateLimits.demo.limit(identifier);
  return !success;
};
