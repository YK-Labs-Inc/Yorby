"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { fetchFilesFromGemini, FileEntry } from "@/utils/ai/gemini";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { generateTextWithFallback } from "@/utils/ai/gemini";
import { headers } from "next/headers";
import { Enums, Tables } from "@/utils/supabase/database.types";

// Helper function to fetch candidate files and generate context
async function generateCandidateContext({
  candidateId,
}: {
  candidateId: string;
}): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "generateCandidateContext",
    candidateId,
  });

  try {
    // Fetch candidate's application files
    const { data: applicationFiles, error: filesError } = await supabase
      .from("candidate_application_files")
      .select(
        `
        file_id,
        user_files (
          id,
          bucket_name,
          file_path,
          google_file_uri,
          google_file_name,
          mime_type
        )
      `
      )
      .eq("candidate_id", candidateId);

    if (filesError) {
      logger.error("Failed to fetch candidate application files", {
        error: filesError,
      });
      return "";
    }

    if (!applicationFiles || applicationFiles.length === 0) {
      logger.info("No application files found for candidate", { candidateId });
      return "";
    }

    // Convert to FileEntry format
    const fileEntries: FileEntry[] = applicationFiles
      .filter((af) => af.user_files)
      .map((af) => ({
        id: af.user_files.id,
        supabaseBucketName: af.user_files.bucket_name,
        supabaseFilePath: af.user_files.file_path,
        supabaseTableName: "user_files",
        googleFileUri: af.user_files.google_file_uri,
        googleFileName: af.user_files.google_file_name,
        mimeType: af.user_files.mime_type,
      }));

    if (fileEntries.length === 0) {
      return "";
    }

    // Upload files to Gemini if needed
    const geminiFiles = await fetchFilesFromGemini({ files: fileEntries });

    logger.info("Files processed for candidate context", {
      filesCount: geminiFiles.length,
      candidateId,
    });

    const contextPrompt = `You are analyzing a candidate's application documents for a job interview. 
These documents may include their resume, CV, cover letter, portfolio, or other relevant materials.

Please extract and summarize the following key information that would be relevant for an interviewer to know:

1. **Professional Background**: Current role, years of experience, and career progression
2. **Key Skills & Expertise**: Technical skills, domain knowledge, and areas of specialization
3. **Notable Achievements**: Significant accomplishments, awards, or recognitions
4. **Education & Certifications**: Degrees, certifications, and relevant training
5. **Work Style & Values**: Any insights into their work approach, values, or soft skills
6. **Potential Areas to Probe**: Based on their background, what specific areas might be worth exploring deeper during the interview

Provide a concise but comprehensive summary that an interviewer can use to conduct a more informed and personalized interview.
`;

    const candidateContext = await generateTextWithFallback({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: contextPrompt,
            },
            ...geminiFiles.map((file) => ({
              type: "file" as const,
              data: file.fileData.fileUri,
              mimeType: file.fileData.mimeType,
            })),
          ],
        },
      ],
      loggingContext: {
        function: "generateCandidateContext",
        candidateId,
        fileCount: geminiFiles.length,
      },
    });

    return candidateContext;
  } catch (error) {
    logger.error("Error generating candidate context", { error });
    return "";
  } finally {
    await logger.flush();
  }
}

