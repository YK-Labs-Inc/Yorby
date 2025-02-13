"use server";

import { uploadFileToGemini } from "@/app/[locale]/landing2/actions";
import { Tables } from "@/utils/supabase/database.types";
import {
  createSupabaseServerClient,
  downloadFile,
} from "@/utils/supabase/server";
import { UploadResponse } from "@/utils/types";
import { SchemaType, GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { Logger } from "next-axiom";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

const questionDetectionModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        questions: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
      },
      required: ["questions"],
    },
  },
});

export const detectQuestions = async (data: FormData) => {
  const existingQuestions = data.getAll("existingQuestions") as string[];
  const transcript = data.get("transcript") as string;
  let logger = new Logger().with({
    function: "detectQuestions",
    transcript,
    existingQuestions,
  });
  try {
    const result = await questionDetectionModel.generateContent([
      questionDetectionPrompt(transcript, existingQuestions),
    ]);
    const response = result.response.text();
    const { questions } = JSON.parse(response) as {
      questions: string[];
    };

    const totalInputTokens =
      result.response.usageMetadata?.promptTokenCount ?? 0;
    const totalOutputTokens =
      result.response.usageMetadata?.candidatesTokenCount ?? 0;

    logger = logger.with({
      inputTokenCount: totalInputTokens,
      outputTokenCount: totalOutputTokens,
      questions,
    });

    logger.info("Questions detected");
    await logger.flush();
    return {
      data: questions,
      inputTokenCount: totalInputTokens,
      outputTokenCount: totalOutputTokens,
    };
  } catch (error) {
    logger.error("Error detecting questions", { error });
    await logger.flush();
    return {
      data: [],
      inputTokenCount: 0,
      outputTokenCount: 0,
    };
  }
};

const questionDetectionPrompt = (
  transcript: string,
  existingQuestions: string[]
) => `
You are going to be provided a transcript from an interviewer for a job interview and a list of questions that have already been asked by the interviewer.

With this information, do the following:

## Steps
1. **Detect questions in the transcript**:
   - Read through the transcript and detect interview questions that have been asked by the interviewer.
2. **Deduplicate the questions**:
   - From the list of questions that you have detected from the previous step, deduplicate the questions.
   - Remove questions that have already been asked in the list of existing questions.
3. **Return the questions as a list of strings**:
   - Return the questions as a list of strings in a JSON object with the following format:

## Output format
   {
     "questions": string[]
   }

## Existing Questions
${existingQuestions.join("\n")}

## Transcript
${transcript}
`;
