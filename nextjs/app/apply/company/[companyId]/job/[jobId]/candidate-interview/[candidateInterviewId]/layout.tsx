import React from "react";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { Check, Clock, Circle } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface InterviewWithStatus {
  id: string;
  name: string;
  interview_type: "general" | "coding";
  order_index: number;
  candidateInterviewId?: string;
  status?: "pending" | "in_progress" | "completed";
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    companyId: string;
    jobId: string;
    candidateInterviewId: string;
  }>;
}

export default async function InterviewLayout({
  children,
  params,
}: LayoutProps) {
  const { companyId, jobId, candidateInterviewId } = await params;
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("apply.interviewLayout");
  const logger = new Logger().with({
    function: "InterviewLayout",
    companyId,
    jobId,
    candidateInterviewId,
  });

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      logger.error(t("errors.userNotAuthenticated"), { error: userError });
      redirect(`/apply/company/${companyId}/job/${jobId}`);
    }

    // Get candidate information
    const { data: candidate, error: candidateError } = await supabase
      .from("company_job_candidates")
      .select("id, status")
      .eq("custom_job_id", jobId)
      .eq("company_id", companyId)
      .eq("candidate_user_id", user.id)
      .maybeSingle();

    if (candidateError || !candidate) {
      logger.error(t("errors.candidateNotFound"), {
        error: candidateError,
        userId: user.id,
      });
      redirect(`/apply/company/${companyId}/job/${jobId}`);
    }

    // Fetch all job interviews for this job, sorted by order_index
    const { data: jobInterviews, error: interviewsError } = await supabase
      .from("job_interviews")
      .select("id, name, interview_type, order_index")
      .eq("custom_job_id", jobId)
      .order("order_index", { ascending: true });

    if (interviewsError || !jobInterviews || jobInterviews.length === 0) {
      logger.error(t("errors.noInterviewsFound"), {
        error: interviewsError,
        jobId,
      });
      notFound();
    }

    // Fetch all candidate_job_interviews for this candidate
    const { data: candidateInterviews, error: candidateInterviewsError } =
      await supabase
        .from("candidate_job_interviews")
        .select("id, interview_id, status")
        .eq("candidate_id", candidate.id);

    if (candidateInterviewsError) {
      logger.error(t("errors.fetchCandidateInterviews"), {
        error: candidateInterviewsError,
      });
      notFound();
    }

    // Combine job interviews with candidate interview status
    const interviewsWithStatus: InterviewWithStatus[] = jobInterviews.map(
      (jobInterview) => {
        const candidateInterview = candidateInterviews?.find(
          (ci) => ci.interview_id === jobInterview.id
        );
        return {
          ...jobInterview,
          candidateInterviewId: candidateInterview?.id,
          status: candidateInterview?.status,
        };
      }
    );

    // Get company and job details for the header
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();

    const { data: job } = await supabase
      .from("custom_jobs")
      .select("job_title")
      .eq("id", jobId)
      .single();

    logger.info("Interview layout loaded", {
      interviewCount: interviewsWithStatus.length,
      candidateId: candidate.id,
    });

    await logger.flush();

    return (
      <div className="max-h-screen bg-white overflow-hidden">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900">
              {company?.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">{job?.job_title}</p>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r min-h-[calc(100vh-5rem)] h-full">
            <div className="p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                {t("sidebar.title")}
              </h2>
              <nav className="space-y-3">
                {interviewsWithStatus.map((interview, index) => {
                  const isActive =
                    interview.candidateInterviewId === candidateInterviewId;
                  const isCompleted = interview.status === "completed";
                  const isInProgress = interview.status === "in_progress";

                  return (
                    <div key={interview.id}>
                      <div
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          isActive ? "bg-blue-50 border border-blue-200" : ""
                        }`}
                      >
                        <div className="mt-0.5">
                          {isCompleted ? (
                            <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          ) : isInProgress || isActive ? (
                            <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <Clock className="h-3 w-3 text-white" />
                            </div>
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-medium truncate ${
                                isActive
                                  ? "text-blue-700"
                                  : isCompleted
                                    ? "text-green-700"
                                    : "text-gray-900"
                              }`}
                            >
                              {t("sidebar.round", {
                                number: index + 1,
                                name: interview.name,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="h-full">{children}</div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    logger.error(t("errors.layoutError"), { error });
    await logger.flush();
    notFound();
  }
}
