"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { encodedRedirect } from "@/utils/utils";
import { revalidatePath } from "next/cache";
import { getCustomJobFiles } from "./questions/[questionId]/actions";
import { writeCustomJobQuestionsToDb } from "@/app/landing2/actions";
import { trackServerEvent } from "@/utils/tracking/serverUtils";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { z } from "zod";
import { headers } from "next/headers";
import { getServerUser } from "@/utils/auth/server";

export const startMockInterview = async (
  prevState: any,
  formData: FormData,
) => {
  let logger = new Logger();
  let mockInterviewId = "";
  const jobId = formData.get("jobId") as string;
  const onboarding = formData.get("onboarding") as string;
  const mockInterviewsPath = formData.get("mockInterviewsPath") as string;
  const livekitEnabled = formData.get("livekitEnabled") === "true";
  const isOnboarding = onboarding === "true";
  let redirectPath = "";

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
    mockInterviewsPath,
    livekitEnabled,
  });

  const supabase = await createSupabaseServerClient();

  try {
    const user = await getServerUser();
    if (!user?.id) {
      throw new Error("User not found");
    }
    let shouldCreateNewInterview = true;

    if (isOnboarding) {
      // Check for existing mock interviews
      const { data: existingMockInterview } = await supabase
        .from("custom_job_mock_interviews")
        .select("id")
        .eq("custom_job_id", jobId)
        .maybeSingle();

      if (existingMockInterview) {
        const basePath = livekitEnabled 
          ? `${mockInterviewsPath}/${existingMockInterview.id}/v2`
          : `${mockInterviewsPath}/${existingMockInterview.id}`;
        redirectPath = `${basePath}${
          isOnboarding ? "?onboarding=true" : ""
        }`;
        shouldCreateNewInterview = false;
      }
    }

    if (shouldCreateNewInterview) {
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
        throw new Error(translations("pleaseTryAgain"));
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
        throw new Error(translations("pleaseTryAgain"));
      }

      // Randomly select 6 questions from the job questions
      const selectedQuestions = jobQuestions
        .sort(() => 0.5 - Math.random())
        .slice(0, isOnboarding ? 3 : 6);

      // Update the prompt with the selected questions
      const questionsPrompt = selectedQuestions
        .map((q, index) => `Question ${index + 1}: ${q.question}`)
        .join("\n");

      const prompt = `
You are an experienced job interviewer conducting a structured behavioral interview. Your goal is to accurately assess the candidate's qualifications, experience, and fit for the role through professional questioning and active listening.

INTERVIEWER PERSONA:
- You are emotionally neutral and maintain professional boundaries throughout
- You actively listen but do NOT offer excessive praise or validation
- You ask clarifying follow-up questions when answers are vague, incomplete, or don't fully address the question
- You probe for specific examples when candidates give generic responses
- You maintain control of the interview pace and redirect if candidates go off-topic
- You take brief pauses after answers to simulate note-taking, just as real interviewers do

INTERVIEW CONDUCT RULES:
1. Start with a brief, professional introduction: state your name (use a common name like Michael, Jennifer, David, or Sarah) and your role as the hiring manager or team lead.

2. Begin with "Tell me about yourself" - listen for a 2-3 minute response, then transition to your prepared questions.

3. Ask interview questions based off of the list of questions provided to you in this prompt, but use it as a general guideline. Do not be afraid to ask follow up questions if the answer is not detailed enough
or ask different questions if the interview is going in a different direction.
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

Once you ask ${selectedQuestions.length} questions, end the interview.

Thank the candidate for their time and tell them that the interview has ended. 

${
        customJob.company_name &&
        `<company-name>
        You are an experienced interviewer for ${customJob.company_name}
  </company-name>`
      }

${
        customJob.job_title &&
        `
<job-title>
You are conducting a job interview for the position of ${customJob.job_title}
</job-title>
`
      }     

${
        customJob.company_description &&
        `
<company-description>
    ${customJob.company_description}
</company-description>
`
      }

${
        customJob.job_description && `
<job-description>
    ${customJob.job_description}
</job-description>
`
      }
`;

      const { data: mockInterview, error: createError } = await supabase
        .from("custom_job_mock_interviews")
        .insert({
          custom_job_id: jobId,
          interview_prompt: prompt,
          status: "in_progress",
          user_id: user.id,
        })
        .select()
        .single();

      if (createError) {
        logger.error("Error creating mock interview:", {
          error: createError.message,
        });
        const translations = await getTranslations("errors");
        throw new Error(translations("pleaseTryAgain"));
      }
      if (!mockInterview) {
        logger.error("Failed to create mock interview");
        const translations = await getTranslations("errors");
        throw new Error(translations("pleaseTryAgain"));
      }
      mockInterviewId = mockInterview.id;

      // Insert the selected questions into mock_interview_questions table
      const mockInterviewQuestions = selectedQuestions.map((question) => ({
        interview_id: mockInterviewId,
        question_id: question.id,
      }));

      const { error: questionsInsertError } = await supabase
        .from("mock_interview_questions")
        .insert(mockInterviewQuestions);

      if (questionsInsertError) {
        logger.error("Error inserting mock interview questions:", {
          error: questionsInsertError.message,
        });
        throw new Error(
          `Failed to insert mock interview questions: ${questionsInsertError.message}`,
        );
      }
      await trackServerEvent({
        eventName: "mock_interview_created",
        userId: user.id,
        args: {
          jobId,
        },
      });
      const basePath = livekitEnabled 
        ? `${mockInterviewsPath}/${mockInterviewId}/v2`
        : `${mockInterviewsPath}/${mockInterviewId}`;
      redirectPath = `${basePath}${
        isOnboarding ? "?onboarding=true" : ""
      }`;
    }
  } catch (error) {
    logger.error("Error in startMockInterview:", {
      error: error instanceof Error ? error.message : String(error),
      mockInterviewId,
    });

    // Clean up: delete the mock interview if it was created
    if (mockInterviewId) {
      try {
        await supabase
          .from("custom_job_mock_interviews")
          .delete()
          .eq("id", mockInterviewId);
        logger.info("Cleaned up mock interview after error:", {
          mockInterviewId,
        });
      } catch (cleanupError) {
        logger.error("Error cleaning up mock interview:", {
          cleanupError: cleanupError instanceof Error
            ? cleanupError.message
            : String(cleanupError),
          mockInterviewId,
        });
      }
    }

    await logger.flush();
    const translations = await getTranslations("errors");
    return {
      error: translations("pleaseTryAgain"),
    };
  }

  // Redirect outside of try-catch
  redirect(redirectPath);
};

