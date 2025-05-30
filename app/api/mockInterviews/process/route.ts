import { NextResponse } from "next/server";
import {
  GenerateContentResult,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";
import { getAllFiles } from "@/app/dashboard/jobs/[jobId]/questions/[questionId]/actions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { AxiomRequest, Logger } from "next-axiom";
import { withAxiom } from "next-axiom";
import { trackServerEvent } from "@/utils/tracking/serverUtils";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { z } from "zod";
import { generateObject } from "ai";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface GenerationResult<T> {
  data: T;
  inputTokens: number;
  outputTokens: number;
}

// Helper function to get token counts from Gemini response
function getTokenCounts(result: GenerateContentResult) {
  return {
    inputTokens: result.response.usageMetadata?.promptTokenCount || 0,
    outputTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
  };
}

async function withRetry<T>(
  operation: () => Promise<GenerationResult<T>>,
  name: string,
  logger: any,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY,
): Promise<GenerationResult<T>> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      logger.warn(`Retrying ${name} after error`, {
        error,
        retriesLeft: retries - 1,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(operation, name, logger, retries - 1, delay * 2);
    }
    throw error;
  }
}

async function generateOverview(
  transcript: string,
  jobContext: any,
  jobFiles: { fileData: { fileUri: string; mimeType: string } }[],
  logger: Logger,
): Promise<GenerationResult<string>> {
  const systemPrompt =
    `You are an expert interview coach. Review this job interview and provide a concise overview of the candidate's performance.

Context Information:
${JSON.stringify(jobContext, null, 2)}

Interview Transcript:
${transcript}

Provide a concise overview of the interview performance in 2-3 paragraphs at maximum. Do not force yourself
to write more feedback if you don't have any.`;

  return withRetry(
    async () => {
      const result = await generateObjectWithFallback({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Generate the overview",
              },
              ...jobFiles.map((file) => ({
                type: "file" as "file",
                data: file.fileData.fileUri,
                mimeType: file.fileData.mimeType,
              })),
            ],
          },
        ],
        systemPrompt,
        schema: z.object({
          overview: z.string(),
        }),
      });
      const { overview } = result;
      logger.info("Overview generated");
      return {
        data: overview,
        inputTokens: 0,
        outputTokens: 0,
      };
    },
    "overview generation",
    logger,
  );
}

async function generateProsAndCons(
  transcript: string,
  jobContext: any,
  jobFiles: { fileData: { fileUri: string; mimeType: string } }[],
  logger: Logger,
): Promise<GenerationResult<{ pros: string[]; cons: string[] }>> {
  const systemPrompt =
    `You are an expert interview coach. Review this job interview and list the strengths and areas for improvement.

Context Information:
${JSON.stringify(jobContext, null, 2)}

Interview Transcript:
${transcript}

Provide your analysis in JSON format:
{
  "pros": ["list of specific strengths with examples"],
  "cons": ["list of specific areas for improvement with examples"]
}
  
Do not force yourself to write more feedback if you don't have any. If there are no pros or no cons, return an empty list.
Do not force yourself to think of a pro or a con if it is unnecessary.`;

  return withRetry(
    async () => {
      const result = await generateObjectWithFallback({
        systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Generate the pros and cons",
              },
              ...jobFiles.map((file) => ({
                type: "file" as "file",
                data: file.fileData.fileUri,
                mimeType: file.fileData.mimeType,
              })),
            ],
          },
        ],
        schema: z.object({
          pros: z.array(z.string()),
          cons: z.array(z.string()),
        }),
      });
      logger.info("Pros and cons generated");
      return {
        data: result,
        inputTokens: 0,
        outputTokens: 0,
      };
    },
    "pros and cons generation",
    logger,
  );
}

