"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { fetchFilesFromGemini, FileEntry } from "@/utils/ai/gemini";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export const createInterviewForCandidate = async ({
  candidateId,
  jobId,
}: {
  candidateId: string;
  jobId: string;
}) => {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "createInterviewForCandidate",
    candidateId,
    jobId,
  });

  try {
    // First, fetch the candidate's user_id from company_job_candidates table
    const { data: candidate, error: candidateError } = await supabase
      .from("company_job_candidates")
      .select("candidate_user_id")
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      logger.error("Failed to fetch candidate", { error: candidateError });
      throw new Error("Candidate not found");
    }

    if (!candidate.candidate_user_id) {
      logger.error("Candidate has no user_id", { candidateId });
      throw new Error("Candidate has no associated user account");
    }

    // Fetch the custom job questions for this job
    const { data: jobQuestions, error: questionError } = await supabase
      .from("custom_job_questions")
      .select("question")
      .eq("custom_job_id", jobId);

    if (questionError) {
      logger.error("Failed to fetch job questions", { error: questionError });
      throw new Error("Failed to fetch job questions");
    }

    if (!jobQuestions || jobQuestions.length === 0) {
      logger.error("No questions found for this job", { jobId });
      throw new Error("No questions found for this job");
    }

    // Create the questions prompt
    const questionsPrompt = jobQuestions
      .map((q, index) => `Question ${index + 1}: ${q.question}`)
      .join("\n");

    // Create the interview prompt with all questions
    const interviewPrompt = `
You are an experienced job interviewer conducting a structured behavioral interview. Your goal is to accurately assess the candidate's qualifications, experience, and fit for the role through professional questioning and active listening.

INTERVIEWER PERSONA:
- You are emotionally neutral and maintain professional boundaries throughout
- You actively listen but do NOT offer excessive praise or validation
- You ask clarifying follow-up questions when answers are vague, incomplete, or don't fully address the question
- You probe for specific examples when candidates give generic responses
- You maintain control of the interview pace and redirect if candidates go off-topic

INTERVIEW CONDUCT RULES:
1. Start with a brief, professional introduction: state your name (use a common name like Michael, Jennifer, David, or Sarah) and your role as the hiring manager or team lead.

2. Begin with "Tell me about yourself" - listen for a 2-3 minute response, then transition to your prepared questions.

3. Ask ALL of the interview questions provided to you in this prompt. You must ask every single question listed below. Use the questions as a general guideline but feel free to ask follow-up questions if the answer is not detailed enough or ask different questions if the interview is going in a different direction.
For each question:
   - Ask clearly and wait for the complete response
   - If the answer is vague or lacks specifics, ask follow-ups like:
     * "Can you give me a specific example?"
     * "What was your exact role in that situation?"
     * "What was the measurable outcome?"
     * "How did you handle any challenges that arose?"
   - Don't accept surface-level answers - dig deeper if necessary. 

4. Maintain realistic interview dynamics:
   - If an answer is concerning or unclear, your tone should reflect mild concern: "I see. Can you elaborate on..."
   - Never say things like "Great answer!" or "Excellent!" - instead use neutral acknowledgments like "Thank you" or "Understood"

5. Red flags to probe:
   - Answers that only use "we" instead of "I" - ask "What was YOUR specific contribution?"
   - Vague timelines or results - ask for specific dates, metrics, or outcomes
   - Avoiding direct answers - redirect back to the original question
   - Over-polished or memorized-sounding responses - ask unexpected follow-ups

INTERVIEW QUESTIONS:
${questionsPrompt}

You must ask ALL ${jobQuestions.length} questions listed above. Once you have asked all ${jobQuestions.length} questions, end the interview.

Thank the candidate for their time and tell them that the interview has ended.`;

    // Create the mock interview entry
    const { data: mockInterview, error: interviewError } = await supabase
      .from("custom_job_mock_interviews")
      .insert({
        custom_job_id: jobId,
        candidate_id: candidateId,
        user_id: candidate.candidate_user_id,
        interview_prompt: interviewPrompt,
        status: "in_progress",
      })
      .select("id")
      .single();

    if (interviewError || !mockInterview) {
      logger.error("Failed to create mock interview", {
        error: interviewError,
      });
      throw new Error("Failed to create mock interview");
    }

    logger.info("Successfully created mock interview", {
      interviewId: mockInterview.id,
      candidateId,
      jobId,
      userId: candidate.candidate_user_id,
    });

    return mockInterview.id;
  } catch (error) {
    logger.error("Error in createInterviewForCandidate", { error });
    throw error;
  }
};

