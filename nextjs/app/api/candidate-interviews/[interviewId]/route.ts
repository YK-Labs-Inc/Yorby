import { NextResponse } from "next/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { createAdminClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { z } from "zod";
import { Tables } from "@/utils/supabase/database.types";

// Zod schemas for type safety and validation
const HiringVerdictSchema = z.object({
  hiring_verdict: z.enum(["ADVANCE", "REJECT", "BORDERLINE"]),
  verdict_summary: z.string(),
  overall_match_score: z.number().int().min(0).max(100),
});

const StrengthSchema = z.object({
  title: z.string(),
  evidence: z.string(),
  relevance: z.string(),
});

const StrengthsResponseSchema = z.object({
  strengths: z.array(StrengthSchema),
});

const ConcernSchema = z.object({
  title: z.string(),
  description: z.string(),
  evidence: z.string(),
});

const ConcernsResponseSchema = z.object({
  concerns: z.array(ConcernSchema),
});

const JobAlignmentSchema = z.object({
  matched_requirements: z.array(z.string()),
  missing_requirements: z.array(z.string()),
  exceeded_requirements: z.array(z.string()),
});

const QuestionAnalysisSchema = z.object({
  question_id: z.string(),
  question_text: z.string(),
  user_answer: z.string(),
  answer_quality_score: z.number().int().min(0).max(100),
  key_points: z.array(z.string()),
  concerns: z.array(z.string()),
  examples_provided: z.array(z.string()),
});

// Type exports for TypeScript
type HiringVerdict = z.infer<typeof HiringVerdictSchema>;
type Strength = z.infer<typeof StrengthSchema>;
type Concern = z.infer<typeof ConcernSchema>;
type JobAlignment = z.infer<typeof JobAlignmentSchema>;
type QuestionAnalysis = z.infer<typeof QuestionAnalysisSchema>;

// Type for grouped question-answer pairs
interface GroupedQuestionAnswer {
  synthesized_question: string;
  synthesized_answer: string;
  original_segments: { question: string; answer: string }[];
}

// Helper function to create base context for AI prompts
function createBaseContext(
  data: { custom_jobs: any },
  transcript: string
): string {
  return `
INTERVIEW CONTEXT:
Job Title: ${data.custom_jobs.job_title}
Company: ${data.custom_jobs.company_name || "N/A"}
Job Description: ${data.custom_jobs.job_description || "N/A"}

INTERVIEW TRANSCRIPT:
${transcript}
`;
}

// Generate hiring verdict and overall score
async function generateHiringVerdict(
  baseContext: string,
  strengths: Strength[],
  concerns: Concern[],
  jobAlignment: JobAlignment,
  questionAnalysis: QuestionAnalysis[],
  logger: Logger
): Promise<HiringVerdict> {
  const prompt = `${baseContext}

As an expert recruiter, analyze this interview and provide a comprehensive hiring verdict based on ALL of the following analysis:

## CANDIDATE STRENGTHS
${strengths
  .map(
    (s, i) => `${i + 1}. ${s.title}
   - Evidence: ${s.evidence}
   - Relevance: ${s.relevance}`
  )
  .join("\n\n")}

## CONCERNS & RED FLAGS
${
  concerns.length > 0
    ? concerns
        .map(
          (c, i) => `${i + 1}. ${c.title}
   - Description: ${c.description}
   - Evidence: ${c.evidence}`
        )
        .join("\n\n")
    : "No significant concerns identified."
}

## JOB ALIGNMENT ANALYSIS
Matched Requirements: ${jobAlignment.matched_requirements.join(", ") || "None"}
Missing Requirements: ${jobAlignment.missing_requirements.join(", ") || "None"}
Exceeded Requirements: ${jobAlignment.exceeded_requirements.join(", ") || "None"}

## QUESTION-BY-QUESTION PERFORMANCE
${questionAnalysis
  .map(
    (q, i) => `${i + 1}. ${q.question_text}
   - Quality Score: ${q.answer_quality_score}/100
   - Summary: ${q.user_answer}
   - Key Points: ${q.key_points.join("; ")}
   - Concerns: ${q.concerns.join("; ") || "None"}`
  )
  .join("\n\n")}

Based on this comprehensive analysis of the entire interview, job requirements, and all insights generated above, provide a final hiring verdict.

Consider:
- The overall pattern of strengths vs concerns
- How well the candidate meets the job requirements
- The quality and consistency of their answers across all questions
- Any critical red flags that would disqualify them
- Their potential for success in this specific role

Be decisive - BORDERLINE should only be used when the positives and negatives are truly balanced and you cannot make a clear recommendation.

IMPORTANT: The overall_match_score MUST be a whole number (integer) between 0 and 100. Do not use decimal points.`;

  logger.info("Generating comprehensive hiring verdict with all analysis data");

  return await generateObjectWithFallback({
    prompt,
    schema: HiringVerdictSchema,
    loggingContext: { function: "generateHiringVerdict" },
  });
}

