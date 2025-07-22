import { NextResponse } from "next/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { createAdminClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { z } from "zod";

// Zod schemas for type safety and validation
const HiringVerdictSchema = z.object({
  hiring_verdict: z.enum(["ADVANCE", "REJECT", "BORDERLINE"]),
  verdict_summary: z.string(),
  overall_match_score: z.number().min(0).max(100),
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
  evidence: z.string().optional(),
  impact: z.string(),
  severity: z.enum(["critical", "high", "medium", "low"]),
});

const ConcernsResponseSchema = z.object({
  concerns: z.array(ConcernSchema),
});

const HighlightSchema = z.object({
  highlight_type: z.string(),
  quote: z.string(),
  context: z.string(),
  timestamp_seconds: z.number().optional(),
});

const HighlightsResponseSchema = z.object({
  highlights: z.array(HighlightSchema),
});

const JobAlignmentSchema = z.object({
  matched_requirements: z.array(z.string()),
  missing_requirements: z.array(z.string()),
  exceeded_requirements: z.array(z.string()),
});

const QuestionAnalysisSchema = z.object({
  question_id: z.string(),
  question_text: z.string(),
  answer_summary: z.string(),
  answer_quality_score: z.number().min(0).max(100),
  key_points: z.array(z.string()),
  concerns: z.array(z.string()),
  examples_provided: z.array(z.string()),
});

const QuestionsResponseSchema = z.object({
  questions: z.array(QuestionAnalysisSchema),
});

// Type exports for TypeScript
type HiringVerdict = z.infer<typeof HiringVerdictSchema>;
type Strength = z.infer<typeof StrengthSchema>;
type Concern = z.infer<typeof ConcernSchema>;
type Highlight = z.infer<typeof HighlightSchema>;
type JobAlignment = z.infer<typeof JobAlignmentSchema>;
type QuestionAnalysis = z.infer<typeof QuestionAnalysisSchema>;

interface RouteContext {
  params: { interviewId: string };
}

// Helper function to create base context for AI prompts
function createBaseContext(
  interview: any,
  transcript: string,
  questionFeedback: any[]
): string {
  return `
INTERVIEW CONTEXT:
Job Title: ${interview.custom_jobs.job_title}
Company: ${interview.custom_jobs.company_name || "N/A"}
Job Description: ${interview.custom_jobs.job_description || "N/A"}

INTERVIEW TRANSCRIPT:
${transcript}

QUESTION-BY-QUESTION FEEDBACK:
${JSON.stringify(questionFeedback, null, 2)}
`;
}

