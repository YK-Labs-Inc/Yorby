import { streamText, tool, CoreMessage } from "ai";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { generateTextWithFallback } from "@/utils/ai/gemini";
import {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/utils/supabase/database.types";
import { Logger } from "next-axiom";
import { getServerUser } from "@/utils/auth/server";

type QuestionInsert = TablesInsert<"custom_job_questions">;

export const maxDuration = 30;

// Zod schemas for tool parameters
const createQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().describe("The interview question text"),
        answer_guidelines: z
          .string()
          .optional()
          .describe("Guidelines for answering the question."),
      })
    )
    .describe("Array of questions to create"),
});

const updateQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().describe("The ID of the question to update"),
        question: z.string().optional().describe("Updated question text"),
        answer_guidelines: z
          .string()
          .optional()
          .describe("Updated answer guidelines"),
        publication_status: z
          .enum(["draft", "published"])
          .optional()
          .describe("Updated publication status"),
      })
    )
    .describe("Array of questions to update with their IDs"),
});

const deleteQuestionsSchema = z.object({
  questionIds: z.array(z.string()).describe("Array of question IDs to delete"),
});

const messageSchema = z.object({
  userRequest: z
    .string()
    .describe("A concise summary of what the user requested"),
});

export async function POST(req: Request) {
  const logger = new Logger().with({
    function: "recruiting-questions-edit",
    endpoint: "/api/recruiting/questions/edit",
  });

  try {
    const {
      messages,
      jobId,
      existingQuestions,
    }: {
      messages: CoreMessage[];
      jobId: string;
      existingQuestions?: Tables<"custom_job_questions">[];
    } = await req.json();

    if (!jobId) {
      logger.error("Missing jobId in request");
      return new Response("Job ID is required", { status: 400 });
    }

    // Verify authentication and authorization
    const supabase = await createSupabaseServerClient();
    const user = await getServerUser();

    if (!user) {
      logger.error("Unauthorized request - no user");
      return new Response("Unauthorized", { status: 401 });
    }

    // Verify user has access to this job (through company membership)
    const { data: job, error: jobError } = await supabase
      .from("custom_jobs")
      .select("*, companies!inner(*)")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      logger.error("Job not found or access denied", {
        jobId,
        error: jobError,
      });
      return new Response("Job not found or access denied", { status: 404 });
    }

    // Check if user is a member of the company
    const { data: membership } = await supabase
      .from("company_members")
      .select("role")
      .eq("company_id", job.company_id!)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      logger.error("User not a member of the company", {
        userId: user.id,
        companyId: job.company_id,
      });
      return new Response("Access denied", { status: 403 });
    }

    logger.info("Authorized user accessing job questions", {
      userId: user.id,
      jobId,
      companyId: job.company_id,
      role: membership.role,
    });

    const result = streamText({
      model: google("gemini-2.5-flash-lite"),
      messages,
      system: `You are an AI assistant helping recruiters manage interview questions for job positions.
      
      You have access to tools for creating, updating, and deleting interview questions.
      When the user asks you to make changes to questions, use the appropriate tools.
      
      ${
        existingQuestions && existingQuestions.length > 0
          ? `
      Current existing questions for this job:
      ${existingQuestions.map((q, idx) => `${idx + 1}. ${q.question}`).join("\n")}
      
      Consider these existing questions when creating new ones to avoid duplication and ensure variety.
      `
          : ""
      }
      
      Important guidelines:
      - Always acknowledge the user's request first and respond with a concise, friendly message.
      - Perform the requested operations using the appropriate tools
      - Conclude with a summary using the conclusionMessage tool
      - Be helpful and conversational
      - If the user's request is unclear, ask for clarification
      - When creating questions, ensure they are relevant to the job role
      - Maintain professional language in all questions
      - IMPORTANT: Only generate answer_guidelines if the user SPECIFICALLY asks for them. Otherwise, leave answer_guidelines undefined/empty`,
      tools: {
        // initialMessage: tool({
        //   description:
        //     "Acknowledge the user's request and inform them you're working on it. Use this FIRST before any other tools.",
        //   parameters: messageSchema,
        //   execute: async ({ userRequest }) => {
        //     const message = await generateTextWithFallback({
        //       prompt: `Generate a concise, friendly acknowledgment message for this request: "${userRequest}".
        //       Keep it under 2 sentences. Be conversational and let them know you're working on it.`,
        //       loggingContext: { tool: "initialMessage", jobId },
        //     });

        //     return { data: message, action: QuestionAction.ACKNOWLEDGE };
        //   },
        // }),

        createQuestions: tool({
          description: "Create new interview questions for the job",
          parameters: createQuestionsSchema,
          execute: async ({ questions }) => {
            logger.info("Creating questions", {
              count: questions.length,
              jobId,
            });

            const questionsToInsert: QuestionInsert[] = questions.map((q) => ({
              custom_job_id: jobId,
              question: q.question,
              answer_guidelines: q.answer_guidelines || "",
              question_type: "ai_generated",
              publication_status: "published",
            }));

            return {
              data: {
                questions: questionsToInsert,
                action: "CREATE",
              },
            };
          },
        }),

        // updateQuestions: tool({
        //   description: "Update existing interview questions",
        //   parameters: updateQuestionsSchema,
        //   execute: async ({ questions }) => {
        //     logger.info("Updating questions", { count: questions.length });

        //     const updatedQuestions: CustomJobQuestion[] = [];

        //     for (const q of questions) {
        //       // Verify the question belongs to this job
        //       const { data: existing } = await supabase
        //         .from("custom_job_questions")
        //         .select("id")
        //         .eq("id", q.id)
        //         .eq("custom_job_id", jobId)
        //         .single();

        //       if (!existing) {
        //         logger.warn("Question not found or doesn't belong to job", {
        //           questionId: q.id,
        //           jobId,
        //         });
        //         continue;
        //       }

        //       const updateData: QuestionUpdate = {};
        //       if (q.question !== undefined) updateData.question = q.question;
        //       if (q.answer_guidelines !== undefined)
        //         updateData.answer_guidelines = q.answer_guidelines;
        //       if (q.publication_status !== undefined)
        //         updateData.publication_status = q.publication_status;

        //       const { data, error } = await supabase
        //         .from("custom_job_questions")
        //         .update(updateData)
        //         .eq("id", q.id)
        //         .eq("custom_job_id", jobId)
        //         .select()
        //         .single();

        //       if (error) {
        //         logger.error("Failed to update question", {
        //           questionId: q.id,
        //           error,
        //         });
        //         continue;
        //       }

        //       if (data) updatedQuestions.push(data);
        //     }

        //     logger.info("Questions updated successfully", {
        //       updatedCount: updatedQuestions.length,
        //     });
        //     return {
        //       data: updatedQuestions,
        //       action: QuestionAction.UPDATE,
        //     };
        //   },
        // }),

        // deleteQuestions: tool({
        //   description: "Delete interview questions",
        //   parameters: deleteQuestionsSchema,
        //   execute: async ({ questionIds }) => {
        //     logger.info("Deleting questions", { count: questionIds.length });

        //     // Verify all questions belong to this job before deleting
        //     const { data: questionsToDelete } = await supabase
        //       .from("custom_job_questions")
        //       .select("*")
        //       .in("id", questionIds)
        //       .eq("custom_job_id", jobId);

        //     if (!questionsToDelete || questionsToDelete.length === 0) {
        //       logger.warn("No questions found to delete", {
        //         questionIds,
        //         jobId,
        //       });
        //       return { deleted: [], count: 0 };
        //     }

        //     const validIds = questionsToDelete.map((q) => q.id);

        //     const { error } = await supabase
        //       .from("custom_job_questions")
        //       .delete()
        //       .in("id", validIds)
        //       .eq("custom_job_id", jobId);

        //     if (error) {
        //       logger.error("Failed to delete questions", { error });
        //       throw new Error(`Failed to delete questions: ${error.message}`);
        //     }

        //     logger.info("Questions deleted successfully", {
        //       deletedCount: validIds.length,
        //     });
        //     return { deleted: questionsToDelete, count: validIds.length };
        //   },
        // }),

        // conclusionMessage: tool({
        //   description:
        //     "Provide a conclusion message summarizing what was done. Use this LAST after all operations.",
        //   parameters: messageSchema,
        //   execute: async ({ userRequest }) => {
        //     const message = await generateTextWithFallback({
        //       prompt: `Generate a concise, friendly conclusion message for this completed request: "${userRequest}".
        //       Keep it under 2 sentences. Be positive and confirm the actions were completed successfully.`,
        //       loggingContext: { tool: "conclusionMessage", jobId },
        //     });

        //     return { data: message, action: QuestionAction.COMPLETE };
        //   },
        // }),
      },
    });

    logger.info("Streaming response initiated");
    await logger.flush();
    return result.toDataStreamResponse();
  } catch (error) {
    logger.error("Error in questions edit endpoint", {
      error: error instanceof Error ? error.message : String(error),
    });
    await logger.flush();
    return new Response("Internal server error", { status: 500 });
  }
}
