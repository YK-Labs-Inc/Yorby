import {
  createAdminClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import {
  generateObjectWithFallback,
  fetchFilesFromGemini,
  GeminiFile,
} from "@/utils/ai/gemini";
import { z } from "zod";
import { Tables } from "@/utils/supabase/database.types";
import Stripe from "stripe";

// Zod schema for the aggregated verdict
const AggregatedVerdictSchema = z.object({
  overall_score: z.number().int().min(0).max(100),
  hiring_verdict: z.enum(["ADVANCE", "REJECT", "BORDERLINE"]),
  verdict_rationale: z.string(),
});

type AggregatedVerdict = z.infer<typeof AggregatedVerdictSchema>;

// Helper function to generate aggregated hiring verdict
async function generateAggregatedHiringVerdict(
  candidateData: {
    candidate: Tables<"company_job_candidates">;
    job: Tables<"custom_jobs">;
    interviewRounds: Array<{
      roundName: string;
      interviewType: "general" | "coding";
      analysis: Tables<"recruiter_interview_analysis">;
      strengths: Tables<"recruiter_interview_strengths">[];
      concerns: Tables<"recruiter_interview_concerns">[];
    }>;
    jobAlignment: CandidateJobAlignment | null;
  },
  logger: Logger
): Promise<AggregatedVerdict> {
  const prompt = `
## CANDIDATE CONTEXT
Job Title: ${candidateData.job.job_title}
Company: ${candidateData.job.company_name || "N/A"}
Job Description: ${candidateData.job.job_description || "N/A"}

## JOB REQUIREMENT ALIGNMENT
${
  candidateData.jobAlignment
    ? `
Alignment Score: ${candidateData.jobAlignment.alignment_score}/100

Matched Requirements (${candidateData.jobAlignment.matched_requirements?.length || 0}):
${candidateData.jobAlignment.matched_requirements?.map((req) => `- ${req}`).join("\n") || "- None identified"}

Missing Requirements (${candidateData.jobAlignment.missing_requirements?.length || 0}):
${candidateData.jobAlignment.missing_requirements?.map((req) => `- ${req}`).join("\n") || "- None identified"}

Exceeded Requirements (${candidateData.jobAlignment.exceeded_requirements?.length || 0}):
${candidateData.jobAlignment.exceeded_requirements?.map((req) => `- ${req}`).join("\n") || "- None identified"}
`
    : "Job alignment analysis not available"
}

## INTERVIEW ROUNDS COMPLETED (${candidateData.interviewRounds.length} total)
${candidateData.interviewRounds
  .map(
    (round, i) => `
### Round ${i + 1}: ${round.roundName} (${round.interviewType})
- Verdict: ${round.analysis.hiring_verdict}
- Score: ${round.analysis.overall_match_score}/100
- Summary: ${round.analysis.verdict_summary}

Key Strengths:
${round.strengths.map((s) => `- ${s.title}: ${s.evidence}`).join("\n")}

Key Concerns:
${
  round.concerns.length > 0
    ? round.concerns.map((c) => `- ${c.title}: ${c.description}`).join("\n")
    : "- No major concerns"
}
`
  )
  .join("\n")}

## YOUR TASK
Based on the job alignment analysis AND all interview rounds, provide a FINAL hiring recommendation that considers:

1. **Job Requirement Fit**:
   - How well does the candidate meet the specific job requirements?
   - Are the missing requirements critical or trainable?
   - Do the exceeded requirements add significant value?
   - Consider the alignment score as a baseline indicator

2. **Overall Performance Pattern**: 
   - Is there consistency across rounds or significant variation?
   - Did the candidate improve/decline between rounds?
   - Are strengths consistent or isolated to specific rounds?
   - Do interview performances validate the alignment assessment?

3. **Critical Assessment Areas**:
   - Technical competence (especially from coding rounds)
   - Communication and behavioral fit (from general rounds)
   - Problem-solving approach and learning ability
   - Cultural fit and collaboration potential

4. **Weighting Considerations**:
   - Technical/coding rounds should generally carry more weight for technical roles
   - Behavioral rounds are crucial for leadership/senior positions
   - Job alignment score should heavily influence the decision
   - Consider the specific requirements of THIS job

5. **Red Flags vs Minor Issues**:
   - Distinguish between fundamental gaps and areas that can be coached
   - Consider if concerns are consistent across rounds or isolated incidents
   - Evaluate if missing requirements are deal-breakers or manageable gaps

## FINAL VERDICT GUIDELINES

**ADVANCE (Recommend Hire)**:
- Strong performance across most/all rounds
- Any weaknesses are minor and coachable
- Clear evidence they can succeed in the role
- Score typically 70-100

**BORDERLINE (Needs Discussion)**:
- Mixed signals across rounds
- Some strong areas but also significant concerns
- Could succeed with right support/team fit
- Score typically 50-70

**REJECT (Do Not Hire)**:
- Consistent weaknesses across multiple rounds
- Critical skill gaps for the role
- Behavioral/cultural red flags
- Score typically 0-50

Provide:
1. overall_score: Weighted average considering all rounds (0-100, must be an INTEGER)
2. hiring_verdict: ADVANCE, REJECT, or BORDERLINE
3. verdict_rationale: 2-3 paragraph explanation covering:
   - Summary of performance across all rounds
   - Key strengths that support the decision
   - Any concerns and whether they're manageable
   - Final recommendation with confidence level`;

  logger.info("Generating aggregated hiring verdict", {
    candidateId: candidateData.candidate.id,
    roundCount: candidateData.interviewRounds.length,
  });

  return await generateObjectWithFallback({
    prompt,
    schema: AggregatedVerdictSchema,
    loggingContext: { function: "generateAggregatedHiringVerdict" },
  });
}

// Zod schema for job alignment details
const CandidateJobAlignmentSchema = z.object({
  alignment_score: z.number().int().min(0).max(100),
  matched_requirements: z.array(z.string()).nullable(),
  missing_requirements: z.array(z.string()).nullable(),
  exceeded_requirements: z.array(z.string()).nullable(),
});

type CandidateJobAlignment = z.infer<typeof CandidateJobAlignmentSchema>;

const generateAggregateCandidateJobAlignment = async (
  candidate: Tables<"company_job_candidates"> & {
    custom_jobs: Tables<"custom_jobs">;
  },
  logger: Logger
): Promise<CandidateJobAlignment | null> => {
  const startTime = Date.now();
  const candidateId = candidate.id;
  logger.info("Starting candidate job alignment generation", {
    candidateId,
  });
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = await createAdminClient();

  const job = candidate.custom_jobs;
  logger.info("Fetched job details", {
    jobId: job.id,
    jobTitle: job.job_title,
  });

  // 2. Fetch the user's candidate application files
  const { data: applicationFiles, error: filesError } = await supabase
    .from("candidate_application_files")
    .select(
      `
      *,
      user_files!inner (
        id,
        display_name,
        google_file_name,
        google_file_uri,
        mime_type,
        file_path,
        bucket_name
      )
    `
    )
    .eq("candidate_id", candidateId);

  if (filesError) {
    logger.error("Failed to fetch application files", {
      candidateId,
      error: filesError,
    });
    return null;
  }

  // Prepare files for Gemini
  let geminiFiles: GeminiFile[] = [];
  if (applicationFiles && applicationFiles.length > 0) {
    const fileEntries = applicationFiles.map((af) => ({
      id: af.user_files.id,
      supabaseBucketName: af.user_files.bucket_name,
      supabaseFilePath: af.user_files.file_path,
      supabaseTableName: "user_files",
      googleFileUri: af.user_files.google_file_uri,
      googleFileName: af.user_files.google_file_name,
      mimeType: af.user_files.mime_type,
    }));

    try {
      geminiFiles = await fetchFilesFromGemini({ files: fileEntries });
      logger.info("Fetched Gemini file references", {
        fileCount: geminiFiles.length,
      });
    } catch (error) {
      logger.error("Failed to fetch Gemini files", { error });
    }
  }

  // 3. Fetch interview transcripts from all rounds
  const { data: interviews, error: interviewsError } = await supabase
    .from("candidate_job_interviews")
    .select(
      `
      id,
      status,
      candidate_job_interview_messages (
        text,
        role
      ),
      job_interviews!inner (
        name,
        interview_type
      )
    `
    )
    .eq("candidate_id", candidateId)
    .eq("status", "completed");

  if (interviewsError) {
    logger.error("Failed to fetch interviews", {
      candidateId,
      error: interviewsError,
    });
  }

  // Compile interview transcripts
  let interviewTranscripts = "";
  if (interviews && interviews.length > 0) {
    interviewTranscripts = interviews
      .map((interview) => {
        const messages = interview.candidate_job_interview_messages || [];
        const transcript = messages
          .map(
            (msg) =>
              `${msg.role === "user" ? "Candidate" : "Interviewer"}: ${msg.text}`
          )
          .join("\n");

        return `
### Interview Round: ${interview.job_interviews.name} (${interview.job_interviews.interview_type})
${transcript}
`;
      })
      .join("\n\n");
  }

  // 4. Generate the job alignment evaluation using LLM
  const prompt = `
## JOB DETAILS
Job Title: ${job.job_title}
Company: ${job.company_name || "N/A"}
Company Description: ${job.company_description || "N/A"}

## JOB DESCRIPTION
${job.job_description || "No job description provided"}

## CANDIDATE MATERIALS
${geminiFiles.length > 0 ? `The candidate has submitted ${geminiFiles.length} application file(s) (resume, portfolio, etc.)` : "No application files submitted"}

## INTERVIEW PERFORMANCE
${interviewTranscripts || "No interview transcripts available"}

## YOUR TASK
Analyze how well this candidate aligns with the job requirements based on:
1. Their submitted application materials (resume, portfolio, etc.)
2. Their interview performance and responses
3. The specific requirements mentioned in the job description

Provide a detailed breakdown of:

**alignment_score**: An integer score from 0 to 100 representing how well the candidate aligns with the job requirements:
- 90-100: Exceptional match - meets all critical requirements and exceeds many
- 70-89: Strong match - meets most critical requirements with some gaps
- 50-69: Moderate match - meets some requirements but has notable gaps
- 30-49: Weak match - missing many critical requirements
- 0-29: Poor match - lacks most fundamental requirements

**matched_requirements**: List specific requirements from the job description that the candidate clearly meets or demonstrates. Be specific and cite evidence from their materials or interviews.

**missing_requirements**: List specific requirements from the job description that the candidate lacks or hasn't demonstrated. Focus on critical gaps that would impact their ability to perform the role.

**exceeded_requirements**: List areas where the candidate brings additional valuable skills, experience, or qualifications beyond what was requested in the job description.

For each requirement item, be specific and reference the job description requirements directly. Each item should be a complete sentence explaining the requirement and how the candidate meets/lacks/exceeds it.

Example format for requirements:
- "Strong Python programming skills - demonstrated through 5 years of Python development experience at TechCorp"
- "Experience with cloud platforms - candidate lacks hands-on AWS/GCP experience mentioned in requirements"
- "Leadership experience - candidate brings team management experience not required for this IC role"
`;

  // Include Gemini files in the prompt if available
  const messages =
    geminiFiles.length > 0
      ? [
          {
            role: "user" as const,
            content: [
              { type: "text" as const, text: prompt },
              ...geminiFiles.map((file) => ({
                type: "file" as const,
                data: file.fileData.fileUri,
                mimeType: file.fileData.mimeType,
              })),
            ],
          },
        ]
      : undefined;

  logger.info("Generating job alignment analysis with LLM", {
    candidateId,
    hasFiles: geminiFiles.length > 0,
    hasTranscripts: !!interviewTranscripts,
  });

  const alignment = await generateObjectWithFallback(
    messages
      ? {
          messages,
          schema: CandidateJobAlignmentSchema,
          loggingContext: {
            function: "generateAggregateCandidateJobAlignment",
            candidateId,
          },
        }
      : {
          prompt,
          schema: CandidateJobAlignmentSchema,
          loggingContext: {
            function: "generateAggregateCandidateJobAlignment",
            candidateId,
          },
        }
  );

  // 5. Save to database
  logger.info("Saving job alignment details to database", { candidateId });

  const { error: insertError } = await supabaseAdmin
    .from("candidate_job_alignment_details")
    .insert({
      candidate_id: candidateId,
      alignment_score: alignment.alignment_score,
      matched_requirements: alignment.matched_requirements,
      missing_requirements: alignment.missing_requirements,
      exceeded_requirements: alignment.exceeded_requirements,
    });

  if (insertError) {
    logger.error("Failed to save job alignment details", {
      candidateId,
      error: insertError,
    });
    throw insertError;
  }

  const processingTime = Date.now() - startTime;
  logger.info("Job alignment analysis complete", {
    candidateId,
    alignmentScore: alignment.alignment_score,
    processingTimeMs: processingTime,
  });

  return alignment;
};

export const generateAggregatedAnalysis = async (candidateId: string) => {
  const logger = new Logger().with({
    function: "generateAggregatedAnalysis",
    candidateId,
  });

  try {
    const startTime = Date.now();
    logger.info("Generating aggregated analysis", { candidateId });

    const supabase = await createAdminClient();

    // Check if analysis already exists
    const { data: existingAnalysis } = await supabase
      .from("candidate_aggregated_interview_analysis")
      .select("id")
      .eq("candidate_id", candidateId)
      .single();

    if (existingAnalysis) {
      logger.warn("Aggregated analysis already exists", {
        candidateId,
        analysisId: existingAnalysis.id,
      });
      return;
    }

    // Fetch candidate and job information
    const { data: candidate, error: candidateError } = await supabase
      .from("company_job_candidates")
      .select(
        `
          *,
          custom_jobs!inner (*)
        `
      )
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      logger.error("Candidate not found", {
        candidateId,
        error: candidateError,
      });
      return;
    }

    // Fetch all interview rounds for this candidate
    const { data: interviews, error: interviewsError } = await supabase
      .from("candidate_job_interviews")
      .select(
        `
          *,
          job_interviews!inner (
            id,
            name,
            interview_type,
            order_index
          )
        `
      )
      .eq("candidate_id", candidateId)
      .order("job_interviews(order_index)", { ascending: true });

    if (interviewsError || !interviews || interviews.length === 0) {
      logger.error("No interviews found for candidate", {
        candidateId,
        error: interviewsError,
      });
      return;
    }

    // Check if all interviews are completed
    const incompleteInterviews = interviews.filter(
      (i) => i.status !== "completed"
    );
    if (incompleteInterviews.length > 0) {
      logger.warn("Not all interviews completed", {
        candidateId,
        incompleteCount: incompleteInterviews.length,
      });
      return;
    }

    // Fetch analysis for each completed interview
    const interviewRounds = await Promise.all(
      interviews.map(async (interview) => {
        // Fetch the analysis
        const { data: analysis } = await supabase
          .from("recruiter_interview_analysis")
          .select("*")
          .eq("candidate_interview_id", interview.id)
          .single();

        if (!analysis) {
          logger.warn("No analysis found for interview", {
            candidateInterviewId: interview.id,
          });
          return null;
        }

        // Fetch strengths and concerns
        const [{ data: strengths }, { data: concerns }] = await Promise.all([
          supabase
            .from("recruiter_interview_strengths")
            .select("*")
            .eq("analysis_id", analysis.id)
            .order("display_order", { ascending: true }),
          supabase
            .from("recruiter_interview_concerns")
            .select("*")
            .eq("analysis_id", analysis.id),
        ]);

        return {
          roundName: interview.job_interviews.name,
          interviewType: interview.job_interviews.interview_type,
          analysis,
          strengths: strengths || [],
          concerns: concerns || [],
        };
      })
    );

    // Filter out any null rounds (where analysis wasn't found)
    const validRounds = interviewRounds.filter((r) => r !== null);

    if (validRounds.length === 0) {
      logger.error("No valid interview analyses found", { candidateId });
      return;
    }

    // First, generate job alignment details
    logger.info("Generating job alignment details", { candidateId });
    let jobAlignment = await generateAggregateCandidateJobAlignment(
      candidate,
      logger
    );
    logger.info("Job alignment details generated successfully", {
      candidateId,
      alignmentScore: jobAlignment?.alignment_score,
    });

    // Generate the aggregated verdict with job alignment data
    logger.info("Generating AI aggregated verdict", {
      candidateId,
      roundCount: validRounds.length,
      hasAlignmentData: !!jobAlignment,
    });

    const aggregatedVerdict = await generateAggregatedHiringVerdict(
      {
        candidate,
        job: candidate.custom_jobs,
        interviewRounds: validRounds,
        jobAlignment,
      },
      logger
    );

    // Save the aggregated analysis
    logger.info("Saving aggregated analysis to database", { candidateId });

    const { error: saveError } = await supabase
      .from("candidate_aggregated_interview_analysis")
      .insert({
        candidate_id: candidateId,
        overall_score: aggregatedVerdict.overall_score,
        hiring_verdict: aggregatedVerdict.hiring_verdict,
        verdict_rationale: aggregatedVerdict.verdict_rationale,
      });

    if (saveError) {
      logger.error("Failed to save aggregated analysis", {
        candidateId,
        error: saveError,
      });
      return;
    }

    const processingTime = Date.now() - startTime;
    logger.info("Aggregated analysis complete", {
      candidateId,
      processingTimeMs: processingTime,
    });
    await processInterviewWithStripe(candidateId);
    return;
  } catch (error) {
    logger.error("Error generating aggregated analysis", { error });
    return;
  }
};

