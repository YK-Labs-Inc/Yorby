"use server";

import {
  createSupabaseServerClient,
  createAdminClient,
} from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Tables } from "@/utils/supabase/database.types";
import { cache } from "react";
import type { TypedInterviewAnalysis } from "./types";

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
export type MockInterview = Tables<"custom_job_mock_interviews">;
export type MuxMetadata = Tables<"mock_interview_mux_metadata">;
export type MockInterviewMessage = Tables<"mock_interview_messages">;
export type InterviewAnalysis = TypedInterviewAnalysis;

export interface AccessValidation {
  company: Company;
  job: Job;
  membership: { role: string };
}

export interface CandidateData {
  candidate: Candidate;
  applicationFiles: ApplicationFile[];
  mockInterview: MockInterview | null;
  muxMetadata: MuxMetadata | null;
  mockInterviewMessages: MockInterviewMessage[];
  interviewAnalysis: InterviewAnalysis | null;
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
      console.error("Error fetching candidates:", error);
      return [];
    }

    if (!data || data.length === 0) {
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
            console.error("Error fetching user data:", userError);
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

    return candidatesWithUserData;
  }
);

export const getCandidateData = cache(
  async (candidateId: string): Promise<CandidateData | null> => {
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = await createAdminClient();

    // Fetch candidate data
    const { data: candidate, error: candidateError } = await supabase
      .from("company_job_candidates")
      .select("*")
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      console.error("Error fetching candidate:", candidateError);
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
        console.error("Error fetching user data:", userError);
      } else if (userData && userData.user) {
        candidateEmail = userData.user.email || null;
        if (!candidateEmail) {
          throw new Error("Candidate email not found");
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
      console.error("Error fetching application files:", filesError);
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

    console.log("filesWithUrls", filesWithUrls);

    // Fetch mock interview data
    const { data: mockInterview, error: interviewError } = await supabase
      .from("custom_job_mock_interviews")
      .select("*")
      .eq("candidate_id", candidateId)
      .maybeSingle(); // Use maybeSingle since there should only be one per candidate

    if (interviewError) {
      console.error("Error fetching mock interview:", interviewError);
    }

    // Fetch mux metadata if mock interview exists
    let muxMetadata = null;
    if (mockInterview) {
      const { data: muxData, error: muxError } = await supabase
        .from("mock_interview_mux_metadata")
        .select("*")
        .eq("id", mockInterview.id)
        .maybeSingle();

      if (muxError && muxError.code !== "PGRST116") {
        console.error("Error fetching mux metadata:", muxError);
      } else {
        muxMetadata = muxData;
      }
    }

    // Fetch mock interview messages if mock interview exists
    let mockInterviewMessages: MockInterviewMessage[] = [];
    if (mockInterview) {
      const { data: messages, error: messagesError } = await supabase
        .from("mock_interview_messages")
        .select("*")
        .eq("mock_interview_id", mockInterview.id)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching mock interview messages:", messagesError);
      } else {
        mockInterviewMessages = messages || [];
      }
    }

    // Fetch interview analysis if mock interview exists
    let interviewAnalysis = null;
    if (mockInterview) {
      const { data: analysis, error: analysisError } = await supabase
        .from("recruiter_interview_analysis_complete")
        .select("*")
        .eq("mock_interview_id", mockInterview.id)
        .maybeSingle();

      if (analysisError && analysisError.code !== "PGRST116") {
        console.error("Error fetching interview analysis:", analysisError);
      } else {
        interviewAnalysis = analysis as InterviewAnalysis;
      }
    }

    return {
      candidate: {
        ...candidate,
        candidateName,
        candidateEmail,
        candidatePhoneNumber,
      },
      applicationFiles: filesWithUrls as ApplicationFile[],
      mockInterview: mockInterview || null,
      muxMetadata: muxMetadata || null,
      mockInterviewMessages,
      interviewAnalysis: interviewAnalysis || null,
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
    console.error("Error fetching more candidates:", error);
    return [];
  }

  if (!data || data.length === 0) {
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
          console.error("Error fetching user data:", userError);
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

  return candidatesWithUserData;
}
