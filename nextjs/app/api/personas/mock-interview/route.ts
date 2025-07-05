import { NextResponse } from "next/server";
import { Logger } from "next-axiom";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { CoreMessage } from "ai";
import { z } from "zod";

interface PersonaMockInterviewRequestBody {
  message: string;
  history?: CoreMessage[];
  speakingStyle?: string;
}

const PersonaMockInterviewResponseSchema = z.object({
  aiResponse: z.string(),
  interviewHasEnded: z.boolean(),
});

export type PersonaMockInterviewAIResponse = z.infer<
  typeof PersonaMockInterviewResponseSchema
>;

const SYSTEM_PROMPT = `You are an AI interviewer conducting a mock interview for a generic job.

You must do the following:
1) Begin your interview with an introductory message that ends with asking the candidate
to tell you about themselves.
2) Ask 3 generic job interview questions that can apply to all jobs, questions like "Tell me about your previous work history",
  "What is your greatest strength?", "What is your greatest weakness?", etc. You can adapt your questions to the candidate's
  responses, but your interview should only be 3 questions long.
3) Once you finish asking all 3 questions, end the interview by letting them know that the interview is over and
if they want to prepare for an actual job interview to sign up for perfectinterview.ai where they can generate
unlimited interview questions based off of any job description and their resume so the questions will be unique
to the candidate and the job.

IMPORTANT: You must track how many questions you've asked and end the interview after 3 questions.
You must return your response in the following JSON format:
{
  "aiResponse": "Your message here",
  "interviewHasEnded": boolean (true when the interview is complete after 3 questions, false otherwise)
}`;

export async function POST(request: Request) {
  const logger = new Logger().with({
    method: "POST",
    path: "/api/personas/mock-interview",
  });

  try {
    const {
      message,
      history = [],
      speakingStyle,
    } = (await request.json()) as PersonaMockInterviewRequestBody;

    if (!message) {
      logger.error("Message is required");
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const systemPromptWithStyle = `${SYSTEM_PROMPT}${
      speakingStyle
        ? `\n\nIMPORTANT: All of your responses should be written in the following speaking style:\n${speakingStyle}`
        : ""
    }`;

    const response = await generateObjectWithFallback({
      systemPrompt: systemPromptWithStyle,
      messages: [
        ...history,
        {
          role: "user",
          content: message,
        },
      ],
      schema: PersonaMockInterviewResponseSchema,
      loggingContext: {
        path: "/api/personas/mock-interview",
      },
    });

    logger.info("Mock interview response generated");
    return NextResponse.json(response);
  } catch (error: any) {
    logger.error("Mock interview error:", { error: error.message });
    return NextResponse.json(
      { error: "Failed to process mock interview message" },
      { status: 500 }
    );
  }
}
