import { Tables } from "@/utils/supabase/database.types";
import { createAdminClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { z } from "zod";

const generateGoodAnswers = async (
  question: string,
  answerGuidelines: string
) => {
  const systemPrompt = `Given a job interview question and its answer guidelines, generate 3 good example answers that meet all the criteria in the guidelines.
    The answers should be realistic, professional, and demonstrate different approaches to answering the question effectively.
    Each answer should fully satisfy the answer guidelines provided.

    ## Question
    ${question}

    ## Answer Guidelines
    ${answerGuidelines}

    Return your response in JSON format with exactly 3 good answers.
    `;

  const result = await generateObjectWithFallback({
    prompt: "Generate good example answers",
    schema: z.object({
      goodAnswers: z.array(z.string()).length(3),
    }),
    systemPrompt,
    loggingContext: {
      path: "api/admin/seo/demo-jobs/backfill",
      dataToExtract: "good answers",
    },
    enableLogging: false,
  });

  return result.goodAnswers;
};

const updateQuestionWithGoodAnswers = async (
  supabase: any,
  questionId: string,
  goodAnswers: string[]
) => {
  const { error } = await supabase
    .from("demo_job_questions")
    .update({ good_answers: goodAnswers })
    .eq("id", questionId);

  if (error) {
    throw new Error(`Error updating question ${questionId}: ${error.message}`);
  }
};

const processBatchOfQuestions = async (
  questions: Array<{
    id: string;
    question: string;
    answer_guidelines: string;
    good_answers: string[] | null;
  }>,
  supabase: any,
  batchNumber: number,
  totalBatches: number
) => {
  const startTime = Date.now();
  const questionsToProcess = questions.filter((q) => !q.good_answers);

  console.log(
    `\n[Batch ${batchNumber}/${totalBatches}] Starting processing of ${questionsToProcess.length} questions`
  );

  const results = await Promise.allSettled(
    questionsToProcess.map(async (question) => {
      try {
        const goodAnswers = await generateGoodAnswers(
          question.question,
          question.answer_guidelines
        );
        void updateQuestionWithGoodAnswers(supabase, question.id, goodAnswers);
        return { success: true, id: question.id };
      } catch (error) {
        console.error(`Error processing question ${question.id}:`, error);
        return { success: false, id: question.id, error };
      }
    })
  );

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  const { successCount, failureCount } = results.reduce(
    (acc, result) => {
      if (result.status === "fulfilled" && result.value.success) {
        acc.successCount++;
      } else {
        acc.failureCount++;
      }
      return acc;
    },
    { successCount: 0, failureCount: 0 }
  );

  console.log(
    `[Batch ${batchNumber}/${totalBatches}] Completed in ${duration}s`
  );
  console.log(`✓ Successful: ${successCount} | ✗ Failed: ${failureCount}`);

  return { successCount, failureCount };
};

export async function GET() {
  try {
    const startTime = Date.now();
    const supabase = await createAdminClient();
    const allDemoJobs: Tables<"demo_jobs">[] = [];
    let currentPage = 0;
    const pageSize = 500;
    let totalSuccessCount = 0;
    let totalFailureCount = 0;

    console.log("\n🚀 Starting demo jobs backfill process...");

    while (true) {
      const { data: demoJobs, error: jobsError } = await supabase
        .from("demo_jobs")
        .select("*, demo_job_questions(*)")
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1)
        .order("id");

      if (jobsError) {
        throw new Error(`Error fetching demo jobs: ${jobsError.message}`);
      }

      if (!demoJobs || demoJobs.length === 0) {
        break;
      }

      console.log(
        `\n📦 Processing page ${currentPage + 1} with ${demoJobs.length} jobs`
      );

      // Collect all questions from the current batch of jobs
      const allQuestions = demoJobs
        .flatMap((job) => job.demo_job_questions || [])
        .filter((question) => question.good_answers === null);

      console.log(`Found ${allQuestions.length} total questions to process`);

      // Process questions in batches
      const BATCH_SIZE = 200;
      const totalBatches = Math.ceil(allQuestions.length / BATCH_SIZE);

      for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
        const questionsBatch = allQuestions.slice(i, i + BATCH_SIZE);
        const currentBatch = Math.floor(i / BATCH_SIZE) + 1;

        const { successCount, failureCount } = await processBatchOfQuestions(
          questionsBatch,
          supabase,
          currentBatch,
          totalBatches
        );

        totalSuccessCount += successCount;
        totalFailureCount += failureCount;

        const progress = ((currentBatch / totalBatches) * 100).toFixed(1);
        console.log(`Progress: ${progress}% complete`);
      }

      allDemoJobs.push(...demoJobs);
      currentPage++;
    }

    const endTime = Date.now();
    const totalDuration = ((endTime - startTime) / 1000 / 60).toFixed(2);

    console.log("\n✨ Backfill process completed!");
    console.log(`Total time: ${totalDuration} minutes`);
    console.log(`Total jobs processed: ${allDemoJobs.length}`);
    console.log(`Total successful updates: ${totalSuccessCount}`);
    console.log(`Total failed updates: ${totalFailureCount}`);

    return NextResponse.json({
      success: true,
      total: allDemoJobs.length,
      updatedQuestions: totalSuccessCount,
      failedQuestions: totalFailureCount,
      durationMinutes: parseFloat(totalDuration),
    });
  } catch (error: any) {
    console.error("❌ Error in backfill process:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
