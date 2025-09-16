"use server";

import {
  createSupabaseServerClient,
  createAdminClient,
} from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { redirect } from "next/navigation";
import { Enums, Tables } from "@/utils/supabase/database.types";
import { cache } from "react";
import type {
  TypedCodingInterviewAnalysis,
  TypedInterviewAnalysis,
} from "./types";
import { getTranslations } from "next-intl/server";
import { Logger } from "next-axiom";
import { revalidatePath } from "next/cache";

export type Candidate = Tables<"company_job_candidates"> & {
  candidateName: string | null;
  candidateEmail: string | null;
  candidatePhoneNumber: string | null;
  currentStage: Tables<"company_application_stages"> | null;
  aiInterviewCompletionOrder?: number | null;
};
export type Company = Tables<"companies">;
export type Job = Tables<"custom_jobs">;
export type ApplicationFile = Tables<"candidate_application_files"> & {
  user_file: Tables<"user_files"> & {
    signed_url?: string;
  };
};
export type CandidateJobInterview = Tables<"candidate_job_interviews">;
export type JobInterviewMessage = Tables<"candidate_job_interview_messages">;
export type InterviewAnalysis = TypedInterviewAnalysis;
export type CandidateJobInterviewRecording =
  Tables<"candidate_job_interview_recordings">;
export type CodingInterviewAnalysis = TypedCodingInterviewAnalysis;

export interface AccessValidation {
  company: Company;
  job: Job;
  membership: { role: string };
}

export interface CandidateData {
  candidate: Candidate;
  applicationFiles: ApplicationFile[];
  additionalInfo: Tables<"candidate_application_additional_info">[];
  aggregatedAnalysis: Tables<"candidate_aggregated_interview_analysis"> | null;
  jobAlignmentDetails: Tables<"candidate_job_alignment_details"> | null;
  interviewResults: {
    candidateJobInterview: CandidateJobInterview | null;
    jobInterviewRecording: CandidateJobInterviewRecording | null;
    jobInterviewMessages: JobInterviewMessage[];
    interviewAnalysis: InterviewAnalysis | null;
    interviewType: Enums<"job_interview_type">;
    codingInterviewAnalysis: CodingInterviewAnalysis | null;
    interviewTitle: String;
  }[];
}

export interface CandidateBasicData {
  candidate: Candidate;
  additionalInfo: Tables<"candidate_application_additional_info">[];
}

export interface CandidateImportantData {
  applicationFiles: ApplicationFile[];
  aggregatedAnalysis: Tables<"candidate_aggregated_interview_analysis"> | null;
  jobAlignmentDetails: Tables<"candidate_job_alignment_details"> | null;
}

export interface CandidateInterviewData {
  interviewResults: CandidateData["interviewResults"];
}

// Cache for 60 seconds to avoid repeated queries
export const validateAccess = cache(
  async (companyId: string, jobId: string): Promise<AccessValidation> => {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const user = await getServerUser();

    if (!user) {
      redirect("/sign-in");
    }

    // Check membership
    const { data: membership, error: memberError } = await supabase
      .from("company_members")
      .select("role")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      redirect("/recruiting");
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from("custom_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("company_id", companyId)
      .single();

    if (jobError || !job) {
      redirect("/recruiting");
    }

    // Fetch company details
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      redirect("/recruiting");
    }

    return { company, job, membership };
  }
);