export const submitApplication = async (
  prevState: { error: string },
  formData: FormData
) => {
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("apply");

  // Parse form data
  const companyId = formData.get("companyId") as string;
  const jobId = formData.get("jobId") as string;
  const selectedFileIds = formData.getAll("selectedFileIds") as string[];
  let interviewId: string | null = null;

  const logger = new Logger().with({
    function: "submitApplication",
    companyId,
    jobId,
    fileCount: selectedFileIds.length,
  });

  try {
    if (
      !companyId ||
      !jobId ||
      !selectedFileIds ||
      selectedFileIds.length === 0
    ) {
      throw new Error("Missing required fields");
    }

    logger.info("Processing application submission", {
      companyId,
      jobId,
      fileCount: selectedFileIds.length,
    });

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      logger.error("User not authenticated", { error: userError });
      throw new Error("User not authenticated");
    }

    // Fetch the files to check if they need Gemini upload
    const { data: userFiles, error: filesError } = await supabase
      .from("user_files")
      .select("*")
      .in("id", selectedFileIds);

    if (filesError || !userFiles) {
      logger.error("Failed to fetch user files", { error: filesError });
      throw new Error("Failed to fetch application files");
    }

    // Convert user files to FileEntry format and upload to Gemini if needed
    const fileEntries: FileEntry[] = userFiles.map((file) => ({
      id: file.id,
      supabaseBucketName: file.bucket_name,
      supabaseFilePath: file.file_path,
      supabaseTableName: "user_files",
      googleFileUri: file.google_file_uri,
      googleFileName: file.google_file_name,
      mimeType: file.mime_type,
    }));

    try {
      const geminiFiles = await fetchFilesFromGemini({ files: fileEntries });
      logger.info("Files processed for Gemini", {
        filesCount: geminiFiles.length,
        fileIds: fileEntries.map((f) => f.id),
      });
    } catch (error) {
      logger.error("Failed to process files for Gemini", {
        error,
        fileIds: fileEntries.map((f) => f.id),
      });
      // Continue with application submission even if file upload fails
    }

    // Create candidate application
    const { data: candidate, error: candidateError } = await supabase
      .from("company_job_candidates")
      .insert({
        company_id: companyId,
        custom_job_id: jobId,
        candidate_user_id: user.id,
        candidate_email: user.email!,
        candidate_name:
          user.user_metadata.full_name || user.email!.split("@")[0],
        status: "applied",
      })
      .select()
      .single();

    if (candidateError) {
      logger.error("Failed to create candidate", { error: candidateError });
      throw new Error("Failed to create candidate application");
    }

    // Create candidate_application_files entries
    const selectedFileEntries = selectedFileIds.map((fileId: string) => ({
      candidate_id: candidate.id,
      file_id: fileId,
    }));

    const { error: linkFilesError } = await supabase
      .from("candidate_application_files")
      .insert(selectedFileEntries);

    if (linkFilesError) {
      logger.error("Failed to link files", { error: linkFilesError });
      throw new Error("Failed to link application files");
    }

    logger.info("Application submitted successfully", {
      candidateId: candidate.id,
      fileCount: selectedFileIds.length,
    });
    interviewId = await createInterviewForCandidate({
      candidateId: candidate.id,
      jobId,
    });
    await logger.flush();
  } catch (error) {
    logger.error("Application submission error", { error });
    await logger.flush();
    return { error: t("applicationForm.errors.submitApplication") };
  }
  if (!interviewId) {
    logger.error("Failed to create interview", {
      error: "interviewId is null",
    });
    await logger.flush();
    return { error: t("applicationForm.errors.submitApplication") };
  }
  redirect(`/apply/company/${companyId}/job/${jobId}/interview/${interviewId}`);
};
