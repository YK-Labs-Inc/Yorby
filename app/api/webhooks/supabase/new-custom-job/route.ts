import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { AxiomRequest } from "next-axiom";
import { Tables } from "@/utils/supabase/database.types";

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

// Define the webhook payload type
type InsertPayload = {
  type: "INSERT";
  table: string;
  schema: string;
  record: Tables<"custom_jobs">;
  old_record: null;
};

// Verify the webhook request is legitimate by checking the Authorization header
const verifyWebhookRequest = (request: Request): boolean => {
  return (
    request.headers.get("authorization") ===
    `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET!}`
  );
};

export const POST = async (request: AxiomRequest) => {
  const logger = request.log.with({
    path: "/api/webhooks/supabase/new-custom-job",
  });

  try {
    // Verify the webhook request
    if (!verifyWebhookRequest(request)) {
      logger.error("Invalid webhook request - authentication failed");
      return NextResponse.json(
        { error: "Invalid webhook request - authentication failed" },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload = (await request.json()) as InsertPayload;

    // Validate that this is an insert event for the custom_jobs table
    if (payload.type !== "INSERT" || payload.table !== "custom_jobs") {
      logger.error("Unexpected webhook payload", { payload });
      return NextResponse.json(
        { error: "Unexpected webhook payload" },
        { status: 400 }
      );
    }

    const job = payload.record;
    logger.info("Processing new custom job", { jobId: job.id });

    const supabase = await createAdminClient();
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
        action: "categorize_job_webhook",
      },
    });

    // Insert the categorization into the database
    const { error: insertError } = await supabase
      .from("custom_job_categories")
      .insert({
        custom_job_id: job.id,
        category: categoryData.industry,
        job_title: categoryData.title,
      });

    if (insertError) {
      logger.error("Failed to insert job category", {
        jobId: job.id,
        error: insertError,
      });
      return NextResponse.json(
        { error: "Failed to insert job category" },
        { status: 500 }
      );
    }

    logger.info("Successfully categorized job", {
      jobId: job.id,
      category: categoryData.industry,
      title: categoryData.title,
    });

    return NextResponse.json({
      message: "Job categorized successfully",
      result: {
        jobId: job.id,
        category: categoryData.industry,
        normalizedTitle: categoryData.title,
      },
    });
  } catch (error) {
    logger.error("Error in webhook handler", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
};