export const getCandidateData = cache(
  async (candidateId: string): Promise<CandidateData | null> => {
    const log = new Logger().with({
      functionName: "getCandidateData",
      candidateId,
    });
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = await createAdminClient();
    const t = await getTranslations("apply.api.errors");

    // Fetch candidate data
    const { data: candidate, error: candidateError } = await supabase
      .from("company_job_candidates")
      .select(
        `
        *,
        currentStage:company_application_stages(*)
      `
      )
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      log.error("Error fetching candidate", { candidateError, candidateId });
      await log.flush();
      return null;
    }

    // Fetch user data using admin client
    let candidateName: string | null = null;
    let candidateEmail: string | null = null;
    let candidatePhoneNumber: string | null = null;

    if (candidate.candidate_user_id) {
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(candidate.candidate_user_id);

      if (userError) {
        log.error("Error fetching user data", {
          userError,
          candidateUserId: candidate.candidate_user_id,
        });
      } else if (userData && userData.user) {
        candidateEmail = userData.user.email || null;
        if (!candidateEmail) {
          throw new Error(t("candidateEmailNotFound"));
        }
        candidateName =
          userData.user.user_metadata?.display_name ||
          userData.user.user_metadata?.full_name ||
          null;
        candidatePhoneNumber =
          userData.user.user_metadata?.phone_number || null;
      }
    }

    // Fetch application files with user_files data
    const { data: applicationFiles, error: filesError } = await supabase
      .from("candidate_application_files")
      .select(
        `
        *,
        user_file:user_files(*)
      `
      )
      .eq("candidate_id", candidateId);

    if (filesError) {
      log.error("Error fetching application files", {
        filesError,
        candidateId,
      });
    }

    // Generate signed URLs for each file
    const filesWithUrls = await Promise.all(
      (applicationFiles || []).map(async (appFile) => {
        if (appFile.user_file) {
          const { data: signedUrlData } = await supabase.storage
            .from(appFile.user_file.bucket_name)
            .createSignedUrl(appFile.user_file.file_path, 3600); // 1 hour expiry
          return {
            ...appFile,
            user_file: {
              ...appFile.user_file,
              signed_url: signedUrlData?.signedUrl,
            },
          };
        }
        return appFile;
      })
    );

    log.info("Fetched application files with URLs", {
      filesCount: filesWithUrls.length,
    });

    // Fetch job interview data
    const { data: candidateJobInterviews, error: interviewError } =
      await supabase
        .from("candidate_job_interviews")
        .select(
          `*, job_interviews(interview_type, job_interview_questions(company_interview_question_bank(question)))`
        )
        .eq("candidate_id", candidateId);

    if (interviewError) {
      log.error("Error fetching job interview", {
        interviewError,
        candidateId,
      });
      throw interviewError;
    }

    let interviewResults: CandidateData["interviewResults"] = [];
    for (const candidateJobInterview of candidateJobInterviews) {
      const interviewType = candidateJobInterview.job_interviews.interview_type;
      // Fetch job interview recording if job interview exists
      let jobInterviewRecording = null;
      if (candidateJobInterview) {
        const { data: jobInterviewRecordingData, error: muxError } =
          await supabase
            .from("candidate_job_interview_recordings")
            .select("*")
            .eq("id", candidateJobInterview.id)
            .maybeSingle();

        if (muxError) {
          log.error("Error fetching job interview recording", {
            muxError,
            jobInterviewId: candidateJobInterview.id,
          });
        }
        jobInterviewRecording = jobInterviewRecordingData;
      }

      // Fetch job interview messages if job interview exists
      let jobInterviewMessages: JobInterviewMessage[] = [];
      if (candidateJobInterview) {
        const { data: messages, error: messagesError } = await supabase
          .from("candidate_job_interview_messages")
          .select("*")
          .eq("candidate_interview_id", candidateJobInterview.id)
          .order("created_at", { ascending: false });

        if (messagesError) {
          log.error("Error fetching job interview messages", {
            messagesError,
            jobInterviewId: candidateJobInterview.id,
          });
        } else {
          jobInterviewMessages = messages || [];
        }
      }

      // Fetch interview analysis if job interview exists
      let interviewAnalysis = null;
      if (candidateJobInterview) {
        const { data: analysis, error: analysisError } = await supabase
          .from("recruiter_interview_analysis_complete")
          .select("*")
          .eq("candidate_interview_id", candidateJobInterview.id)
          .maybeSingle();

        if (analysisError && analysisError.code !== "PGRST116") {
          log.error("Error fetching interview analysis", {
            analysisError,
            jobInterviewId: candidateJobInterview.id,
          });
        } else {
          interviewAnalysis = analysis as InterviewAnalysis;
        }
      }

      let codingInterviewAnalysis: CodingInterviewAnalysis | null = null;
      if (interviewType === "coding") {
        const { data: codingAnalysisData, error: codingAnalysisError } =
          await supabase
            .from("coding_interview_analysis_view")
            .select("*")
            .eq("candidate_interview_id", candidateJobInterview.id)
            .maybeSingle();

        if (codingAnalysisError) {
          log.error("Error fetching coding interview analysis", {
            codingAnalysisError,
            candidateInterviewId: candidateJobInterview.id,
          });
        } else if (codingAnalysisData) {
          codingInterviewAnalysis =
            codingAnalysisData as CodingInterviewAnalysis;
        }
      }

      let interviewTitle = "";
      const { data: interviewTitleData, error: interviewTitleError } =
        await supabase
          .from("job_interviews")
          .select("name")
          .eq("id", candidateJobInterview.interview_id)
          .single();

      if (interviewTitleError) {
        log.error("Error fetching interview title", {
          interviewTitleError,
          candidateInterviewId: candidateJobInterview.id,
        });
      } else {
        interviewTitle = interviewTitleData.name;
      }

      interviewResults.push({
        candidateJobInterview,
        jobInterviewRecording,
        jobInterviewMessages,
        interviewAnalysis,
        interviewType: candidateJobInterview.job_interviews.interview_type,
        codingInterviewAnalysis,
        interviewTitle,
      });
    }

    // Fetch aggregated analysis for the candidate
    const { data: aggregatedAnalysis, error: aggregatedError } = await supabase
      .from("candidate_aggregated_interview_analysis")
      .select("*")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (aggregatedError && aggregatedError.code !== "PGRST116") {
      log.error("Error fetching aggregated analysis", {
        aggregatedError,
        candidateId,
      });
    }

    log.info("Fetched aggregated analysis", {
      candidateId,
      hasAggregatedAnalysis: !!aggregatedAnalysis,
      verdict: aggregatedAnalysis?.hiring_verdict,
    });

    // Fetch job alignment details for the candidate
    const { data: jobAlignmentDetails, error: alignmentError } = await supabase
      .from("candidate_job_alignment_details")
      .select("*")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (alignmentError) {
      log.error("Error fetching job alignment details", {
        alignmentError,
        candidateId,
      });
    }

    log.info("Fetched job alignment details", {
      candidateId,
      hasJobAlignmentDetails: !!jobAlignmentDetails,
      alignmentScore: jobAlignmentDetails?.alignment_score,
    });

    // Fetch additional info for the candidate
    const { data: additionalInfo, error: additionalInfoError } = await supabase
      .from("candidate_application_additional_info")
      .select("*")
      .eq("candidate_id", candidateId);

    if (additionalInfoError) {
      log.error("Error fetching additional info", {
        additionalInfoError,
        candidateId,
      });
    }

    await log.flush();
    return {
      candidate: {
        ...candidate,
        candidateName,
        candidateEmail,
        candidatePhoneNumber,
        currentStage: candidate.currentStage || null,
      },
      applicationFiles: filesWithUrls as ApplicationFile[],
      additionalInfo: additionalInfo || [],
      aggregatedAnalysis,
      jobAlignmentDetails,
      interviewResults,
    };
  }
);