// Generate strengths
async function generateStrengths(
  baseContext: string,
  logger: Logger
): Promise<Strength[]> {
  const prompt = `${baseContext}

Identify the TOP 3 candidate strengths.

Focus on job-relevant strengths with concrete evidence. Quality over quantity.`;

  logger.info("Generating strengths");

  const result = await generateObjectWithFallback({
    prompt,
    schema: StrengthsResponseSchema,
    loggingContext: { function: "generateStrengths" },
  });

  return result.strengths;
}

// Generate concerns (including red flags)
async function generateConcerns(
  baseContext: string,
  logger: Logger
): Promise<Concern[]> {
  const prompt = `${baseContext}

As an experienced recruiter, identify ONLY meaningful concerns that would genuinely impact the candidate's success or indicate risk to the organization.

IMPORTANT: Do NOT flag concerns about:
- Skills not explicitly mentioned but reasonably implied (e.g., TypeScript for React developers)
- Minor technical gaps that can be learned on the job
- Standard industry tool variations (e.g., Jest vs Mocha)
- Seniority-appropriate knowledge (don't expect junior-level candidates to know everything)

DO flag concerns about:
- Behavioral red flags (defensiveness, blame-shifting, inability to discuss failures)
- Communication issues (incoherent responses, inability to explain technical concepts)
- Ethical concerns (taking credit for others' work, dishonesty)
- Critical skill misalignment (claims expertise but demonstrates fundamental misunderstanding)
- Cultural fit issues based on their described work style
- Concerning patterns across multiple answers (consistently vague, avoids specifics)

For each concern, you MUST:
1. Provide a clear title that summarizes the issue
2. Write a detailed description explaining why this is a genuine risk
3. Cite specific evidence from the transcript (this is REQUIRED)

Return empty array if no meaningful concerns exist. Quality over quantity - only flag what truly matters for hiring decision.`;

  logger.info("Generating concerns");

  const result = await generateObjectWithFallback({
    prompt,
    schema: ConcernsResponseSchema,
    loggingContext: { function: "generateConcerns" },
  });

  return result.concerns;
}

// Generate job alignment analysis
async function generateJobAlignment(
  baseContext: string,
  logger: Logger
): Promise<JobAlignment> {
  const prompt = `${baseContext}

Analyze how the candidate aligns with the job requirements.

IMPORTANT GUIDELINES:
- Focus on EXPLICIT requirements from the job description
- Consider reasonably implied skills (e.g., CSS knowledge for front-end developers, TypeScript for React roles)
- Don't penalize for missing tools/technologies that are industry-standard variations
- Consider the seniority level - junior roles have different expectations than senior roles

For matched_requirements:
- List skills/experiences the candidate clearly demonstrated
- Include both explicitly mentioned and reasonably demonstrated capabilities

For missing_requirements:
- ONLY list truly critical gaps that would impact job performance
- Do NOT include:
  * Skills reasonably implied by their demonstrated expertise (CSS for React devs, etc.)
  * Minor tooling differences (Jest vs Mocha, npm vs yarn)
  * Nice-to-have skills not marked as required
  * Skills that can be quickly learned on the job

For exceeded_requirements:
- Highlight skills/experiences beyond what's required
- Include leadership experience, additional technical skills, or domain expertise

Be specific and reference the job description directly. Keep each item concise.`;

  logger.info("Generating job alignment");

  return await generateObjectWithFallback({
    prompt,
    schema: JobAlignmentSchema,
    loggingContext: { function: "generateJobAlignment" },
  });
}