// Generate hiring verdict and overall score
async function generateHiringVerdict(
  baseContext: string,
  logger: Logger
): Promise<HiringVerdict> {
  const prompt = `${baseContext}

As an expert recruiter, analyze this interview and provide a hiring verdict.

Consider: overall fit, key qualifications, major gaps, and cultural alignment.
Be decisive - BORDERLINE should only be used when truly uncertain.`;

  logger.info("Generating hiring verdict");

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

Identify ALL concerns and red flags.

Guidelines:
- "critical" = deal-breaker red flags (dishonesty, major skill gaps, etc.)
- "high" = significant concerns that could impact success
- "medium" = notable gaps that need addressing
- "low" = minor concerns or areas for development

Include up to 5 most important concerns. If no concerns, return empty array.`;

  logger.info("Generating concerns");

  const result = await generateObjectWithFallback({
    prompt,
    schema: ConcernsResponseSchema,
    loggingContext: { function: "generateConcerns" },
  });

  return result.concerns;
}

// Generate transcript highlights
async function generateHighlights(
  baseContext: string,
  logger: Logger
): Promise<Highlight[]> {
  const prompt = `${baseContext}

Extract 4-6 key transcript highlights.

Include a mix of positive and concerning highlights that support the hiring decision.
Use descriptive highlight_type values that clearly indicate what the highlight demonstrates.`;

  logger.info("Generating highlights");

  const result = await generateObjectWithFallback({
    prompt,
    schema: HighlightsResponseSchema,
    loggingContext: { function: "generateHighlights" },
  });

  return result.highlights;
}

// Generate job alignment analysis
async function generateJobAlignment(
  baseContext: string,
  logger: Logger
): Promise<JobAlignment> {
  const prompt = `${baseContext}

Analyze job requirement alignment.

Be specific and reference the job description directly. Keep each item concise.`;

  logger.info("Generating job alignment");

  return await generateObjectWithFallback({
    prompt,
    schema: JobAlignmentSchema,
    loggingContext: { function: "generateJobAlignment" },
  });
}

// Generate question-level analysis
async function generateQuestionAnalysis(
  baseContext: string,
  questions: any[],
  _questionFeedback: any[],
  logger: Logger
): Promise<QuestionAnalysis[]> {
  const prompt = `${baseContext}

QUESTIONS ASKED:
${JSON.stringify(questions, null, 2)}

Provide detailed analysis for each question.

Score based on: relevance, depth, specificity, and alignment with role requirements.`;

  logger.info("Generating question analysis");

  const result = await generateObjectWithFallback({
    prompt,
    schema: QuestionsResponseSchema,
    loggingContext: { function: "generateQuestionAnalysis" },
  });

  return result.questions;
}

// GET endpoint - fetch existing analysis
export const GET = withAxiom(
  async (request: AxiomRequest, context: RouteContext) => {
    const logger = request.log.with({
      method: "GET",
      path: "/api/candidate-interviews/[interviewId]",
      interviewId: context.params.interviewId,
    });

    try {
      const { interviewId } = context.params;
      logger.info("Fetching interview analysis", { interviewId });

      const supabase = await createAdminClient();

      // Use the view to get complete analysis
      const { data: analysis, error } = await supabase
        .from("recruiter_interview_analysis_complete")
        .select("*")
        .eq("mock_interview_id", interviewId)
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
  async (request: AxiomRequest, context: RouteContext) => {
    const logger = request.log.with({
      method: "POST",
      path: "/api/candidate-interviews/[interviewId]",
      interviewId: context.params.interviewId,
    });

    try {
      const startTime = Date.now();
      const { interviewId } = context.params;
      logger.info("Processing interview analysis", { interviewId });

      const supabase = await createAdminClient();

      // Check if analysis already exists
      const { data: existingAnalysis } = await supabase
        .from("recruiter_interview_analysis")
        .select("id")
        .eq("mock_interview_id", interviewId)
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

      // First fetch the interview to get custom_job_id
      const interviewResult = await supabase
        .from("custom_job_mock_interviews")
        .select(
          `
          *,
          custom_jobs (
            id,
            job_title,
            job_description,
            company_name,
            company_description
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

      // Now fetch the rest of the data
      const [messagesResult, questionsResult, feedbackResult] =
        await Promise.all([
          supabase
            .from("mock_interview_messages")
            .select("*")
            .eq("mock_interview_id", interviewId)
            .order("created_at", { ascending: true }),

          supabase
            .from("custom_job_questions")
            .select("*")
            .eq("custom_job_id", interview.custom_job_id),

          supabase
            .from("mock_interview_question_feedback")
            .select("*")
            .eq("mock_interview_id", interviewId),
        ]);

      const messages = messagesResult.data || [];
      const questionsList = questionsResult.data || [];
      const questionFeedback = feedbackResult.data || [];

      // Create transcript
      const transcript = messages
        .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.text}`)
        .join("\n\n");

      const baseContext = createBaseContext(
        interview,
        transcript,
        questionFeedback
      );

      logger.info("Generating AI analysis", { interviewId });

      // Generate all analysis sections in parallel
      const [
        verdict,
        strengths,
        concerns,
        highlights,
        jobAlignment,
        questionAnalysis,
      ] = await Promise.all([
        generateHiringVerdict(baseContext, logger),
        generateStrengths(baseContext, logger),
        generateConcerns(baseContext, logger),
        generateHighlights(baseContext, logger),
        generateJobAlignment(baseContext, logger),
        generateQuestionAnalysis(
          baseContext,
          questionsList,
          questionFeedback,
          logger
        ),
      ]);

      // Start a transaction to insert all data
      logger.info("Saving analysis to database", { interviewId });

      // Insert main analysis
      const { data: savedAnalysis, error: saveError } = await supabase
        .from("recruiter_interview_analysis")
        .insert({
          mock_interview_id: interviewId,
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
            concerns.map((c, idx) => ({
              analysis_id: analysisId,
              title: c.title,
              description: c.description,
              evidence: c.evidence,
              impact: c.impact,
              severity: c.severity,
              display_order: idx,
            }))
          ),

        // Highlights
        highlights.length > 0 &&
          supabase.from("recruiter_interview_highlights").insert(
            highlights.map((h, idx) => ({
              analysis_id: analysisId,
              highlight_type: h.highlight_type,
              quote: h.quote,
              context: h.context,
              timestamp_seconds: h.timestamp_seconds,
              display_order: idx,
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
        questionAnalysis.length > 0 &&
          supabase.from("recruiter_question_analysis").insert(
            questionAnalysis.map((q, idx) => ({
              analysis_id: analysisId,
              question_id: q.question_id,
              question_text: q.question_text,
              answer_summary: q.answer_summary,
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