// Paginated function to fetch candidates - designed for useSWRInfinite
export async function getCandidates(
  companyId: string,
  jobId: string,
  offset: number,
  limit: number = 10,
  stageIds?: string[]
): Promise<Candidate[]> {
  const log = new Logger().with({
    functionName: "getCandidates",
    companyId,
    jobId,
    offset,
    limit,
    stageIds,
  });

  // Validate inputs
  if (!companyId || !jobId) {
    log.error("Invalid parameters", { companyId, jobId });
    await log.flush();
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = await createAdminClient();

  try {
    let query = supabase
      .from("company_job_candidates")
      .select(
        `
        id,
        applied_at,
        candidate_user_id,
        current_stage_id,
        company_id,
        created_at,
        custom_job_id,
        updated_at,
        ai_interview_completion_order,
        currentStage:company_application_stages(*)
      `
      )
      .eq("custom_job_id", jobId)
      .eq("company_id", companyId);

    // Apply stage filtering if stageIds are provided
    if (stageIds && stageIds.length > 0) {
      query = query.in("current_stage_id", stageIds);
    }

    // Use range for pagination - this is the key for useSWRInfinite
    const { data, error } = await query
      .order("applied_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      log.error("Error fetching candidates", { error });
      await log.flush();
      throw error; // Throw error to trigger SWR error handling
    }

    // Return empty array if no data - this signals end of pagination
    if (!data || data.length === 0) {
      log.info("No more candidates found", { offset, limit });
      await log.flush();
      return [];
    }

    log.info("Fetched candidates page", {
      offset,
      limit,
      returned: data.length,
      hasMore: data.length === limit,
    });

    // Fetch user data for each candidate (only name and email needed for UI)
    const candidatesWithUserData = await Promise.all(
      data.map(async (candidate) => {
        let candidateName: string | null = null;
        let candidateEmail: string | null = null;

        if (candidate.candidate_user_id) {
          try {
            const { data: userData, error: userError } =
              await supabaseAdmin.auth.admin.getUserById(
                candidate.candidate_user_id
              );

            if (userError) {
              log.error("Error fetching user data", {
                userError,
                candidateUserId: candidate.candidate_user_id,
              });
            } else if (userData?.user) {
              if (userData.user.is_anonymous) {
                return null;
              }
              candidateEmail = userData.user.email || null;
              candidateName =
                userData.user.user_metadata?.display_name ||
                userData.user.user_metadata?.full_name ||
                null;
            }
          } catch (userFetchError) {
            log.error("Exception fetching user data", {
              error: userFetchError,
              candidateUserId: candidate.candidate_user_id,
            });
          }
        }

        return {
          ...candidate,
          candidateName,
          candidateEmail,
          candidatePhoneNumber: null, // Not used in UI
          currentStage: candidate.currentStage || null,
          aiInterviewCompletionOrder:
            candidate.ai_interview_completion_order || null,
        } as Candidate;
      })
    );

    await log.flush();
    return candidatesWithUserData.filter((candidate) => candidate !== null);
  } catch (error) {
    log.error("Exception in getCandidates", { error });
    await log.flush();
    throw error;
  }
}

export const isCompanyPremium = async (companyId: string) => {
  const log = new Logger().with({
    functionName: "isCompanyPremium",
    companyId,
  });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recruiting_subscriptions")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    log.error("Error fetching company premium status", { error });
    await log.flush();
    return false;
  }

  return !!data;
};

