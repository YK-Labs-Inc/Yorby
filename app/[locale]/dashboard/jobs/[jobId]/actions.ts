"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { encodedRedirect } from "@/utils/utils";
import { revalidatePath } from "next/cache";

export const startMockInterview = async (
  prevState: any,
  formData: FormData
) => {
  let logger = new Logger();
  let mockInterviewId = "";
  const jobId = formData.get("jobId") as string;
  try {
    if (!jobId) {
      throw new Error("Job ID is required");
    }
    logger = logger.with({
      jobId,
    });

    const supabase = await createSupabaseServerClient();

    const { data: customJob, error: jobError } = await supabase
      .from("custom_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !customJob) {
      throw new Error("Failed to fetch job details");
    }

    const { data: jobQuestions, error: questionError } = await supabase
      .from("custom_job_questions")
      .select("*")
      .eq("custom_job_id", jobId);

    if (questionError || !jobQuestions || jobQuestions.length === 0) {
      throw new Error("Failed to fetch job questions");
    }

    // Randomly select 6 questions from the job questions
    const selectedQuestions = jobQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);

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
      throw createError;
    }
    if (!mockInterview) {
      throw new Error("Failed to create mock interview");
    }
    mockInterviewId = mockInterview.id;
  } catch (error: any) {
    logger.error("Error starting mock interview:", {
      error: error.message,
    });
    const translations = await getTranslations("errors");
    return {
      error: translations("pleaseTryAgain"),
    };
  }

  redirect(`/dashboard/jobs/${jobId}/mockInterviews/${mockInterviewId}`);
};

export const linkAnonymousAccount = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("accountLinking.errors");

  if (!email || !password) {
    return encodedRedirect("error", "/dashboard/jobs", t("emailRequired"));
  }

  const { error } = await supabase.auth.updateUser({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/dashboard/jobs", error.message);
  }

  return encodedRedirect("success", "/dashboard/jobs", t("success"));
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

  revalidatePath(`/dashboard/jobs/${jobId}`);
};