export const createInterviewForCandidate = async ({
  candidateId,
  jobId,
}: {
  candidateId: string;
  jobId: string;
}) => {
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("apply.api.errors");
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
      throw new Error(t("candidateNotFound"));
    }

    if (!candidate.candidate_user_id) {
      logger.error("Candidate has no user_id", { candidateId });
      throw new Error(t("candidateNoUser"));
    }

    // Fetch the job details for context
    const { data: jobDetails, error: jobError } = await supabase
      .from("custom_jobs")
      .select("job_title, job_description, company_name, company_description")
      .eq("id", jobId)
      .single();

    if (jobError || !jobDetails) {
      logger.error("Failed to fetch job details", { error: jobError });
      throw new Error(t("fetchJobDetails"));
    }

    // Fetch the custom job questions for this job (now optional)
    const { data: jobQuestions, error: questionError } = await supabase
      .from("custom_job_questions")
      .select("question")
      .eq("custom_job_id", jobId);

    if (questionError) {
      logger.error("Failed to fetch job questions", { error: questionError });
      throw new Error(t("fetchJobQuestions"));
    }

    // Generate candidate context from their application files
    const candidateContext = await generateCandidateContext({
      candidateId,
    });

    // Create the questions prompt (if any questions exist)
    const questionsPrompt =
      jobQuestions && jobQuestions.length > 0
        ? jobQuestions
            .map((q, index) => `Question ${index + 1}: ${q.question}`)
            .join("\n")
        : null;

    // Create the interview prompt with job context, optional questions, and candidate context
    const interviewPrompt = `
You are an experienced job interviewer conducting a structured behavioral interview for a ${jobDetails.job_title} position at ${jobDetails.company_name}. 
Your goal is to accurately assess the candidate's qualifications, experience, and fit for this specific role through professional questioning and active listening.
This interview should last NO MORE THAN 30 MINUTES. It is okay for it to be shorter. Do not force the interview to last the entire 30 minutes. The interview
should only last as long as it takes to assess the candidate's qualifications for this specific role.

JOB CONTEXT:
Position: ${jobDetails.job_title}
Company: ${jobDetails.company_name}
${jobDetails.company_description ? `About the Company: ${jobDetails.company_description}` : ""}

Job Description:
${jobDetails.job_description}

Use this job description to:
- Assess the candidate's relevant skills and experience for THIS specific role
- Ask targeted questions about required competencies mentioned in the job description
- Evaluate cultural fit based on company values and work environment
- Probe for evidence of success in similar responsibilities
- Identify any skill gaps that need to be addressed

${
  candidateContext
    ? `CANDIDATE BACKGROUND INFORMATION:
Based on the candidate's application materials, here's what you should know:
${candidateContext}

Use this information to:
- Ask more targeted follow-up questions
- Probe deeper into specific experiences mentioned in their materials
- Verify claims made in their resume/CV
- Explore gaps or areas that need clarification
- Compare their background against the job requirements

`
    : ""
}INTERVIEWER PERSONA:
- You are emotionally neutral and maintain professional boundaries throughout
- You actively listen but do NOT offer excessive praise or validation
- You ask clarifying follow-up questions when answers are vague, incomplete, or don't fully address the question
- You probe for specific examples when candidates give generic responses
- You maintain control of the interview pace and redirect if candidates go off-topic

INTERVIEW CONDUCT RULES:
1. Start with a brief, professional introduction: state your name (use a common name like Michael, Jennifer, David, or Sarah) and your role as the hiring manager or team lead.

2. Begin with "Tell me about yourself" - listen for a 2-3 minute response, then transition to your prepared questions.${candidateContext ? " Compare their verbal introduction with what you know from their application materials." : ""}

3. Conduct a comprehensive assessment:
   - Use your expertise to design REALISTIC interview questions that would actually be asked for this type of position
   - Base your questions on the job description, required competencies, and industry best practices
   - Ask a mix of behavioral, technical, and situational questions as appropriate for the role
   - Focus on questions that reveal past performance, problem-solving abilities, and future potential
   - If specific questions have been provided below, incorporate them into your interview, but don't limit yourself to only those
   - However, if specific questions have been provided below, you MUST ask ALL of them in your interview. This is MANDATORY.
   - Remember: This is a 30-minute interview. Manage your time to cover all important areas. It is okay for it to be shorter. Do not force the interview to last the entire 30 minutes.
   
For each question (whether provided or generated):
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

INTERVIEW APPROACH:
Your primary goal is to conduct a thorough assessment of the candidate's qualifications for this specific role.
- Analyze the job description to identify key competencies and requirements
- Design realistic interview questions that a real interviewer would ask for this position
- Use behavioral, technical, and situational questions as appropriate
- Aim for depth over breadth - better to explore fewer topics thoroughly than many superficially

${
  questionsPrompt
    ? `SUGGESTED QUESTIONS TO INCORPORATE:
${questionsPrompt}