// Optimized function to get basic candidate data for immediate display
export const getCandidateBasicData = cache(
  async (candidateId: string): Promise<CandidateBasicData | null> => {
    const log = new Logger().with({
      functionName: "getCandidateBasicData",
      candidateId,
    });
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = await createAdminClient();
    const t = await getTranslations("apply.api.errors");

    // Fetch candidate with current stage in a single query
    const { data: candidate, error: candidateError } = await supabase
      .from("company_job_candidates")
      .select(
        `
        *,
        currentStage:company_application_stages(*)
      `
      )
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      log.error("Error fetching candidate", { candidateError, candidateId });
      await log.flush();
      return null;
    }

    // Fetch user data and additional info in parallel
    const [userDataResult, additionalInfoResult] = await Promise.all([
      // Fetch user data
      candidate.candidate_user_id
        ? supabaseAdmin.auth.admin.getUserById(candidate.candidate_user_id)
        : Promise.resolve({ data: null, error: null }),
      // Fetch additional info
      supabase
        .from("candidate_application_additional_info")
        .select("*")
        .eq("candidate_id", candidateId),
    ]);

    let candidateName: string | null = null;
    let candidateEmail: string | null = null;
    let candidatePhoneNumber: string | null = null;

    if (userDataResult.data?.user) {
      const user = userDataResult.data.user;
      candidateEmail = user.email || null;
      if (!candidateEmail) {
        throw new Error(t("candidateEmailNotFound"));
      }
      candidateName =
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        null;
      candidatePhoneNumber = user.user_metadata?.phone_number || null;
    }

    await log.flush();
    return {
      candidate: {
        ...candidate,
        candidateName,
        candidateEmail,
        candidatePhoneNumber,
        currentStage: candidate.currentStage || null,
      },
      additionalInfo: additionalInfoResult.data || [],
    };
  }
);

