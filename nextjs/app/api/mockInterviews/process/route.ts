import { NextResponse } from "next/server";
import {
  generateFeedback,
  getCustomJobFiles,
} from "@/app/dashboard/jobs/[jobId]/questions/[questionId]/actions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { AxiomRequest, Logger } from "next-axiom";
import { withAxiom } from "next-axiom";
import { trackServerEvent } from "@/utils/tracking/serverUtils";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { z } from "zod";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface JobContext {
  jobTitle: string | null;
  jobDescription: string | null;
  companyName: string | null;
  companyDescription: string | null;
}

interface GenerationResult<T> {
  data: T;
  inputTokens: number;
  outputTokens: number;
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
  jobContext: JobContext,
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
  jobContext: JobContext,
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

interface QuestionAnswerPair {
  question: string;
  answer: string;
}

interface MatchedQuestionData {
  questionId: string;
  question: string;
  answer_guidelines: string;
}

async function generateQuestionBreakdown(
  mockInterviewId: string,
  transcript: string,
  jobContext: JobContext,
  jobFiles: { fileData: { fileUri: string; mimeType: string } }[],
  logger: Logger,
): Promise<GenerationResult<any[]>> {
  return withRetry(
    async () => {
      // Step 1: Extract question-answer pairs from transcript
      const extractedPairs = await extractQuestionAnswerPairs(
        transcript,
        logger,
      );

      // Step 2: Get the associated custom job questions for this mock interview
      const mockInterviewQuestions = await getMockInterviewQuestions(
        mockInterviewId,
        logger,
      );

      // Step 3: Process each extracted Q&A pair
      const feedbackResults = await Promise.all(
        extractedPairs.map(async (pair) => {
          const matchedQuestion = await findMatchingQuestion(
            pair.question,
            mockInterviewQuestions,
          );

          if (matchedQuestion) {
            // Step 4a: Use sophisticated generateFeedback for matched questions
            logger.info("Using generateFeedback for matched question", {
              questionId: matchedQuestion.questionId,
              question: pair.question,
            });

            try {
              const customJob = await getCustomJobFromMockInterview(
                mockInterviewId,
              );
              const feedback = await generateFeedback(
                customJob.id,
                matchedQuestion.questionId,
                pair.answer,
              );

              return {
                question: pair.question,
                answer: pair.answer,
                pros: feedback.pros,
                cons: feedback.cons,
                score: feedback.correctness_score,
              };
            } catch (error) {
              logger.warn(
                "generateFeedback failed, falling back to simple AI feedback",
                {
                  error: error instanceof Error ? error.message : String(error),
                  questionId: matchedQuestion.questionId,
                },
              );

              // Fallback to simple AI feedback if generateFeedback fails
              return await generateSimpleAIFeedback(
                pair,
                jobContext,
                jobFiles,
                logger,
              );
            }
          } else {
            // Step 4b: Use simple AI feedback for unmatched questions
            logger.info("Using simple AI feedback for unmatched question", {
              question: pair.question,
            });
            return await generateSimpleAIFeedback(
              pair,
              jobContext,
              jobFiles,
              logger,
            );
          }
        }),
      );

      // Step 5: Store all feedback in database
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase
        .from("mock_interview_question_feedback")
        .insert(
          feedbackResults.map((result) => ({
            question: result.question,
            answer: result.answer,
            pros: result.pros,
            cons: result.cons,
            mock_interview_id: mockInterviewId,
            score: result.score,
          })),
        );

      if (error) {
        throw error;
      }

      // Calculate matched questions count for logging
      const matchedCount = await Promise.all(
        extractedPairs.map(async (pair) => {
          const matched = await findMatchingQuestion(
            pair.question,
            mockInterviewQuestions,
          );
          return matched !== null;
        }),
      );
      const totalMatchedQuestions = matchedCount.filter(Boolean).length;

      logger.info("Question breakdown generated", {
        totalQuestions: feedbackResults.length,
        matchedQuestions: totalMatchedQuestions,
      });

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

// Helper function to extract question-answer pairs from transcript
async function extractQuestionAnswerPairs(
  transcript: string,
  logger: Logger,
): Promise<QuestionAnswerPair[]> {
  const systemPrompt = `
    You are an expert at analyzing interview transcripts. Your job is to extract every question-answer pair from the interview transcript.
    
    Parse the transcript and identify:
    1. Each interview question asked by the interviewer
    2. The corresponding answer given by the candidate
    
    Return the extracted pairs in this JSON format:
    {
      "question_answer_pairs": [
        {
          "question": "exact question text",
          "answer": "exact answer text"
        }
      ]
    }
    
    Instructions:
    - Extract the exact text of questions and answers
    - Include all questions asked, even follow-up questions
    - Match each question with its corresponding answer
    - If a question doesn't have a clear answer, include it with an empty answer string
    
    Interview Transcript:
    ${transcript}
  `;

  const result = await generateObjectWithFallback({
    systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract question-answer pairs from this transcript",
          },
        ],
      },
    ],
    schema: z.object({
      question_answer_pairs: z.array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      ),
    }),
  });

  logger.info("Extracted question-answer pairs", {
    count: result.question_answer_pairs.length,
  });
  return result.question_answer_pairs;
}

