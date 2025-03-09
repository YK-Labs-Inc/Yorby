import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { NextResponse } from "next/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { z } from "zod";

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

export const POST = withAxiom(async (req: AxiomRequest) => {
  const { resume, userMessage } = (await req.json()) as {
    resume: string;
    userMessage: string;
  };
  const logger = req.log.with({
    resume,
    userMessage,
    path: "api/resume/edit",
  });
  try {
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

const extractJSONFromString = (text: string): string => {
  try {
    // First try to parse the entire string as JSON
    JSON.parse(text);
    return text;
  } catch {
    // If that fails, try to find JSON-like content
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      const possibleJson = jsonMatch[0];
      try {
        // Validate that it's actually JSON
        JSON.parse(possibleJson);
        return possibleJson;
      } catch {
        throw new Error("No valid JSON found in the response");
      }
    }
    throw new Error("No JSON-like content found in the response");
  }
};
