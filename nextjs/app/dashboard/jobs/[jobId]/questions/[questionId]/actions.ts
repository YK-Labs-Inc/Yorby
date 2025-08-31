"use server";

import {
  generateObjectWithFallback,
  uploadFileToGemini,
} from "@/utils/ai/gemini";
import { Tables } from "@/utils/supabase/database.types";
import {
  createSupabaseServerClient,
  downloadFile,
} from "@/utils/supabase/server";
import { trackServerEvent } from "@/utils/tracking/serverUtils";
import { UploadResponse } from "@/utils/types";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { CoachLowScoreNotification } from "@/components/email/CoachLowScoreNotification";
import { headers } from "next/headers";

export const submitAnswer = async (prevState: any, formData: FormData) => {
  const jobId = formData.get("jobId") as string;
  const questionId = formData.get("questionId") as string;
  const answer = formData.get("answer") as string;
  const questionPath = formData.get("questionPath") as string;
  const bucketName = formData.get("bucketName") as string | null;
  const filePath = formData.get("filePath") as string | null;
  const audioRecordingDuration = formData.get("audioRecordingDuration") as
    | string
    | null;
  const trackingProperties: Record<string, any> = {
    jobId,
    questionId,
    answer,
    bucketName,
    filePath,
    audioRecordingDuration,
    function: "submitAnswer",
  };
  const t = await getTranslations("errors");
  const logger = new Logger().with(trackingProperties);
  let errorMessage = "";
  let submissionId = "";
  try {
    logger.info("Submitting answer");
    submissionId = await processAnswer(
      jobId,
      questionId,
      answer,
      bucketName,
      filePath,
      audioRecordingDuration,
    );
  } catch (error: unknown) {
    logger.error("Error writing answer to database", { error });
    errorMessage = t("pleaseTryAgain");
  } finally {
    await logger.flush();
  }
  logger.info("Answer submitted");
  await logger.flush();
  const user = await getServerUser();
  if (user?.id) {
    await trackServerEvent({
      eventName: "answer_submitted",
      userId: user.id,
      args: {
        jobId,
        questionId,
        answer,
        bucketName,
        filePath,
        audioRecordingDuration,
      },
    });
  }
  if (errorMessage) {
    redirect(
      `${questionPath}?error=${errorMessage}`,
    );
  }
  return {
    submissionId,
    filePath,
  };
};

