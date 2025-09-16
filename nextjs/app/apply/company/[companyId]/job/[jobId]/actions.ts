"use server";

import {
  createAdminClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { Logger } from "next-axiom";
import { fetchFilesFromGemini, FileEntry } from "@/utils/ai/gemini";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { generateTextWithFallback } from "@/utils/ai/gemini";
import { headers } from "next/headers";
import { Enums, Tables } from "@/utils/supabase/database.types";
import { uploadFileToGemini } from "@/utils/ai/gemini";
import { trackServerEvent } from "@/utils/tracking/serverUtils";

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
    .select("id, applied_at")
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

export const submitApplication = async (
  _prevState: { error: string },
  formData: FormData
) => {
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = await createAdminClient();
  const t = await getTranslations("apply.api.errors");

  // Parse form data
  const companyId = formData.get("companyId") as string;
  const jobId = formData.get("jobId") as string;
  const selectedFileIdsRaw = formData.get("selectedFileIds") as string;
  const selectedFileIds = selectedFileIdsRaw
    ? selectedFileIdsRaw.split(",").filter((id) => id && id.trim() !== "")
    : [];
  const localFileCount =
    parseInt(formData.get("localFileCount") as string) || 0;
  const additionalInfoRaw = formData.get("additionalInfo") as string;
  const additionalInfo: string[] = additionalInfoRaw
    ? JSON.parse(additionalInfoRaw)
    : [];
  const email = formData.get("email") as string;
  const fullName = formData.get("fullName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const captchaToken = formData.get("captchaToken") as string;
  let interviewId: string | null = null;
  let isAnonymous = false;

  // Get local files from form data
  const localFiles: File[] = [];
  for (let i = 0; i < localFileCount; i++) {
    const file = formData.get(`localFile_${i}`) as File | null;
    if (file) {
      localFiles.push(file);
    }
  }

  const logger = new Logger().with({
    function: "submitApplication",
    companyId,
    jobId,
    selectedFileCount: selectedFileIds.length,
    localFileCount: localFiles.length,
  });

  try {
    if (!companyId || !jobId) {
      throw new Error(t("missingRequiredFields"));
    }

    // Validate email format if provided
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        logger.info("Invalid email format provided", { email: email.substring(0, 3) + "..." });
        return { error: t("invalidEmailFormat") };
      }
    }

    logger.info("Processing application submission", {
      companyId,
      jobId,
      selectedFileCount: selectedFileIds.length,
      localFileCount: localFiles.length,
    });

    const { data, error } = await supabaseAdmin.rpc("get_user_id_by_email", {
      p_email: email,
    });

    if (error) {
      logger.error("Failed to get user ID by email", { error });
      throw new Error(t("Failed to get user ID by email"));
    }

    if (data) {
      await trackServerEvent({
        userId: data,
        eventName: "existing_user_applied",
        args: {
          jobId,
          companyId,
        },
      });
      return { error: t("appliedWithEmailOfExistingUser") };
    }

    // Check if user is authenticated
    let user = await getServerUser();

    if (!user) {
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          captchaToken,
        },
      });
      if (error || !data.user) {
        logger.error("Failed to sign in anonymously", { error });
        throw new Error(t("Failed to sign in anonymously"));
      }
      user = data.user;
    }

    // Check if this is an anonymous user (no email)
    isAnonymous = user.is_anonymous || false;

    // Upload local files to storage and create user_files records
    const uploadedLocalFileIds: string[] = [];
    if (localFiles.length > 0) {
      logger.info("Uploading local files", { count: localFiles.length });

      for (const file of localFiles) {
        try {
          // Upload to Supabase Storage
          const fileExt = file.name.split(".").pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("user-files").upload(fileName, file);

          if (uploadError) {
            logger.error("Supabase upload error", {
              error: uploadError,
              fileName: file.name,
            });
            throw new Error(t("uploadFailed"));
          }

          // Upload to Gemini
          const geminiResponse = await uploadFileToGemini({
            blob: file,
            displayName: file.name,
          });

          if (!geminiResponse.file) {
            logger.error("Gemini upload failed", { fileName: file.name });
            throw new Error(t("uploadFailed"));
          }

          // Create user_files entry with Gemini info
          const { data: fileRecord, error: dbError } = await supabase
            .from("user_files")
            .insert({
              user_id: user.id,
              display_name: file.name,
              file_path: uploadData.path,
              bucket_name: "user-files",
              mime_type: file.type,
              google_file_name: geminiResponse.file.name,
              google_file_uri: geminiResponse.file.uri,
              added_to_memory: false,
            })
            .select("id")
            .single();

          if (dbError) {
            logger.error("Database insert error", {
              error: dbError,
              fileName: file.name,
            });
            throw new Error(t("createCandidateApplication"));
          }

          uploadedLocalFileIds.push(fileRecord.id);
          logger.info("File uploaded successfully", {
            fileId: fileRecord.id,
            fileName: file.name,
            geminiFileName: geminiResponse.file.name,
          });
        } catch (error) {
          logger.error("File upload error", {
            error,
            fileName: file.name,
          });
          throw new Error(t("uploadFailed"));
        }
      }
    }

    // Combine selected file IDs and uploaded local file IDs
    const allFileIds = [...selectedFileIds, ...uploadedLocalFileIds];

    // Only fetch and process files if there are files to process
    if (allFileIds.length > 0) {
      // Fetch the files to check if they need Gemini upload
      const { data: userFiles, error: filesError } = await supabase
        .from("user_files")
        .select("*")
        .in("id", allFileIds);

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
      })
      .select()
      .single();

    if (candidateError) {
      logger.error("Failed to create candidate", { error: candidateError });
      throw new Error(t("createCandidateApplication"));
    }

    // Create candidate_application_files entries (only if there are files to link)
    if (allFileIds.length > 0) {
      const selectedFileEntries = allFileIds.map((fileId: string) => ({
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

    // Create candidate_application_additional_info entries (only if there is additional info)
    if (additionalInfo.length > 0) {
      const additionalInfoEntries = additionalInfo.map((info: string) => ({
        candidate_id: candidate.id,
        value: info,
      }));

      const { error: additionalInfoError } = await supabase
        .from("candidate_application_additional_info")
        .insert(additionalInfoEntries);

      if (additionalInfoError) {
        logger.error("Failed to save additional info", {
          error: additionalInfoError,
        });
        throw new Error(t("saveAdditionalInfo"));
      }
    }

    logger.info("Application submitted successfully", {
      candidateId: candidate.id,
      totalFileCount: allFileIds.length,
      selectedFileCount: selectedFileIds.length,
      localFileCount: uploadedLocalFileIds.length,
      additionalInfoCount: additionalInfo.length,
    });

    // Track application submission
    await trackServerEvent({
      userId: user.id,
      eventName: "application_submitted",
      args: {
        jobId,
        companyId,
        candidateId: candidate.id,
        filesCount: allFileIds.length,
        additionalInfoCount: additionalInfo.filter((info) => info.trim())
          .length,
        isAnonymous,
        hasEmail: !!email,
      },
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
    return { error: t("generic") };
  }
  // Redirect based on whether user was anonymous
  if (isAnonymous) {
    redirect(
      `/apply/company/${companyId}/job/${jobId}/application/confirm-email${
        interviewId ? `?interviewId=${interviewId}` : ""
      }`
    );
  } else {
    if (interviewId) {
      redirect(
        `/apply/company/${companyId}/job/${jobId}/application/confirm-email?interviewId=${interviewId}`
      );
    } else {
      // Regular users go directly to interview
      redirect(
        `/apply/company/${companyId}/job/${jobId}/application/submitted`
      );
    }
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
    logger.info("No job interviews found for job", { jobId });
    await logger.flush();
    return null;
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
