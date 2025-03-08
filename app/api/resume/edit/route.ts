import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { NextResponse } from "next/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { z } from "zod";

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
      updatedResumeJSON: z.string(),
      aiResponse: z.string(),
    }),
    loggingContext: {
      path: "api/resume/edit",
    },
  });
  const { updatedResumeJSON, aiResponse } = result;
  return { updatedResume: JSON.parse(updatedResumeJSON), aiResponse };
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
