"use server";

import {
  createSupabaseServerClient,
  createAdminClient,
} from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Enums, Tables } from "@/utils/supabase/database.types";
import { cache } from "react";
import type {
  TypedCodingInterviewAnalysis,
  TypedInterviewAnalysis,
} from "./types";
import { getTranslations } from "next-intl/server";
import { Logger } from "next-axiom";

export type Candidate = Tables<"company_job_candidates"> & {
  candidateName: string | null;
  candidateEmail: string | null;
  candidatePhoneNumber: string | null;
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
  interviewResults: {
    candidateJobInterview: CandidateJobInterview | null;
    jobInterviewRecording: CandidateJobInterviewRecording | null;
    jobInterviewMessages: JobInterviewMessage[];
    interviewAnalysis: InterviewAnalysis | null;
    interviewType: Enums<"job_interview_type">;
    codingInterviewAnalysis: CodingInterviewAnalysis | null;
  }[];
}

// Cache for 60 seconds to avoid repeated queries
export const validateAccess = cache(
  async (companyId: string, jobId: string): Promise<AccessValidation> => {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

export const getInitialCandidates = cache(
  async (
    companyId: string,
    jobId: string,
    limit: number = 10
  ): Promise<Candidate[]> => {
    const log = new Logger().with({
      functionName: "getInitialCandidates",
      companyId,
      jobId,
      limit,
    });
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = await createAdminClient();

    const { data, error } = await supabase
      .from("company_job_candidates")
      .select("*")
      .eq("custom_job_id", jobId)
      .eq("company_id", companyId)
      .order("applied_at", { ascending: false })
      .limit(limit);

    if (error) {
      log.error("Error fetching candidates", { error });
      await log.flush();
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch user data for each candidate
    const candidatesWithUserData = (
      await Promise.all(
        data.map(async (candidate) => {
          // Fetch candidate's interviews
          const { data: candidateInterviews, error: candidateInterviewsError } =
            await supabase
              .from("candidate_job_interviews")
              .select("*")
              .eq("candidate_id", candidate.id);

          if (candidateInterviewsError) {
            log.error("Error fetching candidate interviews", {
              error: candidateInterviewsError,
              candidateId: candidate.id,
            });
          }

          // Check if candidate has completed all interviews
          const hasCompletedAllInterviews = candidateInterviews?.every(
            (interview) => interview.status === "completed"
          );
          if (!hasCompletedAllInterviews) {
            return null;
          }

          // Fetch user data
          let candidateName: string | null = null;
          let candidateEmail: string | null = null;
          let candidatePhoneNumber: string | null = null;

          if (candidate.candidate_user_id) {
            const { data: userData, error: userError } =
              await supabaseAdmin.auth.admin.getUserById(
                candidate.candidate_user_id
              );

            if (userError) {
              log.error("Error fetching user data", {
                userError,
                candidateUserId: candidate.candidate_user_id,
              });
            } else if (userData && userData.user) {
              candidateEmail = userData.user.email || null;
              candidateName =
                userData.user.user_metadata?.display_name ||
                userData.user.user_metadata?.full_name ||
                null;
              candidatePhoneNumber =
                userData.user.user_metadata?.phone_number || null;
            }
          }

          return {
            ...candidate,
            candidateName,
            candidateEmail,
            candidatePhoneNumber,
            hasCompletedAllInterviews,
          };
        })
      )
    ).filter((candidate) => candidate !== null);

    await log.flush();
    return candidatesWithUserData;
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
      .select("*")
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

    if (candidateJobInterviews.length === 0) {
      log.info("No job interviews found for candidate", {
        candidateId,
      });
      throw new Error("No job interviews found for candidate");
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
            .eq("candidate_interview_id", candidateJobInterview.id)
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

      interviewResults.push({
        candidateJobInterview,
        jobInterviewRecording,
        jobInterviewMessages,
        interviewAnalysis,
        interviewType: candidateJobInterview.job_interviews.interview_type,
        codingInterviewAnalysis,
      });
    }

    await log.flush();
    return {
      candidate: {
        ...candidate,
        candidateName,
        candidateEmail,
        candidatePhoneNumber,
      },
      applicationFiles: filesWithUrls as ApplicationFile[],
      interviewResults,
    };
  }
);

// For client component to fetch more candidates
export async function fetchMoreCandidates(
  companyId: string,
  jobId: string,
  offset: number,
  limit: number = 10
): Promise<Candidate[]> {
  const log = new Logger().with({
    functionName: "fetchMoreCandidates",
    companyId,
    jobId,
    offset,
    limit,
  });
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = await createAdminClient();

  const { data, error } = await supabase
    .from("company_job_candidates")
    .select("*")
    .eq("custom_job_id", jobId)
    .eq("company_id", companyId)
    .order("applied_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    log.error("Error fetching more candidates", { error });
    await log.flush();
    return [];
  }

  if (!data || data.length === 0) {
    await log.flush();
    return [];
  }

  // Fetch user data for each candidate
  const candidatesWithUserData = await Promise.all(
    data.map(async (candidate) => {
      let candidateName: string | null = null;
      let candidateEmail: string | null = null;
      let candidatePhoneNumber: string | null = null;

      if (candidate.candidate_user_id) {
        const { data: userData, error: userError } =
          await supabaseAdmin.auth.admin.getUserById(
            candidate.candidate_user_id
          );

        if (userError) {
          log.error("Error fetching user data", {
            userError,
            candidateUserId: candidate.candidate_user_id,
          });
        } else if (userData && userData.user) {
          candidateEmail = userData.user.email || null;
          candidateName =
            userData.user.user_metadata?.display_name ||
            userData.user.user_metadata?.full_name ||
            null;
          candidatePhoneNumber =
            userData.user.user_metadata?.phone_number || null;
        }
      }

      return {
        ...candidate,
        candidateName,
        candidateEmail,
        candidatePhoneNumber,
      };
    })
  );

  await log.flush();
  return candidatesWithUserData;
}