async function generateQuestionBreakdown(
  mockInterviewId: string,
  transcript: string,
  jobContext: any,
  jobFiles: { fileData: { fileUri: string; mimeType: string } }[],
  logger: Logger,
): Promise<GenerationResult<any[]>> {
  const systemPrompt =
    `You are an expert interview coach. Your job is to provide feedback on every interview question 
  that is asked in this interview. 

  Follow these steps:

  1) Read the interview transcript and the context information.
  2) Extract each interview question and answer pair from the transcript.
  3) Generate a list of strengths and areas for improvement for each question and answer pairing and 
  generate a score from 0-100 for each question and answer pairing.
  4) Return the feedback in JSON format.

Context Information:
${JSON.stringify(jobContext, null, 2)}

Interview Transcript:
${transcript}

Extract each question-answer pair and provide detailed feedback in this JSON format:
{
  "question_breakdown": [
    {
      "question": "question text", // string
      "answer": "answer text", // string
      "feedback": {
        "strengths": ["specific strengths"], // array of strings
        "improvements": ["areas to improve"], // array of strings
        "rating": "score from 0-100" // number
      }
    }
  ]
}
  
Your final response should be a JSON object with the question_breakdown array.

If there are no strengths or areas for improvement, return an empty list for that specific field.

Do not force yourself to write more feedback if you don't have any.
It is okay to have an empty strengths or any empty improvements field, however, it is not okay to have an empty rating.
`;
  return withRetry(
    async () => {
      const result = await generateObjectWithFallback({
        systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Generate the question breakdown",
              },
              ...jobFiles.map((file) => ({
                type: "file" as "file",
                data: file.fileData.fileUri,
                mimeType: file.fileData.mimeType,
              })),
            ],
          },
        ],
        schema: z
          .object({
            question_breakdown: z.array(
              z
                .object({
                  question: z.string(),
                  answer: z.string(),
                  feedback: z
                    .object({
                      strengths: z.array(z.string()),
                      improvements: z.array(z.string()),
                      rating: z.number(),
                    })
                    .required(),
                })
                .required(),
            ),
          })
          .required(),
      });
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase
        .from("mock_interview_question_feedback")
        .insert(
          result.question_breakdown.map((q) => ({
            question: q.question,
            answer: q.answer,
            pros: q.feedback.strengths,
            cons: q.feedback.improvements,
            mock_interview_id: mockInterviewId,
            score: q.feedback.rating,
          })),
        );
      if (error) {
        throw error;
      }
      logger.info("Question breakdown generated");
      return {
        data: [],
        inputTokens: 0,
        outputTokens: 0,
      };
    },
    "question breakdown generation",
    logger,
  );
}

interface JobFitAnalysis {
  job_fit_analysis: string;
  job_fit_percentage: number;
}

async function generateJobFitAnalysis(
  transcript: string,
  jobContext: any,
  jobFiles: { fileData: { fileUri: string; mimeType: string } }[],
  logger: Logger,
): Promise<GenerationResult<JobFitAnalysis>> {
  const systemPrompt =
    `You are an expert interview coach. Analyze how well the candidate's responses align with the job requirements.

Context Information:
${JSON.stringify(jobContext, null, 2)}

Interview Transcript:
${transcript}

Provide your analysis in JSON format:
{
  "job_fit_analysis": "detailed analysis of how candidate's skills and experience match the role",
  "job_fit_percentage": "number between 0-100 representing overall fit"
}
  
Be very objective when determining the job fit percentage.
When writing your job fit analysis, do not force yourself to write more feedback if you don't have any. Be as objective as possible.

  `;

  return withRetry(
    async () => {
      const result = await generateObjectWithFallback({
        systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Generate the job fit analysis",
              },
              ...jobFiles.map((file) => ({
                type: "file" as "file",
                data: file.fileData.fileUri,
                mimeType: file.fileData.mimeType,
              })),
            ],
          },
        ],
        schema: z
          .object({
            job_fit_analysis: z.string(),
            job_fit_percentage: z.number(),
          })
          .required(),
      });
      logger.info("Job fit analysis generated");
      return {
        data: result,
        inputTokens: 0,
        outputTokens: 0,
      };
    },
    "job fit analysis generation",
    logger,
  );
}

async function generateScore(
  transcript: string,
  jobContext: any,
  jobFiles: { fileData: { fileUri: string; mimeType: string } }[],
  logger: Logger,
): Promise<GenerationResult<number>> {
  const systemPrompt =
    `You are an expert interview coach. Provide an overall score for this interview performance.

Context Information:
${JSON.stringify(jobContext, null, 2)}

Interview Transcript:
${transcript}

Return a number between 0-100 representing the overall interview performance, considering communication skills, relevance of answers, and job fit.`;

  return withRetry(
    async () => {
      const result = await generateObjectWithFallback({
        systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Generate the score",
              },
              ...jobFiles.map((file) => ({
                type: "file" as "file",
                data: file.fileData.fileUri,
                mimeType: file.fileData.mimeType,
              })),
            ],
          },
        ],
        schema: z
          .object({
            score: z.number(),
          })
          .required(),
      });
      logger.info("Score generated");
      return {
        data: result.score,
        inputTokens: 0,
        outputTokens: 0,
      };
    },
    "score generation",
    logger,
  );
}

