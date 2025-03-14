import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { NextResponse } from "next/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { z } from "zod";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { ipAddress } from "@vercel/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";

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
  resume_item_descriptions: z.array(resumeItemDescriptionsSchema),
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
  resume_list_items: z.array(resumeListItemsSchema),
  resume_detail_items: z.array(resumeDetailItemsSchema),
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
  resume_sections: z.array(resumeSectionsSchema),
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

export const POST = withAxiom(async (req: AxiomRequest) => {
  const { resume, userMessage, isDemo } = (await req.json()) as {
    resume: string;
    userMessage: string;
    isDemo: boolean;
  };
  const logger = req.log.with({
    resume,
    userMessage,
    path: "api/resume/edit",
  });
  try {
    // const isRateLimited = isDemo
    //   ? await checkIsRateLimitedDemo(req)
    //   : await checkIsRateLimited(req);
    // if (isRateLimited) {
    //   logger.info("Rate limit exceeded", {
    //     isDemo,
    //   });
    //   return NextResponse.json(
    //     { error: "Rate limit exceeded" },
    //     { status: 429 }
    //   );
    // }

    const { updatedResume, aiResponse } = await updateResume(
      JSON.stringify(resume),
      userMessage
    );
    logger.info("Resume updated", {
      updatedResume: JSON.stringify(updatedResume),
      aiResponse,
    });
    return NextResponse.json({ updatedResume, aiResponse }, { status: 200 });
  } catch (error) {
    logger.error("Failed to update resume", { error });
    return NextResponse.json(
      { error: "Failed to update resume" },
      { status: 500 }
    );
  }
});

const updateResume = async (resume: string, userMessage: string) => {
  const systemPrompt = `
    You are an AI assistant that can help users edit their resume.
    
    You will be given a resume in JSON format and a comment from the user about what they want to change.
    
    Your job is to update the resume in the JSON format to reflect the changes and then provide a response to the user
    about the changes you made.

    Your response must be in the following format:
    {
      "updatedResumeJSON": string //updated resume in JSON format,
      "aiResponse": string //response to the user about the changes you made
    }

    The updatedResumeJSON must be a valid JSON object. Return only the updated resume in the same exact JSON format
    as the original resume and nothing else.

    The updatedResumseJSON response will be parsed as JSON so make sure your response is a valid JSON without any modifications necessary.
    
    Here is the resume:
    ${resume}
    `;

  const result = await generateObjectWithFallback({
    prompt: userMessage,
    systemPrompt,
    schema: z.object({
      updatedResumeJSON: resumeSchema,
      aiResponse: z.string(),
    }),
    loggingContext: {
      path: "api/resume/edit",
    },
  });
  const { updatedResumeJSON, aiResponse } = result;
  return { updatedResume: updatedResumeJSON, aiResponse };
};

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
