import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { z } from "zod";
import { AxiomRequest, withAxiom } from "next-axiom";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { revalidatePath } from "next/cache";

const SaveQuestionsSchema = z.object({
  jobId: z.string(),
  questions: z.array(
    z.object({
      question: z.string(),
      answer_guidelines: z.string().optional(),
      order: z.number().optional(),
    })
  ),
});

// Zod schema for LLM answer_guidelines response
const AnswerGuidelinesSchema = z.object({
  answer_guidelines: z.string(),
});

// Helper to generate answer_guidelines via LLM
async function getAnswerGuidelines({
  job,
  question,
  jobId,
}: {
  job: any;
  question: string;
  jobId: string;
}) {
  const prompt = `You are an expert interview coach. Given the following job information and interview question, 
  write a concise set of answer guidelines that describe what a strong or correct answer would include. Focus 
  on the key points, skills, or experiences the candidate should mention.

  Question: ${question}
  Job Title: ${job.job_title || ""}
  Job Description: ${job.job_description || ""}
  Company Name: ${job.company_name || ""}
  Company Description: ${job.company_description || ""}

  Return only the answer guidelines as a single string.`;
  const result = await generateObjectWithFallback({
    prompt,
    schema: AnswerGuidelinesSchema,
    loggingContext: { jobId, question },
  });
  return result.answer_guidelines;
}

export const POST = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    path: "/api/questions/save",
  });
  try {
    const body = await request.json();
    const { jobId, questions } = SaveQuestionsSchema.parse(body);

    const supabase = await createSupabaseServerClient();

    // Fetch job info from Supabase
    const { data: job, error: jobError } = await supabase
      .from("custom_jobs")
      .select("job_title, job_description, company_name, company_description")
      .eq("id", jobId)
      .single();
    if (jobError || !job) {
      logger.error("Job not found", { jobId, error: jobError });
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // For each question, generate answer_guidelines if missing
    const insertData = await Promise.all(
      questions.map(async (question) => {
        let guidelines = question.answer_guidelines;
        if (!guidelines) {
          guidelines = await getAnswerGuidelines({
            job,
            question: question.question,
            jobId,
          });
        }
        return {
          custom_job_id: jobId,
          question: question.question,
          answer_guidelines: guidelines,
          question_type: "user_generated" as const,
        };
      })
    );
    await supabase.from("custom_job_questions").insert(insertData);

    // Revalidate the job questions page (hardcoded locale)
    revalidatePath(`/en/dashboard/jobs/${jobId}`);

    logger.info("Questions saved", { jobId, questions });
    return NextResponse.json({
      success: true,
      messageKey: "uploadQuestionsSuccess",
    });
  } catch (error) {
    logger.error("Error saving questions", { error });
    return NextResponse.json(
      { error: "Failed to save questions" },
      { status: 500 }
    );
  }
});