// Function to get important data like files and aggregated analysis
export const getCandidateImportantData = cache(
  async (candidateId: string): Promise<CandidateImportantData | null> => {
    const log = new Logger().with({
      functionName: "getCandidateImportantData",
      candidateId,
    });
    const supabase = await createSupabaseServerClient();

    // Fetch all important data in parallel
    const [filesResult, aggregatedResult, alignmentResult] = await Promise.all([
      // Application files
      supabase
        .from("candidate_application_files")
        .select(
          `
          *,
          user_file:user_files(*)
        `
        )
        .eq("candidate_id", candidateId),
      // Aggregated analysis
      supabase
        .from("candidate_aggregated_interview_analysis")
        .select("*")
        .eq("candidate_id", candidateId)
        .maybeSingle(),
      // Job alignment details
      supabase
        .from("candidate_job_alignment_details")
        .select("*")
        .eq("candidate_id", candidateId)
        .maybeSingle(),
    ]);

    if (filesResult.error) {
      log.error("Error fetching application files", {
        error: filesResult.error,
        candidateId,
      });
    }

    if (aggregatedResult.error && aggregatedResult.error.code !== "PGRST116") {
      log.error("Error fetching aggregated analysis", {
        error: aggregatedResult.error,
        candidateId,
      });
    }

    if (alignmentResult.error && alignmentResult.error.code !== "PGRST116") {
      log.error("Error fetching alignment details", {
        error: alignmentResult.error,
        candidateId,
      });
    }

    // Generate signed URLs for files in parallel
    const filesWithUrls = await Promise.all(
      (filesResult.data || []).map(async (appFile) => {
        if (appFile.user_file) {
          const { data: signedUrlData } = await supabase.storage
            .from(appFile.user_file.bucket_name)
            .createSignedUrl(appFile.user_file.file_path, 3600); // 1 hour expiry
          return {
            ...appFile,
            user_file: {
              ...appFile.user_file,
              signed_url: signedUrlData?.signedUrl,
            },
          };
        }
        return appFile;
      })
    );

    await log.flush();
    return {
      applicationFiles: filesWithUrls as ApplicationFile[],
      aggregatedAnalysis: aggregatedResult.data,
      jobAlignmentDetails: alignmentResult.data,
    };
  }
);

