import { createAdminClient } from "@/utils/supabase/server";
import { Tables } from "@/utils/supabase/database.types";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { z } from "zod";

export const POST = async (req: Request) => {
  try {
    const supabase = await createAdminClient();
    // --- Link resume_metadata to demo_jobs by slug ---
    const pageSize = 100;
    let page = 0;
    let hasMore = true;
    let allMetas: {
      id: string;
      job_title: string;
      company_name: string | null;
      demo_job_id: string | null;
    }[] = [];
    // Step 1: Fetch all resume_metadata entries where demo_job_id is null
    while (hasMore) {
      const { data: metas, error: fetchError } = await supabase
        .from("resume_metadata")
        .select("id, job_title, company_name, demo_job_id")
        .is("demo_job_id", null)
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (fetchError) {
        return new Response(JSON.stringify({ error: fetchError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!metas || metas.length === 0) {
        hasMore = false;
        break;
      }
      allMetas = allMetas.concat(metas);
      page++;
    }

    // Step 2: Process allMetas in batches of 100
    let updatedCount = 0;
    let skippedCount = 0;
    for (let i = 0; i < allMetas.length; i += 100) {
      const batch = allMetas.slice(i, i + 100);
      await Promise.all(
        batch.map(async (meta) => {
          // Generate slugText
          const slugText = meta.company_name
            ? `${meta.job_title} at ${meta.company_name}`
            : meta.job_title;
          // Slugify
          const slug = slugText
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .replace(/--+/g, "-");
          // Find demo_job by slug
          const { data: demoJob, error: demoJobError } = await supabase
            .from("demo_jobs")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();
          if (demoJobError || !demoJob) {
            skippedCount++;
            return;
          }
          // Update resume_metadata with demo_job_id
          const { error: updateError } = await supabase
            .from("resume_metadata")
            .update({ demo_job_id: demoJob.id })
            .eq("id", meta.id);
          if (!updateError) {
            updatedCount++;
          } else {
            skippedCount++;
          }
        })
      );
    }
    // --- End resume_metadata linking logic ---

    return new Response(
      JSON.stringify({ updated: updatedCount, skipped: skippedCount }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
