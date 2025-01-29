"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { encodedRedirect } from "@/utils/utils";
import { revalidatePath } from "next/cache";
import { getAllFiles } from "./questions/[questionId]/actions";
import { SchemaType } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeCustomJobQuestionsToDb } from "@/app/[locale]/landing2/actions";
import { trackServerEvent } from "@/utils/tracking/serverUtils";

export const startMockInterview = async (
  prevState: any,
  formData: FormData
) => {
  let logger = new Logger();
  let mockInterviewId = "";
  const jobId = formData.get("jobId") as string;
  const onboarding = formData.get("onboarding") as string;
  const isOnboarding = onboarding === "true";
  if (!jobId) {
    logger.error("Error starting mock interview:", {
      error: "Job ID is required",
    });
    const translations = await getTranslations("errors");
    return {
      error: translations("pleaseTryAgain"),
    };
  }
  logger = logger.with({
    jobId,
  });

  const supabase = await createSupabaseServerClient();

  if (isOnboarding) {
    // Check for existing mock interviews
    const { data: existingMockInterview } = await supabase
      .from("custom_job_mock_interviews")
      .select("id")
      .eq("custom_job_id", jobId)
      .maybeSingle();

    if (existingMockInterview) {
      redirect(
        `/dashboard/jobs/${jobId}/mockInterviews/${existingMockInterview.id}${
          isOnboarding ? "?onboarding=true" : ""
        }`
      );
    }
  }

  const { data: customJob, error: jobError } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError || !customJob) {
    logger.error("Error fetching job details:", {
      error: jobError?.message,
    });
    const translations = await getTranslations("errors");
    return {
      error: translations("pleaseTryAgain"),
    };
  }

  const { data: jobQuestions, error: questionError } = await supabase
    .from("custom_job_questions")
    .select("*")
    .eq("custom_job_id", jobId);

  if (questionError || !jobQuestions || jobQuestions.length === 0) {
    logger.error("Error fetching job questions:", {
      error: questionError?.message,
    });
    const translations = await getTranslations("errors");
    return {
      error: translations("pleaseTryAgain"),
    };
  }

  // Randomly select 6 questions from the job questions
  const selectedQuestions = jobQuestions
    .sort(() => 0.5 - Math.random())
    .slice(0, isOnboarding ? 3 : 6);

  // Update the prompt with the selected questions
  const questionsPrompt = selectedQuestions
    .map((q, index) => `Question ${index + 1}: ${q.question}`)
    .join("\n");

  const prompt = `You are an experienced interviewer for ${customJob.company_name ?? "a company"}. 
You are conducting a job interview for the position of ${customJob.job_title}.

Company Context:
${customJob.company_description}

Job Description:
${customJob.job_description}

Instructions:
1. Act as a professional interviewer from ${customJob.company_name ?? "a company"}.
2. Start by introducing yourself and the company briefly.
3. Ask relevant technical and behavioral questions based on the job description.
4. Evaluate the candidate's responses and provide constructive feedback.
5. Keep the conversation natural and professional.
6. Ask one question at a time and wait for the candidate's response.
7. Maintain the role of the interviewer throughout the conversation.

Please begin the interview by introducing yourself and asking your first question.

Conduct your interview with the following set of questions:

${questionsPrompt}

Do your best to ask all of these questions, but if the candidate's responses lead you to
ask any additional questions, feel free to ask them. It is important for the interview
to be as natural as possible and to follow the flow of the conversation.

Ask natural follow up questions based on the candidate's responses that will fit the premise
of the job description at the company.

Once you ask ${selectedQuestions.length} questions, end the interview.

Thank the candidate for their time and tell them that the interview has ended. 
`;

  const { data: mockInterview, error: createError } = await supabase
    .from("custom_job_mock_interviews")
    .insert({
      custom_job_id: jobId,
      interview_prompt: prompt,
      status: "in_progress",
    })
    .select()
    .single();

  if (createError) {
    logger.error("Error creating mock interview:", {
      error: createError.message,
    });
    const translations = await getTranslations("errors");
    return {
      error: translations("pleaseTryAgain"),
    };
  }
  if (!mockInterview) {
    logger.error("Failed to create mock interview");
    const translations = await getTranslations("errors");
    return {
      error: translations("pleaseTryAgain"),
    };
  }
  mockInterviewId = mockInterview.id;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id) {
    await trackServerEvent({
      eventName: "mock_interview_created",
      userId: user.id,
      args: {
        jobId,
      },
    });
  }
  redirect(
    `/dashboard/jobs/${jobId}/mockInterviews/${mockInterviewId}${
      isOnboarding ? "?onboarding=true" : ""
    }`
  );
};

