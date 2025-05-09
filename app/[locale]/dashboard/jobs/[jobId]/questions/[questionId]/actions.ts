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
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export const submitAnswer = async (prevState: any, formData: FormData) => {
  const jobId = formData.get("jobId") as string;
  const questionId = formData.get("questionId") as string;
  const answer = formData.get("answer") as string;
  const questionPath = formData.get("questionPath") as string;
  const trackingProperties: Record<string, any> = {
    jobId,
    questionId,
    answer,
    function: "submitAnswer",
  };
  const t = await getTranslations("errors");
  const logger = new Logger().with(trackingProperties);
  let errorMessage = "";
  let submissionId = "";
  try {
    logger.info("Submitting answer");
    submissionId = await processAnswer(jobId, questionId, answer);
  } catch (error: unknown) {
    logger.error("Error writing answer to database", { error });
    errorMessage = t("pleaseTryAgain");
  } finally {
    await logger.flush();
  }
  logger.info("Answer submitted");
  await logger.flush();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id) {
    await trackServerEvent({
      eventName: "answer_submitted",
      userId: user.id,
      args: {
        jobId,
        questionId,
        answer,
      },
    });
  }
  revalidatePath(questionPath);
  if (errorMessage) {
    redirect(
      `${questionPath}?error=${errorMessage}`,
    );
  }
  redirect(`${questionPath}?submissionId=${submissionId}`);
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
    const files = await getAllFiles(jobId);
    const prompt = `
    You are an expert job interviewer for a given job title and job description that I will provide you.

    As an expert job interviewer, you will provide a response to the question that I will provide you.

    I will provide you with a job title, job description, an optional company name and optional company description,
    the question, the question's answer guidelines, and potentially some files that that contain details
    about the candidate's previous work experience.

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

  const submission = await writeAnswerToDatabase(jobId, questionId, response, {
    pros: [],
    cons: [],
  });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
) => {
  const logger = new Logger().with({
    jobId: jobId,
    questionId: questionId,
    answer: answer,
    function: "processAnswer",
  });
  const feedback = await generateFeedback(jobId, questionId, answer);
  logger.info("Feedback generated", { feedback });
  const submission = await writeAnswerToDatabase(
    jobId,
    questionId,
    answer,
    feedback,
  );
  logger.info("Wrote answer to database");
  return submission.id;
};

const writeAnswerToDatabase = async (
  jobId: string,
  questionId: string,
  answer: string,
  feedback: { pros: string[]; cons: string[] },
) => {
  const logger = new Logger().with({
    jobId: jobId,
    questionId: questionId,
    answer: answer,
    function: "writeAnswerToDatabase",
  });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("custom_job_question_submissions")
    .insert({
      answer: answer,
      custom_job_question_id: questionId,
      feedback: feedback,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  logger.info("Answer written to database");
  return data;
};

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

const generateFeedback = async (
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
  const job = await fetchJob(jobId);
  const { question, answer_guidelines } = await fetchQuestion(questionId);
  const files = await getAllFiles(jobId);
  const prompt = `
    You are an expert job interviewer for a given job title and job description that I will provide you.

    As an expert job interviewer, you will provide feedback on the candidate's answer to the question.

    I will provide you with the job title, job description, an optional company name and optional company description,
    the question, the question's answer guidelines, the candidate's answer, and potentially some files that that contain details
    about the candidate's previous work experience.

    You will provide feedback on the candidate's answer and provide a list of pros and cons.

    You will provide your feedback in the following format:

    {
      "pros": string[],
      "cons": string[]
    }

    For each con, provide a reason why the candidate's answer is not good and also provide actionable steps on how to improve the candidate's
    answer.
    If possible, use the candidate's previous work experience files to rewrite their answer and address the con that you provided. 

    Do not force yourself to provide feedback on the candidate's answer if you do not have any feedback to provide.

    If the answer is so good without any cons, you can provide an empty cons array and an empty pros array.

    Otherwise, provide a list of pros and cons.

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

    ## Answer
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
            text: "Generate the feedback",
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
      pros: z.array(z.string()),
      cons: z.array(z.string()),
    }),
    loggingContext: {
      jobId,
      questionId,
      function: "generateFeedback",
    },
  });
  const { pros, cons } = result;
  logger.info("Feedback generated", { pros, cons });
  return {
    pros,
    cons,
  };
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

export const getAllFiles = async (jobId: string) => {
  const customJobFiles = await fetchCustomJobFiles(jobId);
  const fileStatuses = await Promise.all(customJobFiles.map(checkFileExists));
  return await Promise.all(
    fileStatuses.map(async ({ file, status }) => {
      if (!status) {
        const uploadResponse = await processMissingFile({ file });
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

const checkFileExists = async (file: Tables<"custom_job_files">) => {
  try {
    const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);
    await fileManager.getFile(file.google_file_name);
    return { file, status: true };
  } catch {
    return { file, status: false };
  }
};

const processMissingFile = async ({
  file,
}: {
  file: Tables<"custom_job_files">;
}) => {
  const { display_name, file_path } = file;
  const data = await downloadFile({
    filePath: file_path,
    bucket: "custom_job_files",
  });
  const uploadResponse = await uploadFileToGemini({
    blob: data,
    displayName: display_name,
  });
  await updateFileInDatabase({
    uploadResponse,
    fileId: file.id,
  });
  return uploadResponse;
};

const updateFileInDatabase = async ({
  uploadResponse,
  fileId,
}: {
  uploadResponse: UploadResponse;
  fileId: string;
}) => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("custom_job_files")
    .update({
      google_file_uri: uploadResponse.file.uri,
      google_file_name: uploadResponse.file.name,
    })
    .eq("id", fileId);
  if (error) {
    throw error;
  }
};