These questions should be woven naturally into your interview, but don't let them limit your assessment. Feel free to ask additional questions based on the job requirements and the candidate's responses.`
    : ""
}

TIME MANAGEMENT:
- This interview MUST NOT exceed 30 minutes
- Pace your questions to allow thorough responses while staying within the time limit
- If approaching 30 minutes, politely wrap up the current question and conclude

CONCLUSION:
When you have gathered enough information to assess the candidate's qualifications for this role, or when approaching the 30-minute mark, conclude the interview professionally. Thank the candidate for their time and inform them that the interview has ended.`;

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
      throw new Error(t("createMockInterview"));
    }

    logger.info("Successfully created mock interview", {
      interviewId: mockInterview.id,
      candidateId,
      jobId,
      userId: candidate.candidate_user_id,
      hasContext: !!candidateContext,
      questionsCount: jobQuestions?.length || 0,
      hasJobDescription: !!jobDetails.job_description,
    });

    return mockInterview.id;
  } catch (error) {
    logger.error("Error in createInterviewForCandidate", { error });
    throw error;
  }
};

export async function checkApplicationStatus(
  companyId: string,
  jobId: string,
  userId: string
) {
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("apply.api.errors");
  const logger = new Logger().with({
    function: "checkApplicationStatus",
    companyId,
    jobId,
    userId,
  });

  // Check if the user has already applied to this job
  const { data: existingCandidate, error: applicationError } = await supabase
    .from("company_job_candidates")
    .select("id, status, applied_at")
    .eq("custom_job_id", jobId)
    .eq("company_id", companyId)
    .eq("candidate_user_id", userId)
    .maybeSingle();

  if (applicationError) {
    logger.error("Database error checking application", {
      error: applicationError,
      companyId,
      jobId,
      userId,
    });
    throw new Error(t("checkApplicationStatus"));
  }

  const hasApplied = !!existingCandidate;

  // Check if the user has completed an interview for this job
  let hasCompletedInterview = false;
  let hasGeneratedAggregatedAnalysisForAllInterviews = false;
  let interviewId: string | null = null;
  let finalizedCandidateJobInterviews: (Pick<
    Tables<"candidate_job_interviews">,
    "id" | "status" | "interview_id"
  > & { interview_type: Enums<"job_interview_type"> })[] = [];

  if (existingCandidate) {
    // Fetch the job interviews for the job
    const { data: jobInterviews, error: jobInterviewsError } = await supabase
      .from("job_interviews")
      .select("id, order_index, interview_type")
      .eq("custom_job_id", jobId)
      .order("order_index", { ascending: true });

    if (jobInterviewsError) {
      logger.error("Error fetching job interviews", {
        error: jobInterviewsError,
      });
      await logger.flush();
      throw new Error(t("checkInterviewStatus"));
    }

    // Check if the current candidate has completed the job interviews or not
    let { data: candidateJobInterviews, error: interviewsError } =
      await supabase
        .from("candidate_job_interviews")
        .select("id, status, interview_id")
        .in(
          "interview_id",
          jobInterviews.map((interview) => interview.id)
        )
        .eq("candidate_id", existingCandidate.id);

    if (interviewsError) {
      logger.error("Error fetching interviews", {
        error: interviewsError,
      });
      await logger.flush();
      throw new Error(t("checkInterviewStatus"));
    }

    if (candidateJobInterviews && candidateJobInterviews.length > 0) {
      candidateJobInterviews = candidateJobInterviews.sort(
        (a, b) =>
          (jobInterviews.find((interview) => interview.id === a.interview_id)
            ?.order_index || 0) -
          (jobInterviews.find((interview) => interview.id === b.interview_id)
            ?.order_index || 0)
      );
      finalizedCandidateJobInterviews = candidateJobInterviews.map(
        (interview) => ({
          ...interview,
          interview_type: jobInterviews.find(
            (jobInterview) => jobInterview.id === interview.interview_id
          )?.interview_type as Enums<"job_interview_type">,
        })
      );

      // Check if any interview is complete
      hasCompletedInterview = candidateJobInterviews.every(
        (interview) => interview.status === "completed"
      );
    }

    // Get the most recent interview ID (completed or in-progress)
    if (candidateJobInterviews && candidateJobInterviews.length > 0) {
      interviewId =
        candidateJobInterviews.find(
          (interview) => interview.status !== "completed"
        )?.id ?? null;
    }

    const { data: aggregatedAnalysis, error: aggregatedAnalysisError } =
      await supabase
        .from("candidate_aggregated_interview_analysis")
        .select("id")
        .eq("candidate_id", existingCandidate.id)
        .maybeSingle();

    if (aggregatedAnalysisError) {
      logger.error("Error fetching aggregated analysis", {
        error: aggregatedAnalysisError,
      });
      await logger.flush();
      throw new Error(t("fetchAggregatedAnalysis"));
    }

    if (aggregatedAnalysis) {
      hasGeneratedAggregatedAnalysisForAllInterviews = true;
    }
  }

  logger.info("Application and interview status checked", {
    companyId,
    jobId,
    userId,
    hasApplied,
    hasCompletedInterview,
    applicationId: existingCandidate?.id,
    interviewId,
    hasGeneratedAggregatedAnalysisForAllInterviews,
  });

  await logger.flush();

  return {
    success: true,
    hasApplied,
    hasCompletedInterview,
    application: existingCandidate || null,
    interviewId,
    candidateJobInterviews: finalizedCandidateJobInterviews,
    hasGeneratedAggregatedAnalysisForAllInterviews,
  };
}

