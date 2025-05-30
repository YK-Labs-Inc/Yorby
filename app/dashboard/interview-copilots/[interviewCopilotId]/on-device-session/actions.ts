"use server";

import { Logger } from "next-axiom";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { z } from "zod";

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
    const result = await generateObjectWithFallback({
      systemPrompt: questionDetectionPrompt(transcript, existingQuestions),
      schema: z.object({
        questions: z.array(z.string()),
      }),
      messages: [
        {
          role: "user",
          content: "Extract the questions from the transcript",
        },
        {
          role: "assistant",
          content: questionDetectionPrompt(transcript, existingQuestions),
        },
      ],
      loggingContext: {
        function: "detectQuestions",
        transcript,
        existingQuestions,
        interviewCopilotId,
      },
    });

    const { questions } = result;
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

const questionDetectionPrompt = (
  transcript: string,
  existingQuestions: string[]
) => `
You are going to be provided a transcript from an interviewer for a job interview and a list of questions that have already been asked by the interviewer.

Identify any interview questions that have been asked by the interviewer in the transcript that have not been asked yet by the interviewer in the list of existing questions that you have been provided.

If necessary, rewrite the questions to be more concise and to the point while still maintaining the original meaning of the question. For example, if it is
a multi part question, feel free to combine it into one question which is more concise and to the point.
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
