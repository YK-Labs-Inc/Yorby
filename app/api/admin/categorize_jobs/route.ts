import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { Logger } from "next-axiom";
import { PostgrestQueryBuilder } from "@supabase/postgrest-js";

// Schema for the AI model response
const JobCategorySchema = z.object({
  industry: z
    .string()
    .describe(
      "The general job industry (e.g., healthcare, finance, technology, customer service)"
    ),
  title: z
    .string()
    .describe(
      "A normalized job title without fancy terms that reflects the core responsibilities"
    ),
});

// Define the job type for better type safety
type CustomJob = {
  id: string;
  job_title: string;
  job_description: string;
};

// Batch size for processing jobs with LLM to avoid rate limiting
const LLM_BATCH_SIZE = 50;
// Batch size for database pagination (Supabase has a 1000 record limit)
const DB_BATCH_SIZE = 1000;

export async function GET(request: Request) {
  const logger = new Logger().with({ route: "admin/categorize_jobs" });

  try {
    // Create admin client to access Supabase
    const supabase = await createAdminClient();

    // Get already categorized job IDs
    const { data: categorizedJobs, error: categorizedError } = await supabase
      .from("custom_job_categories")
      .select("custom_job_id");

    if (categorizedError) {
      logger.error("Failed to fetch categorized jobs", {
        error: categorizedError,
      });
      return NextResponse.json(
        { error: "Failed to fetch categorized jobs" },
        { status: 500 }
      );
    }

    const categorizedJobIds = new Set(
      categorizedJobs?.map((job) => job.custom_job_id) || []
    );

    // Fetch all custom jobs in batches to overcome the 1000 record limit
    let allCustomJobs: CustomJob[] = [];
    let hasMore = true;
    let page = 0;

    logger.info("Starting to fetch all uncategorized custom jobs");

    while (hasMore) {
      const from = page * DB_BATCH_SIZE;
      const to = from + DB_BATCH_SIZE - 1;

      const {
        data: batchJobs,
        error: fetchError,
        count,
      } = await supabase
        .from("custom_jobs")
        .select("id, job_title, job_description", { count: "exact" })
        .range(from, to);

      if (fetchError) {
        logger.error(`Failed to fetch custom jobs batch ${page}`, {
          error: fetchError,
        });
        return NextResponse.json(
          { error: `Failed to fetch custom jobs batch ${page}` },
          { status: 500 }
        );
      }

      // Filter out already categorized jobs
      const uncategorizedBatchJobs = ((batchJobs as CustomJob[]) || []).filter(
        (job) => !categorizedJobIds.has(job.id)
      );

      allCustomJobs = [...allCustomJobs, ...uncategorizedBatchJobs];

      logger.info(
        `Fetched batch ${page}: ${batchJobs?.length} jobs, ${uncategorizedBatchJobs.length} uncategorized`
      );

      // Check if we've fetched all jobs
      if (!batchJobs || batchJobs.length < DB_BATCH_SIZE) {
        hasMore = false;
      } else {
        page++;
      }
    }

    const customJobs = allCustomJobs;

    if (!customJobs || customJobs.length === 0) {
      return NextResponse.json(
        { message: "No uncategorized jobs found" },
        { status: 200 }
      );
    }

    logger.info(`Found ${customJobs.length} uncategorized jobs to process`);

    // Process jobs in batches to avoid LLM rate limiting
    const results = [];
    const totalJobs = customJobs.length;
    const totalBatches = Math.ceil(totalJobs / LLM_BATCH_SIZE);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * LLM_BATCH_SIZE;
      const end = Math.min(start + LLM_BATCH_SIZE, totalJobs);
      const currentBatch = customJobs.slice(start, end);

      logger.info(
        `Processing batch ${batchIndex + 1}/${totalBatches} (${currentBatch.length} jobs)`
      );

      // Process each job in the current batch
      for (const job of currentBatch) {
        try {
          // Generate category and normalized title using AI
          const prompt = `
            Based on the following job information, determine the industry category and provide a normalized job title.
            
            Job Title: ${job.job_title}
            Job Description: ${job.job_description}
            
            Return the general industry this job belongs to (like healthcare, finance, technology, customer service, etc.) 
            and a normalized job title that reflects the core responsibilities without any fancy terms or embellishments.
            
            For example, "Senior Cloud Solutions Architect III" might be normalized to "Software Engineer" or "Solutions Architect".
          `;

          const categoryData = await generateObjectWithFallback({
            prompt,
            schema: JobCategorySchema,
            loggingContext: {
              jobId: job.id,
              action: "categorize_job",
              batchIndex,
            },
          });

          // Insert the categorization into the database
          const { error: insertError } = await supabase
            .from("custom_job_categories")
            .insert({
              custom_job_id: job.id,
              category: categoryData.industry,
              job_title: categoryData.title,
            })
            .select();

          if (insertError) {
            logger.error("Failed to insert job category", {
              jobId: job.id,
              error: insertError,
            });
            results.push({
              jobId: job.id,
              success: false,
              error: insertError.message,
            });
          } else {
            results.push({
              jobId: job.id,
              success: true,
              category: categoryData.industry,
              normalizedTitle: categoryData.title,
            });
          }
        } catch (jobError) {
          logger.error("Error processing job", {
            jobId: job.id,
            error:
              jobError instanceof Error ? jobError.message : String(jobError),
          });
          results.push({
            jobId: job.id,
            success: false,
            error:
              jobError instanceof Error ? jobError.message : "Unknown error",
          });
        }
      }

      // Add a small delay between batches to avoid rate limiting
      if (batchIndex < totalBatches - 1) {
        logger.info(
          `Completed batch ${batchIndex + 1}/${totalBatches}, waiting before next batch`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Processed all ${totalJobs} jobs in ${totalBatches} batches`,
      summary: {
        totalJobs,
        successCount,
        failureCount,
      },
      results,
    });
  } catch (error) {
    logger.error("Error in categorize_jobs handler", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to process jobs" },
      { status: 500 }
    );
  }
}