export const linkAnonymousAccount = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const jobId = formData.get("jobId") as string | null;
  const interviewCopilotId = formData.get("interviewCopilotId") as
    | string
    | null;
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("accountLinking");
  const logger = new Logger().with({
    jobId,
    interviewCopilotId,
    email,
  });
  const origin = (await headers()).get("origin");

  if (!email) {
    return encodedRedirect(
      "error",
      `/dashboard/jobs/${jobId}`,
      t("emailRequiredError"),
    );
  }

  if (!jobId && !interviewCopilotId) {
    return encodedRedirect(
      "error",
      `/dashboard/jobs/${jobId}`,
      t("genericError"),
    );
  }

  const { error } = await supabase.auth.updateUser(
    {
      email,
    },
    {
      emailRedirectTo: jobId
        ? `${origin}/dashboard/jobs/${jobId}`
        : `${origin}/dashboard/interview-copilots/${interviewCopilotId}`,
    },
  );

  if (error) {
    logger.error("Error linking anonymous account", {
      error,
    });
    await logger.flush();
    return encodedRedirect(
      "error",
      jobId
        ? `/dashboard/jobs/${jobId}`
        : `/dashboard/interview-copilots/${interviewCopilotId}`,
      error.message,
    );
  }
  const user = await getServerUser();
  if (user?.id) {
    await trackServerEvent({
      eventName: "anonymous_account_linked",
      userId: user.id,
      email,
    });
  }

  return encodedRedirect(
    "success",
    jobId
      ? `/dashboard/jobs/${jobId}`
      : `/dashboard/interview-copilots/${interviewCopilotId}`,
    t("authSuccess"),
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
  const user = await getServerUser();
  if (!user) {
    logger.error("User not found");
    await logger.flush();
    return {
      error: translations("userNotFound"),
    };
  }
  const userId = user.id;
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
  formData: FormData,
) => {
  const jobId = formData.get("jobId") as string;
  const logger = new Logger().with({
    jobId,
  });
  logger.info("Generating more questions");
  const job = await fetchJob(jobId);
  const files = await getCustomJobFiles(jobId);

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
  jobDescription: string | null;
  companyName: string | null;
  companyDescription: string | null;
}) => {
  const existingQuestions = await fetchJobQuestions(customJobId);
  const prompt = `
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
    ${
    existingQuestions.map((q) => `Question ${q.id}: ${q.question}`).join("\n")
  }
    `;
  const result = await generateObjectWithFallback({
    systemPrompt: prompt,
    messages: [
      {
        role: "user" as "user",
        content: [
          {
            type: "text",
            text: "Generate the custom job questions",
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
      questions: z.array(
        z.object({
          question: z.string(),
          answerGuidelines: z.string(),
        }),
      ),
    }),
  });
  const { questions } = result;
  await writeCustomJobQuestionsToDb({
    customJobId,
    questions,
  });
  revalidatePath(`/dashboard/jobs/${customJobId}`);
};

export const revalidateJobQuestions = async (jobId: string) => {
  revalidatePath(`/dashboard/jobs/${jobId}`);
};
