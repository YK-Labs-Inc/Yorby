import React from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import SampleAnswerForm from "@/app/dashboard/coach-admin/programs/components/SampleAnswerForm";

// Helper function to get coach ID from user ID
async function getCoachId(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.error("Error fetching coach ID:", error);
    return null;
  }

  return data.id;
}

// Function to fetch job details
async function getJobDetails(programId: string, coachId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: job, error } = await supabase
    .from("custom_jobs")
    .select("job_title")
    .eq("id", programId)
    .eq("coach_id", coachId)
    .single();

  if (error || !job) {
    console.error("Error fetching job details:", error);
    return null;
  }

  return job;
}

// Function to fetch question details
async function getQuestionDetails(questionId: string, programId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: question, error } = await supabase
    .from("custom_job_questions")
    .select("question")
    .eq("id", questionId)
    .eq("custom_job_id", programId)
    .single();

  if (error || !question) {
    console.error("Error fetching question details:", error);
    return null;
  }

  return question;
}

// Function to fetch sample answer details
async function getSampleAnswerDetails(
  answerId: string,
  questionId: string,
  programId: string
) {
  const supabase = await createSupabaseServerClient();

  const { data: sampleAnswer, error } = await supabase
    .from("custom_job_question_sample_answers")
    .select("*")
    .eq("id", answerId)
    .eq("question_id", questionId)
    .single();

  if (error || !sampleAnswer) {
    console.error("Error fetching sample answer details:", error);
    return null;
  }

  return sampleAnswer;
}

export default async function EditSampleAnswerPage({
  params,
}: {
  params: Promise<{ programId: string; questionId: string; answerId: string }>;
}) {
  const { programId, questionId, answerId } = await params;
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Verify the user is a coach
  const coachId = await getCoachId(user.id);

  if (!coachId) {
    // User is not a coach, redirect to dashboard
    return redirect("/onboarding");
  }

  // Get job details
  const job = await getJobDetails(programId, coachId);

  if (!job) {
    // Job not found or doesn't belong to this coach
    return redirect("/dashboard/coach-admin/programs");
  }

  // Get question details
  const question = await getQuestionDetails(questionId, programId);

  if (!question) {
    // Question not found or doesn't belong to this job
    return redirect(`/dashboard/coach-admin/programs/${programId}`);
  }

  // Get sample answer details
  const sampleAnswer = await getSampleAnswerDetails(
    answerId,
    questionId,
    programId
  );

  if (!sampleAnswer) {
    // Sample answer not found or doesn't belong to this question
    return redirect(
      `/dashboard/coach-admin/programs/${programId}/questions/${questionId}`
    );
  }

  // If there is an audio file, fetch a signed URL
  let initialAudioUrl: string | undefined = undefined;
  let initialAudioFilePath: string | undefined = undefined;
  if (sampleAnswer.file_path) {
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("coach_files")
        .createSignedUrl(sampleAnswer.file_path, 3600); // 1 hour expiry
    if (!signedUrlError && signedUrlData?.signedUrl) {
      initialAudioUrl = signedUrlData.signedUrl;
      initialAudioFilePath = sampleAnswer.file_path;
    }
  }

  return (
    <div className="container mx-auto py-6">
      <SampleAnswerForm
        programId={programId}
        questionId={questionId}
        answerId={answerId}
        initialValues={{
          answer: sampleAnswer.answer,
          initialAudioUrl,
          initialAudioFilePath,
        }}
        onCancelRedirectUrl={`/dashboard/coach-admin/programs/${programId}/questions/${questionId}`}
        isEditing
      />
    </div>
  );
}