export const generateAnswer = async (prevState: any, formData: FormData) => {
  const jobId = formData.get("jobId") as string;
  const questionId = formData.get("questionId") as string;
  const questionPath = formData.get("questionPath") as string;
  const logger = new Logger().with({
    jobId: jobId,
    questionId: questionId,
    function: "generateAnswer",
  });
  logger.info("Generating answer");
  let response = "";
  let errorMessage = "";
  try {
    const job = await fetchJob(jobId);
    const { question, answer_guidelines } = await fetchQuestion(questionId);
    const files = await getCustomJobFiles(jobId);
    const knowledgeBaseFiles = await fetchCoachKnowledgeBaseFiles(jobId);
    const coachKnowledgeBase = await fetchCoachKnowledgeBaseForJob(jobId);
    const prompt = `
    You are an expert job interviewer for a given job title and job description that I will provide you.

    As an expert job interviewer, you will provide a response to the question that I will provide you.

    I will provide you with a job title, job description, an optional company name and optional company description,
    the question, the question's answer guidelines, and potentially some files that that contain details
    about the candidate's previous work experience.

    ${
      coachKnowledgeBase
        ? `The question you are trying to generate an answer for is a part of
        a specific coaching program. I will also provide you additional context and information
        specific to this job/program that should be considered when generating the answer. 
        This knowledge base may contain company-specific information, proprietary frameworks,
        role-specific expectations, or other relevant criteria that the coach wants candidates
        to incorporate in their answers.

        Use this additional information to generate an answer that aligns with the program's requirements.
        `
        : ""
    }

    You will provide a response to the question in the following format:

    {
      "answer": string
    }

    If the user is unqualified for the job, feel free to stretch the truth and make the user seem qualified for the job.
    It is okay to make up information about the user's experience if it is not provided in the files. Do this within reason to
    make the user seem qualified for the job without being completely unrealistic. If you do make up information, make sure to
    provide a disclaimer at the end of your response that you made up the information to make the user seem qualified for the job.
    An appropriate di




    ## Job Title
    ${job.job_title}

    ## Job Description
    ${job.job_description}

    ${job.company_name ? `## Company Name\n${job.company_name}` : ""}

    ${
      job.company_description
        ? `## Company Description\n${job.company_description}`
        : ""
    }

    ## Question
    ${question}

    ## Answer Guidelines
    ${answer_guidelines}

    ${
      coachKnowledgeBase
        ? `## Program-Specific Knowledge Base\n${coachKnowledgeBase}`
        : ""
    }
    `;
    const result = await generateObjectWithFallback({
      systemPrompt: prompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Generate the answer",
            },
            ...files.map((f) => ({
              type: "file" as "file",
              data: f.fileData.fileUri,
              mimeType: f.fileData.mimeType,
            })),
            ...knowledgeBaseFiles.map((f) => ({
              type: "file" as "file",
              data: f.fileData.fileUri,
              mimeType: f.fileData.mimeType,
            })),
          ],
        },
      ],
      schema: z.object({
        answer: z.string(),
      }),
      loggingContext: {
        jobId,
        questionId,
        function: "generateAnswer",
      },
    });
    const { answer } = result;
    response = answer;
    logger.info("Answer generated", { answer });
    await logger.flush();
  } catch (error: unknown) {
    logger.error("Error generating answer", { error });
    await logger.flush();
    const translation = await getTranslations("errors");
    errorMessage = translation("pleaseTryAgain");
  }

  const submission = await writeAnswerToDatabase(
    jobId,
    questionId,
    response,
    {
      pros: [],
      cons: [],
      correctness_score: 100,
    },
    null,
    null,
    null,
  );

  const user = await getServerUser();
  if (user?.id) {
    await trackServerEvent({
      eventName: "answer_generated",
      userId: user.id,
      args: {
        jobId,
        questionId,
      },
    });
  }
  if (errorMessage) {
    redirect(`${questionPath}?error=${errorMessage}`);
  }
  redirect(`${questionPath}?submissionId=${submission.id}`);
};

const processAnswer = async (
  jobId: string,
  questionId: string,
  answer: string,
  bucketName: string | null,
  filePath: string | null,
  audioRecordingDuration: string | null,
) => {
  const logger = new Logger().with({
    jobId: jobId,
    questionId: questionId,
    answer: answer,
    bucketName,
    filePath,
    audioRecordingDuration,
    function: "processAnswer",
  });
  const feedback = await generateFeedback(jobId, questionId, answer);
  logger.info("Feedback generated", { feedback });
  const submission = await writeAnswerToDatabase(
    jobId,
    questionId,
    answer,
    feedback,
    bucketName,
    filePath,
    audioRecordingDuration,
  );
  logger.info("Wrote answer to database");
  return submission.id;
};

const sendCoachLowScoreNotification = async (
  { job, questionId, feedback, submissionId, studentUserId }: {
    job: any;
    questionId: string;
    feedback: { pros: string[]; cons: string[]; correctness_score: number };
    submissionId: string;
    studentUserId: string;
  },
) => {
  const logger = new Logger().with({
    function: "sendCoachLowScoreNotification",
  });
  try {
    logger.info("Starting coach low score notification", {
      jobId: job.id,
      questionId,
      submissionId,
    });
    if (!job.coach_id) {
      logger.info("No coach_id on job, skipping notification");
      await logger.flush();
      return;
    }
    const adminClient = await createAdminClient();
    // Get coach user_id from coach_id
    const { data: coachRow } = await adminClient
      .from("coaches")
      .select("user_id")
      .eq("id", job.coach_id)
      .single();
    if (!coachRow?.user_id) {
      logger.info("No user_id found for coach");
      await logger.flush();
      return;
    }
    // Get coach email
    const { data: coachUser } = await adminClient.auth.admin.getUserById(
      coachRow.user_id,
    );
    const coachEmail = coachUser?.user?.email;
    if (!coachEmail) {
      logger.info("No email found for coach");
      await logger.flush();
      return;
    }
    // Get student name
    const { data: studentUser } = await adminClient.auth.admin.getUserById(
      studentUserId,
    );
    const studentName = studentUser?.user?.user_metadata?.full_name ||
      studentUser?.user?.email || "Student";
    // Get question text
    const questionRow = await fetchQuestion(questionId);
    // Build review link - using new programs path with search params
    const baseUrl = (await headers()).get("origin");
    const reviewLink =
      `${baseUrl}/dashboard/coach-admin/students/${job.user_id}/programs?job=${job.id}&tab=questions&item=${questionId}&submissionId=${submissionId}`;
    // Send email
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from: "Yorby <notifications@noreply.yorby.ai>",
      to: [coachEmail],
      subject:
        `Student ${studentName} received a low score (${feedback.correctness_score}%) on a question`,
      react: CoachLowScoreNotification({
        studentName,
        jobTitle: job.job_title,
        questionText: questionRow.question,
        score: feedback.correctness_score,
        reviewLink,
        pros: feedback.pros,
        cons: feedback.cons,
      }),
    });
    logger.info("Sent low score email to coach", {
      coachEmail,
      studentName,
      reviewLink,
    });
  } catch (e) {
    logger.error("Error sending low score email to coach", { error: e });
  } finally {
    await logger.flush();
  }
};

const writeAnswerToDatabase = async (
  jobId: string,
  questionId: string,
  answer: string,
  feedback: { pros: string[]; cons: string[]; correctness_score: number },
  bucketName: string | null,
  filePath: string | null,
  audioRecordingDuration: string | null,
) => {
  const logger = new Logger().with({
    jobId: jobId,
    questionId: questionId,
    answer: answer,
    bucketName,
    filePath,
    audioRecordingDuration,
    function: "writeAnswerToDatabase",
  });
  const user = await getServerUser();
  if (!user?.id) {
    throw new Error("User not found");
  }
  const supabase = await createSupabaseServerClient();

  // Convert duration to number if provided
  const durationInSeconds = audioRecordingDuration
    ? parseInt(audioRecordingDuration, 10)
    : null;

  // First write the answer to custom_job_question_submissions
  const { data: submission, error: submissionError } = await supabase
    .from("custom_job_question_submissions")
    .insert({
      answer: answer,
      custom_job_question_id: questionId,
      feedback, // Keep for backward compatibility
      audio_bucket: bucketName,
      audio_file_path: filePath,
      audio_recording_duration: durationInSeconds,
      user_id: user.id,
    })
    .select()
    .single();

  if (submissionError) {
    throw submissionError;
  }

  try {
    // Then write the feedback to custom_job_question_submission_feedback
    const { error: feedbackError } = await supabase
      .from("custom_job_question_submission_feedback")
      .insert({
        submission_id: submission.id,
        feedback_role: "ai",
        pros: feedback.pros,
        cons: feedback.cons,
        correctness_score: feedback.correctness_score,
      });

    if (feedbackError) {
      logger.error("Error writing feedback to database", {
        error: feedbackError,
      });
    }
  } catch (error: unknown) {
    logger.error("Error writing feedback to database", { error });
    await logger.flush();
  }

  // Send email to coach if score is below threshold
  if (feedback.correctness_score < LOW_SCORE_THRESHOLD) {
    const job = await fetchJob(jobId);
    if (job.coach_id) {
      await sendCoachLowScoreNotification({
        job,
        questionId,
        feedback,
        submissionId: submission.id,
        studentUserId: user.id,
      });
    }
  }

  logger.info("Answer and feedback written to database");
  await logger.flush();
  return submission;
};

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

const fetchQuestionSampleAnswers = async (questionId: string) => {
  let logger = new Logger().with({
    questionId,
    function: "fetchQuestionSampleAnswers",
  });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_job_question_sample_answers")
    .select("*")
    .eq("question_id", questionId);

  if (error) {
    logger.error("Error fetching question sample answers", { error });
    await logger.flush();
    return [];
  }
  logger.info("Question sample answers fetched", { data });
  await logger.flush();
  return data;
};

const LOW_SCORE_THRESHOLD = 70;

export const generateFeedback = async (
  jobId: string,
  questionId: string,
  answer: string,
) => {
  const trackingProperties = {
    questionId,
    answer,
    function: "generateFeedback",
  };
  const logger = new Logger().with(trackingProperties);

  // Step 1: Fetch all context
  const job = await fetchJob(jobId);
  const { question, answer_guidelines } = await fetchQuestion(questionId);
  const coachKnowledgeBase = await fetchCoachKnowledgeBaseForJob(jobId);
  const sampleAnswers = await fetchQuestionSampleAnswers(questionId);
  const files = await getCustomJobFiles(jobId);
  const knowledgeBaseFiles = await fetchCoachKnowledgeBaseFiles(jobId);

  // Step 2: Extract core criteria from answer guidelines
  const coreCriteria = await extractCoreCriteria(answer_guidelines, logger);

  // Step 3: Grade against core criteria
  const criteriaGrading = await gradeAgainstCriteria(
    job,
    question,
    answer,
    coreCriteria,
    [...files, ...knowledgeBaseFiles],
    logger,
  );

  // Step 4: Compare with sample answers (if any)
  const sampleComparison = sampleAnswers.length > 0
    ? await compareWithSampleAnswers(
      job,
      question,
      answer,
      sampleAnswers,
      [...files, ...knowledgeBaseFiles],
      logger,
    )
    : { strengths: [], weaknesses: [] };

  // Step 5: Apply coach knowledge base (if available)
  const coachFeedback = coachKnowledgeBase
    ? await applyCoachKnowledgeBase(
      job,
      question,
      answer,
      coachKnowledgeBase,
      [...files, ...knowledgeBaseFiles],
      logger,
    )
    : { coach_feedback: [] };

  // Step 6: Synthesize final feedback
  const finalFeedback = await synthesizeFinalFeedback(
    criteriaGrading,
    sampleComparison,
    coachFeedback,
    logger,
  );

  logger.info("Feedback generated", finalFeedback);
  return finalFeedback;
};

// Step 1: Extract core criteria from answer guidelines
const extractCoreCriteria = async (
  answerGuidelines: string,
  logger: Logger,
) => {
  const prompt = `
    You are an expert at analyzing interview question answer guidelines.
    
    Given the following answer guidelines (which may contain verbose explanations and context), 
    extract the essential, core criteria that define what makes a "correct" answer.
    
    Focus on:
    - Specific requirements that must be met
    - Key elements that should be included
    - Clear, measurable criteria
    
    Ignore fluff, examples, and explanatory text. Return only the essential grading criteria.
    
    Return your response in the following format:
    {
      "core_criteria": string[]
    }
    
    ## Answer Guidelines
    ${answerGuidelines}
  `;

  const result = await generateObjectWithFallback({
    systemPrompt: prompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract the core criteria for grading this answer",
          },
        ],
      },
    ],
    schema: z.object({
      core_criteria: z.array(z.string()),
    }),
    loggingContext: {
      function: "extractCoreCriteria",
    },
  });

  logger.info("Core criteria extracted", result);
  return result.core_criteria;
};

// Step 2: Grade against core criteria
const gradeAgainstCriteria = async (
  job: any,
  question: string,
  answer: string,
  coreCriteria: string[],
  files: {
    fileData: {
      fileUri: string;
      mimeType: string;
    };
  }[],
  logger: Logger,
) => {
  const prompt = `
    You are an expert job interviewer grading a candidate's answer against specific criteria.
    
    Grade the candidate's answer strictly against the provided core criteria.
    For each criterion, determine if it was met, partially met, or not met.
    
    Provide a preliminary correctness score (0-100) based on how well the answer meets the criteria.
    
    Return your response in the following format:
    {
      "criteria_met": string[],
      "criteria_partially_met": string[],
      "criteria_missed": string[],
      "preliminary_score": number
    }
    
    ## Job Context
    **Job Title:** ${job.job_title}
    **Job Description:** ${job.job_description}
    ${job.company_name ? `**Company:** ${job.company_name}` : ""}
    
    ## Question
    ${question}
    
    ## Core Criteria
    ${
    coreCriteria.map((criterion, index) => `${index + 1}. ${criterion}`).join(
      "\n",
    )
  }
    
    ## Candidate's Answer
    ${answer}
  `;

  const result = await generateObjectWithFallback({
    systemPrompt: prompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Grade this answer against the core criteria",
          },
          ...files.map((f) => ({
            type: "file" as "file",
            data: f.fileData.fileUri,
            mimeType: f.fileData.mimeType,
          })),
        ],
      },
    ],
    schema: z.object({
      criteria_met: z.array(z.string()),
      criteria_partially_met: z.array(z.string()),
      criteria_missed: z.array(z.string()),
      preliminary_score: z.number().min(0).max(100),
    }),
    loggingContext: {
      function: "gradeAgainstCriteria",
    },
  });

  logger.info("Criteria grading completed", result);
  return result;
};

// Step 3: Compare with sample answers
const compareWithSampleAnswers = async (
  job: any,
  question: string,
  answer: string,
  sampleAnswers: any[],
  files: {
    fileData: {
      fileUri: string;
      mimeType: string;
    };
  }[],
  logger: Logger,
) => {
  const prompt = `
    You are an expert job interviewer comparing a candidate's answer to high-quality sample answers.
    
    Compare the candidate's answer to the provided sample answers and identify:
    - Strengths: What the candidate did well compared to the samples
    - Weaknesses: Actual problems or gaps in the candidate's answer (not just "could be better" suggestions)
    
    IMPORTANT: For weaknesses, only identify genuine issues or significant gaps, not minor improvements.
    Examples of valid weaknesses: missing key information, incorrect facts, poor structure, inappropriate tone
    Examples of NOT weaknesses: "could have added more detail", "might consider mentioning X"
    
    Do not require the candidate's answer to match the samples exactly, but use them as benchmarks for quality.
    
    Return your response in the following format:
    {
      "strengths": string[],
      "weaknesses": string[]
    }
    
    ## Job Context
    **Job Title:** ${job.job_title}
    **Job Description:** ${job.job_description}
    
    ## Question
    ${question}
    
    ## Sample Answers
    ${
    sampleAnswers.map((sa, index) =>
      `### Sample Answer ${index + 1}\n${sa.answer}`
    ).join("\n\n")
  }
    
    ## Candidate's Answer
    ${answer}
  `;

  const result = await generateObjectWithFallback({
    systemPrompt: prompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Compare this answer to the sample answers",
          },
          ...files.map((f) => ({
            type: "file" as "file",
            data: f.fileData.fileUri,
            mimeType: f.fileData.mimeType,
          })),
        ],
      },
    ],
    schema: z.object({
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
    loggingContext: {
      function: "compareWithSampleAnswers",
    },
  });

  logger.info("Sample answer comparison completed", result);
  return result;
};

// Step 4: Apply coach knowledge base
const applyCoachKnowledgeBase = async (
  job: any,
  question: string,
  answer: string,
  coachKnowledgeBase: string,
  files: {
    fileData: {
      fileUri: string;
      mimeType: string;
    };
  }[],
  logger: Logger,
) => {
  const prompt = `
    You are evaluating a candidate's answer using program-specific knowledge and frameworks.
    
    The coach has provided specific guidance, criteria, company-specific information, or methodologies 
    for this particular job/program that should be considered when evaluating interview answers. 
    This knowledge base may contain:
    - Company-specific values or culture
    - Role-specific expectations
    - Proprietary frameworks or methodologies
    - Additional grading criteria
    - Industry-specific requirements
    
    Use this knowledge to identify any actual issues or problems with the candidate's answer 
    based on these specific requirements.
    
    Focus on identifying genuine problems or violations of the specified criteria, not general suggestions.
    
    Return your response in the following format:
    {
      "coach_feedback": string[]
    }
    
    ## Job Context
    **Job Title:** ${job.job_title}
    **Job Description:** ${job.job_description}
    
    ## Question
    ${question}
    
    ## Program-Specific Knowledge Base
    ${coachKnowledgeBase}
    
    ## Candidate's Answer
    ${answer}
  `;

  const result = await generateObjectWithFallback({
    systemPrompt: prompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Evaluate this answer using the coach's knowledge base",
          },
          ...files.map((f) => ({
            type: "file" as "file",
            data: f.fileData.fileUri,
            mimeType: f.fileData.mimeType,
          })),
        ],
      },
    ],
    schema: z.object({
      coach_feedback: z.array(z.string()),
    }),
    loggingContext: {
      function: "applyCoachKnowledgeBase",
    },
  });

  logger.info("Coach knowledge base evaluation completed", result);
  return result;
};

// Step 5: Synthesize final feedback
const synthesizeFinalFeedback = async (
  criteriaGrading: any,
  sampleComparison: any,
  coachFeedback: any,
  logger: Logger,
) => {
  const prompt = `
    You are synthesizing multiple evaluations of a candidate's interview answer into final feedback.
    
    Based on the provided evaluations, create comprehensive feedback with:
    - Pros: What the candidate did well (be specific and encouraging)
    - Cons: ONLY include actual problems, errors, or incorrect parts of the answer that need fixing
    - Correctness Score: A final score (0-100) based on all evaluations
    
    IMPORTANT GUIDELINES FOR CONS:
    - A "con" is NOT a general suggestion or "nice to have" improvement
    - A "con" is ONLY when something in the answer is actively wrong, incorrect, or harmful
    - Examples of valid cons: factual errors, contradictory statements, completely missing required criteria, inappropriate responses
    - Examples of NOT cons: "could have mentioned X", "would be better if Y", "consider adding Z"
    - If the answer is generally good but could be enhanced, DO NOT list those enhancements as cons
    - It is perfectly acceptable to have an empty cons array if nothing is actively wrong
    
    For any cons you do identify, provide specific, actionable advice on how to fix the actual problem.
    Use the second person ("you") when addressing the candidate.
    
    Return your response in the following format:
    {
      "pros": string[],
      "cons": string[],
      "correctness_score": number
    }
    
    ## Criteria-Based Grading
    **Criteria Met:** ${criteriaGrading.criteria_met.join(", ") || "None"}
    **Criteria Partially Met:** ${
    criteriaGrading.criteria_partially_met.join(", ") || "None"
  }
    **Criteria Missed:** ${criteriaGrading.criteria_missed.join(", ") || "None"}
    **Preliminary Score:** ${criteriaGrading.preliminary_score}
    
    ## Sample Answer Comparison
    **Strengths:** ${sampleComparison.strengths.join(", ") || "None identified"}
    **Weaknesses:** ${
    sampleComparison.weaknesses.join(", ") || "None identified"
  }
    
    ## Coach Feedback
    **Additional Insights:** ${
    coachFeedback.coach_feedback.join(", ") || "None provided"
  }
  `;

  const result = await generateObjectWithFallback({
    systemPrompt: prompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Synthesize all evaluations into final feedback",
          },
        ],
      },
    ],
    schema: z.object({
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      correctness_score: z.number().min(0).max(100),
    }),
    loggingContext: {
      function: "synthesizeFinalFeedback",
    },
  });

  logger.info("Final feedback synthesis completed", result);
  return result;
};

const fetchJob = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

const fetchQuestion = async (questionId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_job_questions")
    .select("*")
    .eq("id", questionId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const fetchCustomJobFiles = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_job_files")
    .select("*")
    .eq("custom_job_id", jobId);

  if (error) {
    throw error;
  }

  return data;
};

export const getCustomJobFiles = async (jobId: string) => {
  const customJobFiles = await fetchCustomJobFiles(jobId);
  const fileStatuses = await Promise.all(customJobFiles.map(checkFileExists));
  return await Promise.all(
    fileStatuses.map(async ({ file, status }) => {
      if (!status) {
        const uploadResponse = await processMissingFile({
          file,
          bucket: "custom_job_files",
          tableName: "custom_job_files",
        });
        return {
          fileData: {
            fileUri: uploadResponse.file.uri,
            mimeType: uploadResponse.file.mimeType,
          },
        };
      }
      return {
        fileData: {
          fileUri: file.google_file_uri,
          mimeType: file.mime_type,
        },
      };
    }),
  );
};

type FileWithGeminiInfo = {
  id: string;
  display_name: string;
  file_path: string;
  google_file_name: string;
  google_file_uri: string;
  mime_type: string;
};

const checkFileExists = async <T extends FileWithGeminiInfo>(file: T) => {
  try {
    const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);
    await fileManager.getFile(file.google_file_name);
    return { file, status: true };
  } catch {
    return { file, status: false };
  }
};

const processMissingFile = async <T extends FileWithGeminiInfo>({
  file,
  bucket,
  tableName,
}: {
  file: T;
  bucket: string;
  tableName: "custom_job_files" | "custom_job_knowledge_base_files";
}) => {
  const { display_name, file_path } = file;
  const data = await downloadFile({
    filePath: file_path,
    bucket,
  });
  const uploadResponse = await uploadFileToGemini({
    blob: data,
    displayName: display_name,
  });
  await updateFileInDatabase({
    uploadResponse,
    fileId: file.id,
    tableName,
  });
  return uploadResponse;
};

const updateFileInDatabase = async ({
  uploadResponse,
  fileId,
  tableName,
}: {
  uploadResponse: UploadResponse;
  fileId: string;
  tableName: "custom_job_files" | "custom_job_knowledge_base_files";
}) => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from(tableName)
    .update({
      google_file_uri: uploadResponse.file.uri,
      google_file_name: uploadResponse.file.name,
    })
    .eq("id", fileId);
  if (error) {
    throw error;
  }
};

const fetchCoachKnowledgeBaseForJob = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    jobId,
    function: "fetchCoachKnowledgeBaseForJob",
  });

  try {
    // First check if there's a custom job knowledge base for this specific job
    const { data: customJobKnowledgeBase, error: customJobKBError } =
      await supabase
        .from("custom_job_knowledge_base")
        .select("knowledge_base")
        .eq("custom_job_id", jobId)
        .single();

    if (!customJobKBError && customJobKnowledgeBase?.knowledge_base) {
      logger.info("Found custom job knowledge base", { jobId });
      await logger.flush();
      return customJobKnowledgeBase.knowledge_base;
    }

    // Fallback to coach's general knowledge base if no job-specific one exists
    const customJob = await fetchCustomJob(jobId);
    if (!customJob.coach_id) {
      logger.info("No coach_id found for job", { jobId });
      await logger.flush();
      return null;
    }

    const coachKnowledgeBase = await fetchCoachKnowledgeBase(
      customJob.coach_id,
    );
    logger.info("Using coach's general knowledge base", {
      jobId,
      coachId: customJob.coach_id,
      hasKnowledgeBase: !!coachKnowledgeBase,
    });
    await logger.flush();
    return coachKnowledgeBase;
  } catch (error) {
    logger.error("Error fetching knowledge base", { error, jobId });
    await logger.flush();
    return null;
  }
};

const fetchCustomJob = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

const fetchCoachKnowledgeBase = async (coachId: string) => {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    coachId: coachId,
    function: "fetchCoachKnowledgeBase",
  });
  const { data: coachData, error: coachError } = await supabase
    .from("coaches")
    .select("user_id")
    .eq("id", coachId)
    .single();
  if (coachError) {
    logger.error("Error fetching coach:", { error: coachError.message });
    await logger.flush();
    return null;
  }
  logger.info("Coach data fetched:", {
    coachData,
  });
  const userId = coachData.user_id;
  const { data, error } = await supabase
    .from("user_knowledge_base")
    .select("*")
    .eq("user_id", userId);
  if (error) {
    logger.error("Error fetching user knowledge base:", {
      error: error.message,
    });
    await logger.flush();
    return null;
  }
  logger.info("Coach knowledge base fetched:", {
    userId: userId,
    data,
  });
  await logger.flush();
  return data.map((d) => d.knowledge_base).join("\n");
};

const fetchCoachKnowledgeBaseFiles = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    jobId,
    function: "fetchCoachKnowledgeBaseFiles",
  });

  try {
    // Fetch knowledge base files for this job
    const { data: kbFiles, error } = await supabase
      .from("custom_job_knowledge_base_files")
      .select("*")
      .eq("custom_job_id", jobId);

    if (error) {
      logger.error("Error fetching knowledge base files", { error });
      await logger.flush();
      return [];
    }

    if (!kbFiles || kbFiles.length === 0) {
      logger.info("No knowledge base files found", { jobId });
      await logger.flush();
      return [];
    }

    // Check file status and prepare for use
    const fileStatuses = await Promise.all(kbFiles.map(checkFileExists));

    const processedFiles = await Promise.all(
      fileStatuses.map(async ({ file, status }) => {
        if (!status) {
          try {
            const uploadResponse = await processMissingFile({
              file,
              bucket: "custom-job-knowledge-base-files",
              tableName: "custom_job_knowledge_base_files",
            });
            return {
              fileData: {
                fileUri: uploadResponse.file.uri,
                mimeType: uploadResponse.file.mimeType,
              },
            };
          } catch (error) {
            logger.error("Error re-uploading file to Gemini", {
              error,
              fileId: file.id,
            });
            return null;
          }
        }

        return {
          fileData: {
            fileUri: file.google_file_uri,
            mimeType: file.mime_type,
          },
        };
      }),
    );

    logger.info("Fetched knowledge base files", {
      jobId,
      filesCount: processedFiles.filter((f) => f !== null).length,
    });
    await logger.flush();

    return processedFiles.filter((f) => f !== null);
  } catch (error) {
    logger.error("Error in fetchCoachKnowledgeBaseFiles", { error });
    await logger.flush();
    return [];
  }
};

export async function markQuestionAnswerOnboardingViewed() {
  const user = await getServerUser();

  const logger = new Logger().with({
    userId: user?.id,
    function: "markQuestionAnswerOnboardingViewed",
  });

  if (!user) {
    logger.error("Error fetching user");
    await logger.flush();
    redirect("/login");
  }

  const supabase = await createAdminClient();
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      "viewed_question_answer_onboarding": true,
    },
  });

  if (error) {
    logger.error("Error updating user metadata:", { error: error.message });
    await logger.flush();
    return { error: "Failed to update onboarding status." };
  }

  logger.info(
    "Successfully updated question answer onboarding status for user:",
    {
      userId: user.id,
      data,
    },
  );
  await logger.flush();
  return { success: true };
}

export async function markMockInterviewOnboardingViewed() {
  const user = await getServerUser();

  const logger = new Logger().with({
    userId: user?.id,
    function: "markMockInterviewOnboardingViewed",
  });

  if (!user) {
    logger.error("Error fetching user");
    await logger.flush();
    redirect("/login");
  }

  const supabase = await createAdminClient();
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      "viewed_mock_interview_onboarding": true,
    },
  });

  if (error) {
    logger.error("Error updating user metadata:", { error: error.message });
    await logger.flush();
  }

  logger.info(
    "Successfully updated mock interview onboarding status for user:",
    {
      userId: user.id,
      data,
    },
  );
  await logger.flush();
}