// Helper function to get mock interview questions for this interview
async function getMockInterviewQuestions(
  mockInterviewId: string,
  logger: Logger,
): Promise<MatchedQuestionData[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("mock_interview_questions")
    .select(`
      custom_job_questions (
        id,
        question,
        answer_guidelines
      )
    `)
    .eq("interview_id", mockInterviewId);

  if (error) {
    logger.error("Failed to fetch mock interview questions", { error });
    return [];
  }

  const questions = data
    ?.filter((item) => item.custom_job_questions)
    .map((item) => ({
      questionId: item.custom_job_questions!.id,
      question: item.custom_job_questions!.question,
      answer_guidelines: item.custom_job_questions!.answer_guidelines,
    })) || [];

  logger.info("Fetched mock interview questions", { count: questions.length });
  return questions;
}

// Helper function to find matching question using AI semantic matching
async function findMatchingQuestion(
  extractedQuestion: string,
  mockInterviewQuestions: MatchedQuestionData[],
): Promise<MatchedQuestionData | null> {
  if (mockInterviewQuestions.length === 0) {
    return null;
  }

  const systemPrompt = `
    You are an expert at matching interview questions based on semantic meaning and intent.
    
    Given an extracted question from an interview transcript and a list of predefined questions,
    determine which predefined question (if any) best matches the extracted question.
    
    Consider:
    - Semantic meaning and intent
    - Core topic being asked about
    - Similar phrasing or concepts
    - Context and purpose of the question
    
    Return the ID of the best matching question, or null if no question is a good match.
    A "good match" means the questions are asking about essentially the same thing, even if worded differently.
    
    If the extracted question doesn't reasonably match any of the predefined questions, return null.
    
    Return your response in this JSON format:
    {
      "matched_question_id": "question_id_string_or_null",
    }
    
    ## Extracted Question
    "${extractedQuestion}"
    
    ## Predefined Questions
    ${
    mockInterviewQuestions.map((q, index) =>
      `${index + 1}. ID: ${q.questionId}\n   Question: "${q.question}"`
    ).join("\n\n")
  }
  `;

  try {
    const result = await generateObjectWithFallback({
      systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Find the best matching question from the predefined list",
            },
          ],
        },
      ],
      schema: z.object({
        matched_question_id: z.string().nullable(),
      }),
    });

    // Only consider it a match if confidence is high enough (75% or higher)
    const matchedQuestion = mockInterviewQuestions.find(
      (q) => q.questionId === result.matched_question_id,
    );

    return matchedQuestion ?? null;
  } catch (error) {
    // If AI matching fails, fall back to null (no match)
    console.warn("AI question matching failed:", error);
    return null;
  }
}

// Helper function to get custom job from mock interview
async function getCustomJobFromMockInterview(mockInterviewId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("custom_job_mock_interviews")
    .select(`
      custom_jobs (*)
    `)
    .eq("id", mockInterviewId)
    .single();

  if (error || !data?.custom_jobs) {
    throw new Error("Failed to fetch custom job for mock interview");
  }

  return data.custom_jobs;
}

// Helper function to generate simple AI feedback for unmatched questions
async function generateSimpleAIFeedback(
  pair: QuestionAnswerPair,
  jobContext: JobContext,
  jobFiles: { fileData: { fileUri: string; mimeType: string } }[],
  logger: Logger,
): Promise<
  {
    question: string;
    answer: string;
    pros: string[];
    cons: string[];
    score: number;
  }
> {
  const systemPrompt = `
    You are an expert interview coach. Provide feedback on this specific question-answer pair from an interview.
    
    Context Information:
    ${JSON.stringify(jobContext, null, 2)}
    
    Question: ${pair.question}
    Answer: ${pair.answer}
    
    Provide feedback in this JSON format:
    {
      "pros": ["specific strengths in the answer"],
      "cons": ["specific areas for improvement"],
      "score": "score from 0-100"
    }
    
    Focus on:
    - Relevance to the job role and context
    - Clarity and structure of the answer
    - Specific examples and evidence provided
    - Professional communication skills
    
    Guidelines:
    - Pros should highlight what the candidate did well
    - Cons should only include actual problems or missing critical elements
    - Score should reflect overall answer quality (0-100)
    - If there are no genuine issues, cons can be empty
  `;

  const result = await generateObjectWithFallback({
    systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Generate feedback for this question-answer pair",
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
      score: z.number().min(0).max(100),
    }),
  });

  logger.info("Generated simple AI feedback", {
    question: pair.question,
    score: result.score,
  });

  return {
    question: pair.question,
    answer: pair.answer,
    pros: result.pros,
    cons: result.cons,
    score: result.score,
  };
}

interface JobFitAnalysis {
  job_fit_analysis: string;
  job_fit_percentage: number;
}

async function generateJobFitAnalysis(
  transcript: string,
  jobContext: JobContext,
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
  jobContext: JobContext,
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
  jobContext: JobContext,
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
    const jobFiles = await getCustomJobFiles(customJob.id);
    logger.info("Job files fetched", { jobFiles });
    const messages = mockInterview.mock_interview_messages;

    // Create interview transcript and context
    const transcript = messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.text}`)
      .join("\\n");
    logger.info("Transcript created");
    const jobContext: JobContext = {
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
