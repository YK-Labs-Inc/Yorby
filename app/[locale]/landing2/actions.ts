"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { trackServerEvent } from "@/utils/tracking/serverUtils";
import { UploadResponse } from "@/utils/types";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export const createJob = async ({
  jobTitle,
  jobDescription,
  companyName,
  companyDescription,
  resume,
  coverLetter,
  miscDocuments,
  captchaToken,
}: {
  jobTitle: string;
  jobDescription: string;
  resume: File | null;
  coverLetter: File | null;
  miscDocuments: File[];
  companyName?: string;
  companyDescription?: string;
  captchaToken?: string;
}) => {
  const supabase = await createSupabaseServerClient();
  const trackingProperties = {
    jobTitle,
    jobDescription,
    companyName,
    companyDescription,
    function: "createJob",
    captchaToken,
  };
  const logger = new Logger().with(trackingProperties);
  logger.info("Starting to create job");
  const t = await getTranslations("errors");
  let userId = "";
  let customJobId = "";
  try {
    const loggedInUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!loggedInUserId) {
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          captchaToken,
        },
      });
      if (error) {
        throw error;
      }
      if (!data.user?.id) {
        throw new Error("User ID not found");
      }
      userId = data.user?.id;
    } else {
      userId = loggedInUserId;
    }
    customJobId = await createCustomJob({
      jobTitle,
      jobDescription,
      companyName,
      companyDescription,
      userId,
    });

    const geminiUploadResponses = await Promise.all([
      resume
        ? processFile({
            file: resume,
            displayName: "Resume",
            customJobId,
            userId,
          })
        : null,
      coverLetter
        ? processFile({
            file: coverLetter,
            displayName: "Cover Letter",
            customJobId,
            userId,
          })
        : null,
      ...miscDocuments.map((file, index) =>
        processFile({
          file,
          displayName: `Miscellaenous file #${index + 1}`,
          customJobId,
          userId,
        })
      ),
    ]);

    await generateCustomJobQuestions({
      customJobId,
      files: geminiUploadResponses
        .filter((response) => response !== null)
        .map((response) => ({
          uri: response.file.uri,
          mimeType: response.file.mimeType,
        })),
      jobTitle,
      jobDescription,
      companyName,
      companyDescription,
    });
  } catch (error: any) {
    logger.error("Error creating job", { error: error.message });
    await logger.flush();
    return {
      error: t("pleaseTryAgain"),
    };
  }
  await trackServerEvent({
    eventName: "job_created",
    userId,
    args: trackingProperties,
  });

  redirect(`/dashboard/jobs/${customJobId}`);
};

export const createCustomJob = async ({
  jobTitle,
  jobDescription,
  companyName,
  companyDescription,
  userId,
}: {
  jobTitle: string;
  jobDescription: string;
  companyName?: string;
  companyDescription?: string;
  userId: string;
}) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_jobs")
    .insert({
      job_title: jobTitle,
      job_description: jobDescription,
      company_name: companyName,
      company_description: companyDescription,
      user_id: userId,
      status: "locked",
    })
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data.id;
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

export const processFile = async ({
  file,
  displayName,
  customJobId,
  userId,
}: {
  file: File;
  displayName: string;
  customJobId: string;
  userId: string;
}) => {
  const filePath = await uploadFileToSupabase({ file, customJobId, userId });
  const blob = new Blob([file], { type: file.type });
  const geminiUploadResponse = await uploadFileToGemini({
    blob,
    displayName,
  });
  await writeToDb(geminiUploadResponse, customJobId, filePath);
  return geminiUploadResponse;
};

export const uploadFileToSupabase = async ({
  file,
  customJobId,
  userId,
}: {
  file: File;
  customJobId: string;
  userId: string;
}) => {
  const supabase = await createSupabaseServerClient();
  const filePath = `${userId}/${customJobId}/${new Date().getTime()}.${file.name.split(".").pop()}`;
  const { error } = await supabase.storage
    .from("custom_job_files")
    .upload(filePath, file);
  if (error) {
    throw error;
  }
  return filePath;
};

export const uploadFileToGemini = async ({
  blob,
  displayName,
}: {
  blob: Blob;
  displayName: string;
}) => {
  const formData = new FormData();
  const metadata = {
    file: { mimeType: blob.type, displayName: displayName },
  };
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  formData.append("file", blob);
  const res2 = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=multipart&key=${GEMINI_API_KEY}`,
    { method: "post", body: formData }
  );
  const geminiUploadResponse = (await res2.json()) as UploadResponse;
  return geminiUploadResponse;
};

export const writeToDb = async (
  uploadResponse: UploadResponse,
  customJobId: string,
  filePath: string
) => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("custom_job_files").insert({
    display_name: uploadResponse.file.displayName,
    file_path: filePath,
    google_file_name: uploadResponse.file.name,
    google_file_uri: uploadResponse.file.uri,
    mime_type: uploadResponse.file.mimeType,
    custom_job_id: customJobId,
  });
  if (error) {
    throw error;
  }
};

export const generateCustomJobQuestions = async ({
  customJobId,
  files,
  jobTitle,
  jobDescription,
  companyName,
  companyDescription,
}: {
  customJobId: string;
  files: {
    uri: string;
    mimeType: string;
  }[];
  jobTitle: string;
  jobDescription: string;
  companyName?: string;
  companyDescription?: string;
}) => {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                question: { type: SchemaType.STRING },
                answerGuidelines: { type: SchemaType.STRING },
              },
              required: ["question", "answerGuidelines"],
            },
          },
        },
        required: ["questions"],
      },
    },
  });

  const result = await model.generateContent([
    `
    You are given a job title, job description, an optional company name and optional company desription. 
    You are an expert job interviewer for the job title and description at the company with the given company description.

    You might also be given a list of files that the candidate has uploaded which contains their previous work experience, education, and other relevant information.

    Use all of this information to generate 20 job interview questions that will help you understand the candidate's skills and experience and their fit for the job.

    Include a variety of questions that will help you understand the candidate's skills and experience and their fit for the job such as behavioral questions, 
    situational questions, technical questions, domain specific questions, past experience questions, and other questions that will help you understand the candidate's skills 
    and experience and their fit for the job.


    With each question, provide an answer guideline that determines whether the answer is correct or not.
    
    For open ended questions (such as behavioral questions or past experience questions), provide a list of criteria that the answer must meet to be considered correct.

    For questions that have specific, correct answers (such as a calculation or technical question), make the answer guidelines be the correct answer.

    Return your response in JSON format with the following schema:
    {
      "questions": [
        {
          "question": "string",
          "answerGuidelines": "string"
        }
      ]
    }


    ## Job Title
    ${jobTitle}

    ## Job Description
    ${jobDescription}

    ## Company Name
    ${companyName}

    ## Company Description
    ${companyDescription}
    `,
    ...files.map((file) => ({
      fileData: {
        fileUri: file.uri,
        mimeType: file.mimeType,
      },
    })),
  ]);
  const response = result.response.text();
  const { questions } = JSON.parse(response) as {
    questions: { question: string; answerGuidelines: string }[];
  };
  await writeCustomJobQuestionsToDb({
    customJobId,
    questions,
  });
};

export const writeCustomJobQuestionsToDb = async ({
  customJobId,
  questions,
}: {
  customJobId: string;
  questions: {
    question: string;
    answerGuidelines: string;
  }[];
}) => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("custom_job_questions").insert(
    questions.map(({ question, answerGuidelines }) => ({
      custom_job_id: customJobId,
      question,
      answer_guidelines: answerGuidelines,
    }))
  );
  if (error) {
    throw error;
  }
};