export const linkAnonymousAccount = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const jobId = formData.get("jobId") as string;
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("accountLinking");
  const logger = new Logger().with({
    jobId,
    email,
  });

  if (!email) {
    return encodedRedirect(
      "error",
      `/dashboard/jobs/${jobId}`,
      t("emailRequiredError")
    );
  }

  const { error } = await supabase.auth.updateUser(
    {
      email,
    },
    {
      emailRedirectTo: `https://${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/jobs/${jobId}`,
    }
  );

  if (error) {
    logger.error("Error linking anonymous account", {
      error,
    });
    await logger.flush();
    return encodedRedirect("error", `/dashboard/jobs/${jobId}`, error.message);
  }
  const user = await supabase.auth.getUser();
  if (user.data.user?.id) {
    await trackServerEvent({
      eventName: "anonymous_account_linked",
      userId: user.data.user.id,
      email,
    });
  }

  return encodedRedirect(
    "success",
    `/dashboard/jobs/${jobId}`,
    t("authSuccess")
  );
};

export const unlockJob = async (prevState: any, formData: FormData) => {
  const translations = await getTranslations("errors");
  const numberOfCredits = parseInt(formData.get("numberOfCredits") as string);
  const jobId = formData.get("jobId") as string;
  const logger = new Logger().with({
    jobId,
    numberOfCredits,
  });
  const supabase = await createSupabaseServerClient();
  const user = await supabase.auth.getUser();
  if (!user) {
    logger.error("User not found");
    await logger.flush();
    return {
      error: translations("userNotFound"),
    };
  }
  const userId = user.data.user?.id;
  if (!userId) {
    logger.error("User ID not found");
    await logger.flush();
    return {
      error: translations("userNotFound"),
    };
  }
  const { error } = await supabase
    .from("custom_jobs")
    .update({
      status: "unlocked",
    })
    .eq("id", jobId);

  if (error) {
    logger.error("Error unlocking job", {
      error: error.message,
    });
    await logger.flush();
    return {
      error: translations("pleaseTryAgain"),
    };
  }
  logger.info("Unlocked job");

  const { error: decrementTokenError } = await supabase
    .from("custom_job_credits")
    .update({
      number_of_credits: numberOfCredits - 1,
    })
    .eq("id", userId);

  if (decrementTokenError) {
    logger.error("Error decrementing token", {
      error: decrementTokenError.message,
    });
    await logger.flush();
    return {
      error: translations("pleaseTryAgain"),
    };
  }
  logger.info("Decremented user credit count");
  await trackServerEvent({
    eventName: "job_unlocked",
    userId,
    args: {
      jobId,
    },
  });
  revalidatePath(`/dashboard/jobs/${jobId}`);
};

export const generateMoreQuestions = async (
  prevState: any,
  formData: FormData
) => {
  const jobId = formData.get("jobId") as string;
  const logger = new Logger().with({
    jobId,
  });
  logger.info("Generating more questions");
  const job = await fetchJob(jobId);
  const files = await getAllFiles(jobId);

  await generateMoreCustomJobQuestions({
    customJobId: jobId,
    files,
    jobTitle: job.job_title,
    jobDescription: job.job_description,
    companyName: job.company_name,
    companyDescription: job.company_description,
  });
  await logger.flush();
  logger.info("Finished generating more questions");
  revalidatePath(`/dashboard/jobs/${jobId}`);
  redirect(`/dashboard/jobs/${jobId}`);
};

const fetchJob = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data: job, error } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (error) {
    throw error;
  }
  return job;
};

const fetchJobQuestions = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data: questions, error } = await supabase
    .from("custom_job_questions")
    .select("*")
    .eq("custom_job_id", jobId);
  if (error) {
    throw error;
  }
  return questions;
};

const generateMoreCustomJobQuestions = async ({
  customJobId,
  files,
  jobTitle,
  jobDescription,
  companyName,
  companyDescription,
}: {
  customJobId: string;
  files: {
    fileData: {
      fileUri: string;
      mimeType: string;
    };
  }[];
  jobTitle: string;
  jobDescription: string;
  companyName: string | null;
  companyDescription: string | null;
}) => {
  const existingQuestions = await fetchJobQuestions(customJobId);
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
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

    You are also given a list of questions that the candidate has already answered.

    Use all of this information to generate 20 additional job interview questions that will help you understand the candidate's skills and experience and their fit for the job 
    that are also not in the list of questions that the candidate has already answered. This is important because you want to make sure that the candidate is able to practice with
    questions that they have not seen before.

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

    ## Existing Questions
    ${existingQuestions.map((q) => `Question ${q.id}: ${q.question}`).join("\n")}
    `,
    ...files,
  ]);
  const response = result.response.text();
  const { questions } = JSON.parse(response) as {
    questions: { question: string; answerGuidelines: string }[];
  };
  await writeCustomJobQuestionsToDb({
    customJobId,
    questions,
  });
  revalidatePath(`/dashboard/jobs/${customJobId}`);
};