// Extract and synthesize question-answer pairs from transcript
async function extractQuestionAnswerPairs(
  transcript: string,
  logger: Logger
): Promise<GroupedQuestionAnswer[]> {
  const prompt = `
You are an expert at analyzing interview transcripts. Extract, group, and synthesize question-answer pairs from the interview.

Your task:
1. Identify distinct topics discussed in the interview
2. For each topic, find the baseline question and any follow-up questions
3. Synthesize all questions about the same topic into one comprehensive "master" question
4. Synthesize all answers about the same topic into one cohesive response

Guidelines for synthesis:
- The synthesized question should capture the essence of what the interviewer wanted to know
- Include key details from follow-up questions in the synthesized question
- The synthesized answer should be a coherent narrative combining all responses
- Maintain the candidate's voice and key examples/details

Examples:
- If baseline is "Tell me about your experience with Python" and follow-up is "What specific frameworks have you used?", 
  synthesize to: "Tell me about your experience with Python, including specific frameworks you've used"
- Multiple follow-ups about outcomes, challenges, and learnings should be incorporated into the synthesized question

For each topic discussed, return:
- A synthesized question that encompasses the baseline and all follow-ups
- A synthesized answer that coherently combines all responses
- The original Q&A segments for reference

Interview Transcript:
${transcript}`;

  logger.info(
    "Extracting and synthesizing question-answer pairs from transcript"
  );

  const result = await generateObjectWithFallback({
    prompt,
    schema: z.object({
      grouped_topics: z.array(
        z.object({
          synthesized_question: z
            .string()
            .describe(
              "A comprehensive question that incorporates the baseline and all follow-up questions"
            ),
          synthesized_answer: z
            .string()
            .describe(
              "A cohesive answer that combines all responses to this topic"
            ),
          original_segments: z
            .array(
              z.object({
                question: z.string(),
                answer: z.string(),
              })
            )
            .describe("The original Q&A pairs that were synthesized"),
        })
      ),
    }),
    loggingContext: { function: "extractQuestionAnswerPairs" },
  });

  logger.info("Synthesized question-answer pairs", {
    topicCount: result.grouped_topics.length,
    totalOriginalQuestions: result.grouped_topics.reduce(
      (acc, group) => acc + group.original_segments.length,
      0
    ),
  });

  return result.grouped_topics;
}

// Find matching question from company_question_bank using semantic matching
async function findMatchingQuestion(
  extractedQuestion: string,
  companyQuestions: Tables<"company_interview_question_bank">[],
  logger: Logger
): Promise<Tables<"company_interview_question_bank"> | null> {
  if (companyQuestions.length === 0) {
    return null;
  }

  const prompt = `
You are an expert at matching interview questions based on semantic meaning and intent.

Given a synthesized question from an interview (which may combine multiple related questions into one comprehensive question) 
and a list of predefined questions, determine which predefined question (if any) best matches the core topic.

Important: The synthesized question may be more detailed and comprehensive than the predefined questions, 
as it incorporates follow-up questions and clarifications. Focus on matching the PRIMARY TOPIC rather than exact wording.

Consider:
- Core topic and subject matter (most important)
- Overall intent of what's being assessed
- Key skills or experiences being evaluated
- Don't penalize for additional details in the synthesized question

Examples of good matches:
- Synthesized: "Tell me about your Python experience, including frameworks you've used and challenges faced"
  Predefined: "What is your experience with Python?" → MATCH (same core topic)
- Synthesized: "Describe a time you led a team, how you handled conflicts, and what the outcome was"
  Predefined: "Tell me about your leadership experience" → MATCH (same core topic)

Return the ID of the best matching question, or null if no question addresses the same core topic.

## Synthesized Question (from interview)
"${extractedQuestion}"

## Predefined Questions
${companyQuestions
  .map((q, index) => `${index + 1}. ID: ${q.id}\n   Question: "${q.question}"`)
  .join("\n\n")}`;

  logger.info("Matching question semantically", { extractedQuestion });

  try {
    const result = await generateObjectWithFallback({
      prompt,
      schema: z.object({
        matched_question_id: z.string().nullable(),
      }),
      loggingContext: { function: "findMatchingQuestion" },
    });

    const matchedQuestion = companyQuestions.find(
      (q) => q.id === result.matched_question_id
    );

    if (matchedQuestion) {
      logger.info("Found matching question", {
        extractedQuestion,
        matchedQuestionId: matchedQuestion.id,
      });
    }

    return matchedQuestion || null;
  } catch (error) {
    logger.warn("AI question matching failed", { error });
    return null;
  }
}