export async function handleApplyAction(
  prevState: { error?: string },
  formData: FormData
) {
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("apply.api.errors");
  const companyId = formData.get("companyId") as string;
  const jobId = formData.get("jobId") as string;
  const captchaToken = formData.get("captchaToken") as string;
  const logger = new Logger().with({
    function: "handleApplyAction",
    companyId,
    jobId,
  });

  if (!companyId || !jobId) {
    logger.error("Missing required parameters");
    await logger.flush();
    return { error: t("missingParameters") };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;

  // If no userId, create anonymous user
  if (!userId) {
    const { error } = await supabase.auth.signInAnonymously({
      options: {
        captchaToken,
      },
    });
    if (error) {
      logger.error("Failed to sign in anonymously", { error });
      await logger.flush();
      return { error: t("signInAnonymously") };
    }
    redirect(`/apply/company/${companyId}/job/${jobId}/application`);
  }

  // Otherwise check application status for existing user
  const result = await checkApplicationStatus(companyId, jobId, userId);

  if (result.hasApplied && result.application) {
    if (result.hasCompletedInterview) {
      // User has already applied and completed interview, redirect to submitted page
      redirect(
        `/apply/company/${companyId}/job/${jobId}/application/submitted`
      );
    } else if (!result.hasCompletedInterview && result.interviewId) {
      if (user.is_anonymous) {
        redirect(
          `/apply/company/${companyId}/job/${jobId}/application/confirm-email?interviewId=${result.interviewId}`
        );
      }
      // User has applied and has an interview ID, redirect to specific interview page
      redirect(
        `/apply/company/${companyId}/job/${jobId}/candidate-interview/${result.interviewId}`
      );
    } else {
      const interviewId = await createInterviewsForJobAndReturnFirstInterviewId(
        {
          candidateId: result.application.id,
          jobId,
        }
      );
      redirect(
        `/apply/company/${companyId}/job/${jobId}/candidate-interview/${interviewId}`
      );
    }
  } else {
    // User hasn't applied yet, redirect to application page
    redirect(`/apply/company/${companyId}/job/${jobId}/application`);
  }
}

export const submitApplication = async (
  _prevState: { error: string },
  formData: FormData
) => {
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("apply.api.errors");

  // Parse form data
  const companyId = formData.get("companyId") as string;
  const jobId = formData.get("jobId") as string;
  const selectedFileIds = (
    formData.getAll("selectedFileIds") as string[]
  ).filter((id) => id && id.trim() !== "");
  const email = formData.get("email") as string;
  const fullName = formData.get("fullName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  let interviewId: string | null = null;
  let isAnonymous = false;

  const logger = new Logger().with({
    function: "submitApplication",
    companyId,
    jobId,
    fileCount: selectedFileIds.length,
  });

  try {
    if (!companyId || !jobId) {
      throw new Error(t("missingRequiredFields"));
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
      throw new Error(t("userNotAuthenticated"));
    }

    // Check if this is an anonymous user (no email)
    isAnonymous = user.is_anonymous || false;

    // Only fetch and process files if there are selected files
    if (selectedFileIds.length > 0) {
      // Fetch the files to check if they need Gemini upload
      const { data: userFiles, error: filesError } = await supabase
        .from("user_files")
        .select("*")
        .in("id", selectedFileIds);

      if (filesError || !userFiles) {
        logger.error("Failed to fetch user files", { error: filesError });
        throw new Error(t("fetchApplicationFiles"));
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
    }

    // Create candidate application
    const { data: candidate, error: candidateError } = await supabase
      .from("company_job_candidates")
      .insert({
        company_id: companyId,
        custom_job_id: jobId,
        candidate_user_id: user.id,
        status: "applied",
      })
      .select()
      .single();

    if (candidateError) {
      logger.error("Failed to create candidate", { error: candidateError });
      throw new Error(t("createCandidateApplication"));
    }

    // Create candidate_application_files entries (only if there are files to link)
    if (selectedFileIds.length > 0) {
      const selectedFileEntries = selectedFileIds.map((fileId: string) => ({
        candidate_id: candidate.id,
        file_id: fileId,
      }));

      const { error: linkFilesError } = await supabase
        .from("candidate_application_files")
        .insert(selectedFileEntries);

      if (linkFilesError) {
        logger.error("Failed to link files", { error: linkFilesError });
        throw new Error(t("linkApplicationFiles"));
      }
    }

    logger.info("Application submitted successfully", {
      candidateId: candidate.id,
      fileCount: selectedFileIds.length,
    });
    interviewId = await createInterviewsForJobAndReturnFirstInterviewId({
      candidateId: candidate.id,
      jobId,
    });

    if (isAnonymous && email) {
      logger.info("Updating anonymous user with email", {
        userId: user.id,
        email,
      });
      const origin = (await headers()).get("origin");
      const { error: updateError } = await supabase.auth.updateUser(
        {
          email,
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
          },
        },
        {
          emailRedirectTo: `${origin}/apply/company/${companyId}/job/${jobId}/candidate-interview/${interviewId}`,
        }
      );

      if (updateError) {
        logger.error("Failed to update user email", { error: updateError });
        throw new Error(t("updateUserInformation"));
      }
    }
    await logger.flush();
  } catch (error) {
    logger.error("Application submission error", { error });
    await logger.flush();
    return { error: t("submitApplication") };
  }
  if (!interviewId) {
    logger.error("Failed to create interview", {
      error: "interviewId is null",
    });
    await logger.flush();
    return { error: t("applicationForm.errors.submitApplication") };
  }
  // Redirect based on whether user was anonymous
  if (isAnonymous) {
    // Redirect to email confirmation page
    redirect(
      `/apply/company/${companyId}/job/${jobId}/application/confirm-email?interviewId=${interviewId}`
    );
  } else {
    // Regular users go directly to interview
    redirect(
      `/apply/company/${companyId}/job/${jobId}/candidate-interview/${interviewId}`
    );
  }
};

export const createInterviewsForJobAndReturnFirstInterviewId = async ({
  candidateId,
  jobId,
}: {
  candidateId: string;
  jobId: string;
}) => {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "createInterviewsForJob",
    jobId,
  });

  const { data: jobInterviews, error: jobInterviewsError } = await supabase
    .from("job_interviews")
    .select("id, order_index")
    .eq("custom_job_id", jobId)
    .order("order_index", { ascending: true });

  if (jobInterviewsError) {
    logger.error("Error fetching job interviews", {
      error: jobInterviewsError,
    });
    await logger.flush();
    throw new Error("Error fetching job interviews");
  }

  if (!jobInterviews || jobInterviews.length === 0) {
    logger.error("No job interviews found for job", { jobId });
    await logger.flush();
    throw new Error("No job interviews found for job");
  }

  const { data: candidateJobInterviews, error: createInterviewsError } =
    await supabase
      .from("candidate_job_interviews")
      .insert(
        jobInterviews.map((interview) => ({
          candidate_id: candidateId,
          interview_id: interview.id,
        }))
      )
      .select("id");

  if (createInterviewsError) {
    logger.error("Error creating job interviews", {
      error: createInterviewsError,
    });
    throw new Error("Error creating job interviews");
  }

  const firstInterviewId = candidateJobInterviews
    .sort(
      (a, b) =>
        (jobInterviews.find((interview) => interview.id === a.id)
          ?.order_index || 0) -
        (jobInterviews.find((interview) => interview.id === b.id)
          ?.order_index || 0)
    )
    .map((interview) => interview.id)
    .at(0);

  if (!firstInterviewId) {
    logger.error("Failed to create interview", {
      error: "firstInterviewId is null",
    });
    throw new Error("Failed to create interview");
  }

  return firstInterviewId;
};
