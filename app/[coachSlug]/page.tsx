import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import React from "react";
import CoachSignInForm from "./CoachSignInForm";
import { notFound } from "next/navigation";
import { H2 } from "@/components/typography";

interface CoachPortalLandingPageProps {
  params: Promise<{
    coachSlug: string;
    locale: string;
  }>;
}

const fetchCoach = async (coachSlug: string) => {
  const logger = new Logger().with({
    coachSlug,
  });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("slug", coachSlug)
    .single();
  if (error) {
    logger.warn("No coach found for slug", { error });
    await logger.flush();
    return null;
  }
  return data;
};

const checkUserCoachRegistration = async (
  coachId: string,
  userId: string,
  coachUserId: string
) => {
  const supabase = await createSupabaseServerClient();
  // 1. Check user_coach_access
  const { data: access, error: accessError } = await supabase
    .from("user_coach_access")
    .select("*")
    .eq("user_id", userId)
    .eq("coach_id", coachId)
    .maybeSingle();
  if (!access || accessError) {
    return { hasAccess: false, hasDuplicatedJobs: false, firstJobId: null };
  }

  // 2. Get all coach jobs and their questions
  const { data: coachJobs, error: coachJobsError } = await supabase
    .from("custom_jobs")
    .select("id, custom_job_questions(id)")
    .eq("coach_id", coachId)
    .eq("user_id", coachUserId); // coach's own jobs
  if (!coachJobs || coachJobs.length === 0 || coachJobsError) {
    return { hasAccess: true, hasDuplicatedJobs: false, firstJobId: null };
  }

  // 3. Get all user jobs duplicated from coach jobs, including their questions
  const { data: userJobs, error: userJobsError } = await supabase
    .from("custom_jobs")
    .select(
      "id, source_custom_job_id, custom_job_questions(id, source_custom_job_question_id)"
    )
    .eq("user_id", userId)
    .eq("coach_id", coachId);
  if (!userJobs || userJobsError) {
    return { hasAccess: true, hasDuplicatedJobs: false, firstJobId: null };
  }

  // Map of coachJobId -> userJob object
  const userJobMap = new Map(userJobs.map((j) => [j.source_custom_job_id, j]));
  const allJobsDuplicated = coachJobs.every((j) => userJobMap.has(j.id));
  if (!allJobsDuplicated) {
    return { hasAccess: true, hasDuplicatedJobs: false, firstJobId: null };
  }

  // 4. For each coach job, check that all questions are duplicated by the user
  for (const coachJob of coachJobs) {
    const userJob = userJobMap.get(coachJob.id);
    if (!userJob) {
      return { hasAccess: true, hasDuplicatedJobs: false, firstJobId: null };
    }
    // Get all coach questions for this job
    const coachQuestionIds = (coachJob.custom_job_questions || []).map(
      (q) => q.id
    );
    if (coachQuestionIds.length === 0) continue;
    // Get all user questions for this duplicated job
    const userQuestionSourceIds = new Set(
      (userJob.custom_job_questions || []).map(
        (q) => q.source_custom_job_question_id
      )
    );
    // All coach questions must be duplicated
    const allQuestionsDuplicated = coachQuestionIds.every((qid) =>
      userQuestionSourceIds.has(qid)
    );
    if (!allQuestionsDuplicated) {
      return { hasAccess: true, hasDuplicatedJobs: false, firstJobId: null };
    }
  }

  // Get the first duplicated job id for navigation
  const firstJobId =
    coachJobs.length > 0 ? (userJobMap.get(coachJobs[0].id)?.id ?? null) : null;
  return { hasAccess: true, hasDuplicatedJobs: true, firstJobId };
};

export default async function CoachPortalLandingPage({
  params,
}: CoachPortalLandingPageProps) {
  const { coachSlug } = await params;
  const coach = await fetchCoach(coachSlug);
  if (!coach) {
    notFound();
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let registrationStatus: {
    hasAccess: boolean;
    hasDuplicatedJobs: boolean;
    firstJobId: string | null;
  } = { hasAccess: false, hasDuplicatedJobs: false, firstJobId: null };
  if (user) {
    registrationStatus = await checkUserCoachRegistration(
      coach.id,
      user.id,
      coach.user_id
    );
  }

  let redirectTo = `/api/coach/${coach.id}/register`;
  if (user) {
    if (user.id === coach.user_id) {
      redirectTo = "/dashboard/coach-admin/programs";
    } else if (
      registrationStatus.hasAccess &&
      registrationStatus.hasDuplicatedJobs &&
      registrationStatus.firstJobId
    ) {
      redirectTo = `/${coach.slug}/programs/${registrationStatus.firstJobId}`;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-2">
      <H2>Welcome to {coach.name}&apos;s program</H2>
      <CoachSignInForm coachId={coach.id} redirectTo={redirectTo} />
    </div>
  );
}