async function generateKeyImprovements(
  transcript: string,
  jobContext: any,
  jobFiles: { fileData: { fileUri: string; mimeType: string } }[],
  logger: Logger,
): Promise<GenerationResult<string[]>> {
  const systemPrompt =
    `You are an expert interview coach. Identify the key areas where the candidate should focus on improving.

Context Information:
${JSON.stringify(jobContext, null, 2)}

Interview Transcript:
${transcript}

Provide a JSON array of specific, actionable improvements:
{
  "key_improvements": ["specific improvement points"]
}
  
Return as many improvements as you can, but do not force yourself to write more feedback if you don't have any.
It is okay for there to be no improvement areas if the candidate is very qualified and the interview was increible.
It is also okay to include multiple improvements if the candidate has multiple areas for improvement.
`;

  return withRetry(
    async () => {
      const result = await generateObjectWithFallback({
        systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Generate the key improvements",
              },
              ...jobFiles.map((file) => ({
                type: "file" as "file",
                data: file.fileData.fileUri,
                mimeType: file.fileData.mimeType,
              })),
            ],
          },
        ],
        schema: z
          .object({
            key_improvements: z.array(z.string()),
          })
          .required(),
      });
      logger.info("Key improvements generated");
      return {
        data: result.key_improvements,
        inputTokens: 0,
        outputTokens: 0,
      };
    },
    "key improvements generation",
    logger,
  );
}

export const POST = withAxiom(async (request: AxiomRequest) => {
  let logger = request.log.with({
    method: request.method,
    path: "/api/mockInterviews/process",
  });
  try {
    const { mockInterviewId } = await request.json();
    logger = logger.with({ mockInterviewId });
    const supabase = await createSupabaseServerClient();

    // Fetch mock interview data
    const { data: mockInterview, error: mockInterviewError } = await supabase
      .from("custom_job_mock_interviews")
      .select("*, custom_jobs(*), mock_interview_messages(*)")
      .eq("id", mockInterviewId)
      .single();

    if (mockInterviewError) {
      throw mockInterviewError;
    }

    if (!mockInterview) {
      throw new Error("Mock interview not found");
    }

    const customJob = mockInterview.custom_jobs;

    // Get job files
    const jobFiles = await getAllFiles(customJob.id);
    logger.info("Job files fetched", { jobFiles });
    const messages = mockInterview.mock_interview_messages;

    // Create interview transcript and context
    const transcript = messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.text}`)
      .join("\\n");
    logger.info("Transcript created");
    const jobContext = {
      jobTitle: customJob.job_title,
      jobDescription: customJob.job_description,
      companyName: customJob.company_name,
      companyDescription: customJob.company_description,
    };

    // Generate all feedback components in parallel
    const [
      overviewResult,
      prosAndConsResult,
      questionBreakdownResult,
      jobFitAnalysisResult,
      scoreResult,
      keyImprovementsResult,
    ] = await Promise.all([
      generateOverview(transcript, jobContext, jobFiles, logger),
      generateProsAndCons(transcript, jobContext, jobFiles, logger),
      generateQuestionBreakdown(
        mockInterviewId,
        transcript,
        jobContext,
        jobFiles,
        logger,
      ),
      generateJobFitAnalysis(transcript, jobContext, jobFiles, logger),
      generateScore(transcript, jobContext, jobFiles, logger),
      generateKeyImprovements(transcript, jobContext, jobFiles, logger),
    ]);

    logger.info("All feedback components generated in parallel");

    // Calculate total token counts
    const totalInputTokens = overviewResult.inputTokens +
      prosAndConsResult.inputTokens +
      questionBreakdownResult.inputTokens +
      jobFitAnalysisResult.inputTokens +
      scoreResult.inputTokens +
      keyImprovementsResult.inputTokens;

    const totalOutputTokens = overviewResult.outputTokens +
      prosAndConsResult.outputTokens +
      questionBreakdownResult.outputTokens +
      jobFitAnalysisResult.outputTokens +
      scoreResult.outputTokens +
      keyImprovementsResult.outputTokens;

    const { pros, cons } = prosAndConsResult.data;
    const { job_fit_analysis, job_fit_percentage } = jobFitAnalysisResult.data;

    // Store feedback in database
    const { error: feedbackError } = await supabase
      .from("custom_job_mock_interview_feedback")
      .insert({
        mock_interview_id: mockInterviewId,
        overview: overviewResult.data,
        pros,
        cons,
        job_fit_analysis,
        job_fit_percentage,
        score: scoreResult.data,
        key_improvements: keyImprovementsResult.data,
        input_token_count: totalInputTokens,
        output_token_count: totalOutputTokens,
      });

    if (feedbackError) {
      throw new Error("Failed to store feedback");
    }

    const { error: mockInterviewUpdateError } = await supabase
      .from("custom_job_mock_interviews")
      .update({
        status: "complete",
      })
      .eq("id", mockInterviewId);

    if (mockInterviewUpdateError) {
      throw mockInterviewUpdateError;
    }

    await trackServerEvent({
      eventName: "mock_interview_completed",
      userId: mockInterview.custom_jobs.user_id,
      args: {
        jobId: customJob.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("Error processing interview:", { error: error.message });
    return NextResponse.error();
  }
});
