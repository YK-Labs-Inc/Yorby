"use server";

import { SchemaType, GoogleGenerativeAI } from "@google/generative-ai";
import { Logger } from "next-axiom";
import { createSupabaseServerClient } from "@/utils/supabase/server";

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
  const interviewCopilotId = data.get("interviewCopilotId") as string;
  let logger = new Logger().with({
    function: "detectQuestions",
    transcript,
    existingQuestions,
    interviewCopilotId,
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

    // Increment token counts in database
    const { error: updateError } = await incrementTokenCounts(
      interviewCopilotId,
      totalInputTokens,
      totalOutputTokens
    );

    if (updateError) {
      logger.error("Error incrementing token counts", { error: updateError });
      await logger.flush();
    }

    logger = logger.with({
      questions,
    });

    if (questions.length > 0) {
      logger.info("Questions detected");
    } else {
      logger.info("No questions detected");
    }
    await logger.flush();
    return {
      data: questions,
    };
  } catch (error) {
    logger.error("Error detecting questions", { error });
    await logger.flush();
    return {
      data: [],
    };
  }
};

const incrementTokenCounts = async (
  interviewCopilotId: string,
  inputTokens: number,
  outputTokens: number
) => {
  const supabase = await createSupabaseServerClient();

  // First get current values
  const { data: currentData, error: fetchError } = await supabase
    .from("interview_copilots")
    .select("input_tokens_count, output_tokens_count")
    .eq("id", interviewCopilotId)
    .single();

  if (fetchError) {
    return { error: fetchError };
  }

  // Then update with incremented values
  const { error: updateError } = await supabase
    .from("interview_copilots")
    .update({
      input_tokens_count: (currentData.input_tokens_count || 0) + inputTokens,
      output_tokens_count:
        (currentData.output_tokens_count || 0) + outputTokens,
    })
    .eq("id", interviewCopilotId);

  return { error: updateError };
};

const questionDetectionPrompt = (
  transcript: string,
  existingQuestions: string[]
) => `
You are going to be provided a transcript from an interviewer for a job interview and a list of questions that have already been asked by the interviewer.

Identify any interview questions that have been asked by the interviewer in the transcript that have not been asked yet by the interviewer in the list of existing questions that you have been provided.

If necessary, rewrite the questions to be more concise and to the point while still maintaining the original meaning of the question.
Use your expertise to find the true root question that is being asked in the transcript to make it easier for a candidate to tnaswer the questions.

## Output format
   {
     "questions": string[]
   }

## Existing Questions
${existingQuestions.join("\n")}

## Transcript
${transcript}
`;