// Function to get interview data - called lazily when needed
export const getCandidateInterviewData = cache(
  async (candidateId: string): Promise<CandidateInterviewData | null> => {
    const log = new Logger().with({
      functionName: "getCandidateInterviewData",
      candidateId,
    });
    const supabase = await createSupabaseServerClient();

    // Fetch job interviews
    const { data: candidateJobInterviews, error: interviewError } =
      await supabase
        .from("candidate_job_interviews")
        .select(
          `*, job_interviews(interview_type, job_interview_questions(company_interview_question_bank(question)))`
        )
        .eq("candidate_id", candidateId);

    if (interviewError) {
      log.error("Error fetching job interviews", {
        interviewError,
        candidateId,
      });
      return { interviewResults: [] };
    }

    // Process each interview in parallel
    const interviewResults = await Promise.all(
      (candidateJobInterviews || []).map(async (candidateJobInterview) => {
        const interviewType =
          candidateJobInterview.job_interviews.interview_type;

        // Fetch all interview-related data in parallel
        const [
          recordingResult,
          messagesResult,
          analysisResult,
          codingAnalysisResult,
          titleResult,
        ] = await Promise.all([
          // Recording
          supabase
            .from("candidate_job_interview_recordings")
            .select("*")
            .eq("id", candidateJobInterview.id)
            .maybeSingle(),
          // Messages
          supabase
            .from("candidate_job_interview_messages")
            .select("*")
            .eq("candidate_interview_id", candidateJobInterview.id)
            .order("created_at", { ascending: false }),
          // Interview analysis
          supabase
            .from("recruiter_interview_analysis_complete")
            .select("*")
            .eq("candidate_interview_id", candidateJobInterview.id)
            .maybeSingle(),
          // Coding analysis (only if coding interview)
          interviewType === "coding"
            ? supabase
                .from("coding_interview_analysis_view")
                .select("*")
                .eq("candidate_interview_id", candidateJobInterview.id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          // Interview title
          supabase
            .from("job_interviews")
            .select("name")
            .eq("id", candidateJobInterview.interview_id)
            .single(),
        ]);

        return {
          candidateJobInterview,
          jobInterviewRecording: recordingResult.data,
          jobInterviewMessages: messagesResult.data || [],
          interviewAnalysis: analysisResult.data as InterviewAnalysis | null,
          interviewType,
          codingInterviewAnalysis: codingAnalysisResult.data as
            | CodingInterviewAnalysis
            | null,
          interviewTitle: titleResult.data?.name || "",
        };
      })
    );

    await log.flush();
    return { interviewResults };
  }
);

export const getCompanyCandidateCount = async (companyId: string) => {
  const log = new Logger().with({
    functionName: "getCompanyCandidateCount",
    companyId,
  });
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("company_job_candidates")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (error) {
    log.error("Failed to get company candidate count", error);
    throw error;
  }

  return count || 0;
};

export const getJobInterviewCount = async (jobId: string) => {
  const log = new Logger().with({
    functionName: "getJobInterviewCount",
    jobId,
  });
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("job_interviews")
    .select("*", { count: "exact", head: true })
    .eq("custom_job_id", jobId);

  if (error) {
    log.error("Failed to get job interview count", error);
    return 0;
  }

  return count || 0;
};

export const getCompanyStages = cache(
  async (
    companyId: string
  ): Promise<Tables<"company_application_stages">[]> => {
    const log = new Logger().with({
      functionName: "getCompanyStages",
      companyId,
    });
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("company_application_stages")
      .select("*")
      .eq("company_id", companyId)
      .order("order_index", { ascending: true });

    if (error) {
      log.error("Error fetching company stages", { error });
      await log.flush();
      return [];
    }

    await log.flush();
    return data || [];
  }
);

export const updateCandidateStage = async (
  candidateId: string,
  stageId: string | null
): Promise<void> => {
  const log = new Logger().with({
    functionName: "updateCandidateStage",
    candidateId,
    stageId,
  });
  const supabase = await createSupabaseServerClient();

  // Verify user has access to this candidate
  const user = await getServerUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Get candidate details to verify company membership
  const { data: candidate, error: candidateError } = await supabase
    .from("company_job_candidates")
    .select("company_id, custom_job_id")
    .eq("id", candidateId)
    .single();

  if (candidateError || !candidate) {
    log.error("Error fetching candidate", { candidateError, candidateId });
    await log.flush();
    throw new Error("Candidate not found");
  }

  // Check membership
  const { data: membership, error: memberError } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", candidate.company_id)
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) {
    log.error("Error verifying membership", { memberError });
    await log.flush();
    throw new Error("Access denied");
  }

  // Update candidate stage
  const { error: updateError } = await supabase
    .from("company_job_candidates")
    .update({ current_stage_id: stageId })
    .eq("id", candidateId);

  if (updateError) {
    log.error("Error updating candidate stage", { updateError });
    await log.flush();
    throw updateError;
  }

  log.info("Successfully updated candidate stage", {
    candidateId,
    newStageId: stageId,
  });
  await log.flush();
  revalidatePath(
    `/recruiting/companies/${candidate.company_id}/jobs/${candidate.custom_job_id}/candidates`
  );
};