const processInterviewWithStripe = async (candidateId: string) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  });
  const logger = new Logger().with({
    function: "processInterviewWithStripe",
    candidateId,
  });
  const supabase = await createAdminClient();
  
  const { data: candidate, error: candidateError } = await supabase
    .from("company_job_candidates")
    .select("company_id")
    .eq("id", candidateId)
    .single();
  if (candidateError || !candidate) {
    logger.error("Candidate not found", { candidateId, error: candidateError });
    throw new Error("Candidate not found");
  }

  const { data: company, error: companyError } = await supabase
    .from("recruiting_subscriptions")
    .select("stripe_customer_id")
    .eq("company_id", candidate.company_id)
    .single();
  if (companyError || !company || !company.stripe_customer_id) {
    logger.error("Company not found", {
      companyId: candidate.company_id,
      error: companyError,
    });
    throw new Error("Company not found");
  }

  // Get current metered usage count
  const { data: meteredUsage, error: usageError } = await supabase
    .from("recruiting_subscriptions_metered_usage")
    .select("count")
    .eq("company_id", candidate.company_id)
    .maybeSingle();

  if (usageError) {
    logger.error("Failed to query metered usage", {
      companyId: candidate.company_id,
      error: usageError,
    });
    throw new Error("Failed to query metered usage");
  }

  const currentCount = meteredUsage?.count || 0;
  const newCount = currentCount + 1;

  // Update the metered usage count (increment by 1)
  const { error: upsertError } = await supabase
    .from("recruiting_subscriptions_metered_usage")
    .upsert({
      company_id: candidate.company_id,
      count: newCount
    }, {
      onConflict: "company_id"
    });

  if (upsertError) {
    logger.error("Failed to update metered usage count", {
      companyId: candidate.company_id,
      error: upsertError,
    });
    throw new Error("Failed to update metered usage count");
  }

  logger.info("Updated metered usage count", {
    companyId: candidate.company_id,
    previousCount: currentCount,
    newCount: newCount,
  });

  // Only send Stripe metered event if count exceeds 200
  if (newCount > 200) {
    await stripe.billing.meterEvents.create({
      event_name: "completed_candidate_interviews",
      payload: {
        stripe_customer_id: company.stripe_customer_id,
      },
    });

    logger.info("Sent Stripe metered event", {
      companyId: candidate.company_id,
      stripeCustomerId: company.stripe_customer_id,
      interviewCount: newCount,
    });
  } else {
    logger.info("Interview within base plan limit", {
      companyId: candidate.company_id,
      interviewCount: newCount,
      baseLimit: 200,
    });
  }
};