// Grade answer against answer guidelines or job description
async function gradeAnswer(
  groupedQA: GroupedQuestionAnswer,
  answerGuidelines: string | null,
  job: Tables<"custom_jobs">,
  logger: Logger
): Promise<{
  answer_quality_score: number;
  key_points: string[];
  concerns: string[];
  examples_provided: string[];
}> {
  const prompt = `
You are an expert recruiter evaluating a candidate's interview answer.

${
  answerGuidelines
    ? `Grade the answer against the specific answer guidelines provided.`
    : `Grade the answer based on how well it demonstrates qualifications for the job described.`
}

Note: The question and answer have been synthesized from multiple exchanges to capture the complete discussion of this topic.

Analyze the response and provide:
1. A quality score (0-100, MUST be a whole number/integer with no decimals) based on ${
    answerGuidelines
      ? "how well they met the guidelines"
      : "relevance and quality for the role"
  }
2. Key points that stood out positively
3. Any concerns or gaps in the answer
4. Specific examples the candidate provided

Consider:
- The depth and completeness of their response
- The coherence and clarity of their communication
- The relevance to the role requirements

## Job Context
Job Title: ${job.job_title}
Job Description: ${job.job_description}
${job.company_name ? `Company: ${job.company_name}` : ""}

## Question
${groupedQA.synthesized_question}

## Candidate's Response
${groupedQA.synthesized_answer}

${answerGuidelines ? `## Answer Guidelines\n${answerGuidelines}` : ""}`;

  logger.info("Grading synthesized answer", {
    synthesizedQuestion: groupedQA.synthesized_question,
    originalSegmentCount: groupedQA.original_segments.length,
    hasGuidelines: !!answerGuidelines,
  });

  const result = await generateObjectWithFallback({
    prompt,
    schema: z.object({
      answer_quality_score: z.number().int().min(0).max(100),
      key_points: z.array(z.string()),
      concerns: z.array(z.string()),
      examples_provided: z.array(z.string()),
    }),
    loggingContext: { function: "gradeAnswer" },
  });

  return result;
}

// Generate question analysis for recruiter review
async function generateRecruiterQuestionAnalysis(
  _interviewId: string,
  transcript: string,
  companyQuestions: Tables<"company_interview_question_bank">[],
  customJob: Tables<"custom_jobs">,
  logger: Logger
): Promise<QuestionAnalysis[]> {
  // Extract grouped Q&A pairs from transcript
  const groupedQuestionAnswers = await extractQuestionAnswerPairs(
    transcript,
    logger
  );

  // Process each grouped Q&A
  const analyses = await Promise.all(
    groupedQuestionAnswers.map(async (groupedQA) => {
      // Find matching question from company_question_bank using synthesized question
      const matchedQuestion = await findMatchingQuestion(
        groupedQA.synthesized_question,
        companyQuestions,
        logger
      );

      // Grade the answer
      const grading = await gradeAnswer(
        groupedQA,
        matchedQuestion?.answer || null,
        customJob,
        logger
      );

      return {
        question_id: matchedQuestion?.id || "",
        question_text: groupedQA.synthesized_question,
        user_answer: groupedQA.synthesized_answer,
        answer_quality_score: grading.answer_quality_score,
        key_points: grading.key_points,
        concerns: grading.concerns,
        examples_provided: grading.examples_provided,
      };
    })
  );

  logger.info("Generated recruiter question analysis", {
    totalTopics: analyses.length,
    matchedQuestions: analyses.filter((a) => a.question_id).length,
    totalOriginalQuestions: groupedQuestionAnswers.reduce(
      (acc, g) => acc + g.original_segments.length,
      0
    ),
  });

  return analyses;
}

