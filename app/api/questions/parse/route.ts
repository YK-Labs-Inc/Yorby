import { NextResponse } from "next/server";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { z } from "zod";
import { AxiomRequest, withAxiom } from "next-axiom";
import { CoreMessage } from "ai";

const QuestionSchema = z.object({
  question: z.string(),
  order: z.number().optional(),
});

export type Question = z.infer<typeof QuestionSchema>;

const QuestionsResponseSchema = z.object({
  questions: z.array(QuestionSchema),
  message: z.string(),
  isReady: z.boolean(),
});

export type QuestionsResponse = z.infer<typeof QuestionsResponseSchema>;

export const POST = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    path: "/api/questions/parse",
  });
  try {
    const { messages } = (await request.json()) as { messages: CoreMessage[] };

    const result = await generateObjectWithFallback({
      messages,
      systemPrompt: `You are an AI assistant helping a user upload interview questions. Your job is to:

1. Parse and clean up the user's input, extracting interview questions and improving their wording/grammar.
2. If this is the user's first message or you have not yet confirmed the questions, show the cleaned-up questions and ask the user to confirm if they look good or if they want to make any edits. Do not set isReady to true yet.
3. If the user confirms the questions are correct (e.g., they say 'yes', 'looks good', 'ready', etc.), set isReady to true and return a friendly message indicating the questions are ready to be saved.
4. If the user wants to make changes, repeat the process until they confirm.
5. If no valid questions are found, return an empty array and a message asking the user to try again.

Your response should include:
- questions: the current list of parsed/cleaned questions
- message: a friendly message (either asking for confirmation or confirming readiness), **and always include the questions as a numbered markdown list at the top of the message, so the user can easily review each question.**
- isReady: true only if the user has confirmed the questions are ready to save, otherwise false.

For example, your message should look like this:

"""
Here are the questions I extracted:

1. [First question]
2. [Second question]
...

Does this look correct, or would you like to make any changes?"
"""

If there are no valid questions, just return a message asking the user to try again.
`,
      schema: QuestionsResponseSchema,
      loggingContext: {
        action: "parse_interview_questions",
      },
    });

    logger.info("Questions parsed", { result });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error parsing questions", { error });
    return NextResponse.json(
      { error: "Failed to parse questions" },
      { status: 500 }
    );
  }
});