// GET endpoint - fetch existing analysis
export const GET = withAxiom(
  async (
    request: AxiomRequest,
    context: { params: Promise<{ interviewId: string }> }
  ) => {
    const { interviewId } = await context.params;
    const logger = request.log.with({
      method: "GET",
      path: "/api/candidate-interviews/[interviewId]",
      interviewId,
    });

    try {
      logger.info("Fetching interview analysis", { interviewId });

      const supabase = await createAdminClient();

      // Use the view to get complete analysis
      const { data: analysis, error } = await supabase
        .from("recruiter_interview_analysis_complete")
        .select("*")
        .eq("candidate_interview_id", interviewId)
        .single();

      if (error?.code === "PGRST116") {
        logger.warn("Analysis not found", { interviewId });
        return NextResponse.json(
          {
            success: false,
            error: "Analysis not found. Please process the interview first.",
          },
          { status: 404 }
        );
      }

      if (error) {
        logger.error("Failed to fetch analysis", {
          interviewId,
          error: error.message,
        });
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch analysis",
          },
          { status: 500 }
        );
      }

      if (!analysis || !analysis.id) {
        logger.error("Analysis not found", { interviewId });
        return NextResponse.json(
          { success: false, error: "Analysis not found" },
          { status: 404 }
        );
      }

      logger.info("Successfully fetched analysis", {
        interviewId,
        analysisId: analysis.id,
      });

      // The view already includes all related data (including question_analysis)
      return NextResponse.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error("Error fetching interview analysis", { error });
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

// POST endpoint - process new interview
export const POST = withAxiom(
  async (
    request: AxiomRequest,
    context: { params: Promise<{ interviewId: string }> }
  ) => {
    const { interviewId } = await context.params;
    const logger = request.log.with({
      method: "POST",
      path: "/api/candidate-interviews/[interviewId]",
      interviewId,
    });

    try {
      const startTime = Date.now();
      logger.info("Processing interview analysis", { interviewId });

      const supabase = await createAdminClient();

      // Check if analysis already exists
      const { data: existingAnalysis } = await supabase
        .from("recruiter_interview_analysis")
        .select("id")
        .eq("candidate_interview_id", interviewId)
        .single();

      if (existingAnalysis) {
        logger.warn("Analysis already exists", {
          interviewId,
          analysisId: existingAnalysis.id,
        });
        return NextResponse.json(
          {
            success: false,
            error: "Analysis already exists for this interview",
          },
          { status: 409 }
        );
      }

      // First fetch the company candidate interview
      const interviewResult = await supabase
        .from("candidate_job_interviews")
        .select(
          `
          *,
          job_interviews!inner (
            id,
            custom_job_id,
            name,
            interview_type,
            custom_jobs!inner (*)
          )
        `
        )
        .eq("id", interviewId)
        .single();

      if (interviewResult.error || !interviewResult.data) {
        logger.error("Interview not found", {
          interviewId,
          error: interviewResult.error,
        });
        return NextResponse.json(
          { success: false, error: "Interview not found" },
          { status: 404 }
        );
      }

      const interview = interviewResult.data;
      const jobInterviews = interview.job_interviews;
      const customJob = jobInterviews.custom_jobs;

      // Fetch interview questions for this round
      const { data: interviewQuestions } = await supabase
        .from("job_interview_questions")
        .select(
          `
          *,
          company_interview_question_bank!inner (*)
        `
        )
        .eq("interview_id", interview.interview_id)
        .order("order_index", { ascending: true });

      const companyQuestions =
        interviewQuestions?.map((iq) => iq.company_interview_question_bank) ||
        [];

      // Now fetch the messages
      const messagesResult = await supabase
        .from("job_interview_messages")
        .select("*")
        .eq("candidate_interview_id", interviewId)
        .order("created_at", { ascending: true });

      const messages = messagesResult.data || [];

      // Create transcript
      const transcript = messages
        .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.text}`)
        .join("\n\n");

      const baseContext = createBaseContext(
        { custom_jobs: customJob },
        transcript
      );

      logger.info("Generating AI analysis", { interviewId });

      // Generate all analysis sections in parallel (except hiring verdict)
      const [strengths, concerns, jobAlignment, recruiterQuestionAnalysis] =
        await Promise.all([
          generateStrengths(baseContext, logger),
          generateConcerns(baseContext, logger),
          generateJobAlignment(baseContext, logger),
          generateRecruiterQuestionAnalysis(
            interviewId,
            transcript,
            companyQuestions,
            customJob,
            logger
          ),
        ]);

      // Generate hiring verdict AFTER all other analysis is complete
      // This ensures the verdict is based on ALL insights
      logger.info(
        "All analysis complete. Generating comprehensive hiring verdict",
        {
          strengthsCount: strengths.length,
          concernsCount: concerns.length,
          questionAnalysisCount: recruiterQuestionAnalysis.length,
        }
      );

      const verdict = await generateHiringVerdict(
        baseContext,
        strengths,
        concerns,
        jobAlignment,
        recruiterQuestionAnalysis,
        logger
      );

      // Start a transaction to insert all data
      logger.info("Saving analysis to database", { interviewId });

      // Insert main analysis
      const { data: savedAnalysis, error: saveError } = await supabase
        .from("recruiter_interview_analysis")
        .insert({
          candidate_interview_id: interviewId,
          hiring_verdict: verdict.hiring_verdict,
          verdict_summary: verdict.verdict_summary,
          overall_match_score: verdict.overall_match_score,
          processing_duration_ms: Date.now() - startTime,
          model_used: "gemini-2.5-flash",
        })
        .select()
        .single();

      if (saveError || !savedAnalysis) {
        logger.error("Failed to save main analysis", {
          interviewId,
          error: saveError,
        });
        throw new Error("Failed to save analysis");
      }

      const analysisId = savedAnalysis?.id;

      // Insert all related data
      await Promise.all([
        // Strengths
        strengths.length > 0 &&
          supabase.from("recruiter_interview_strengths").insert(
            strengths.map((s, idx) => ({
              analysis_id: analysisId,
              title: s.title,
              evidence: s.evidence,
              relevance: s.relevance,
              display_order: idx,
            }))
          ),

        // Concerns
        concerns.length > 0 &&
          supabase.from("recruiter_interview_concerns").insert(
            concerns.map((c) => ({
              analysis_id: analysisId,
              title: c.title,
              description: c.description,
              evidence: c.evidence,
            }))
          ),

        // Job alignment
        supabase.from("recruiter_job_alignment_details").insert({
          analysis_id: analysisId,
          matched_requirements: jobAlignment.matched_requirements,
          missing_requirements: jobAlignment.missing_requirements,
          exceeded_requirements: jobAlignment.exceeded_requirements,
        }),

        // Question analysis
        recruiterQuestionAnalysis.length > 0 &&
          supabase.from("recruiter_question_analysis").insert(
            recruiterQuestionAnalysis.map((q, idx) => ({
              analysis_id: analysisId,
              question_id: q.question_id || null,
              question_text: q.question_text,
              user_answer: q.user_answer,
              answer_quality_score: q.answer_quality_score,
              key_points: q.key_points,
              concerns: q.concerns,
              examples_provided: q.examples_provided,
              display_order: idx,
            }))
          ),
      ]);

      const processingTime = Date.now() - startTime;
      logger.info("Interview analysis complete", {
        interviewId,
        analysisId,
        processingTime,
        verdict: verdict.hiring_verdict,
        overallScore: verdict.overall_match_score,
      });

      // Fetch the complete analysis using the view (includes all related data)
      const { data: completeAnalysis } = await supabase
        .from("recruiter_interview_analysis_complete")
        .select("*")
        .eq("id", analysisId)
        .single();

      // Update the interview status to complete
      const { error: updateError } = await supabase
        .from("candidate_job_interviews")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", interviewId);

      if (updateError) {
        logger.error("Failed to update interview status", {
          interviewId,
          error: updateError,
        });
        // Don't throw here - the analysis is already saved successfully
      }

      return NextResponse.json({
        success: true,
        data: completeAnalysis,
        processingTime,
      });
    } catch (error) {
      logger.error("Error processing interview", { error });
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
