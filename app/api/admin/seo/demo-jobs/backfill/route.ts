import { createAdminClient } from "@/utils/supabase/server";
import { Tables } from "@/utils/supabase/database.types";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { z } from "zod";

export const POST = async (req: Request) => {
  try {
    const supabase = await createAdminClient();
    const pageSize = 100;
    let allMetadata: Tables<"resume_metadata">[] = [];
    let page = 0;
    let hasMore = true;
    let totalSuccess = 0;
    let totalFail = 0;

    while (hasMore) {
      const { data, error } = await supabase
        .from("resume_metadata")
        .select("*")
        .is("demo_job_id", null)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        // Optionally handle error here
        break;
      }

      if (data && data.length > 0) {
        allMetadata = [...allMetadata, ...data];
        page++;
      } else {
        hasMore = false;
      }
    }

    // Process in batches of 100
    for (let i = 0; i < allMetadata.length; i += 100) {
      const batch = allMetadata.slice(i, i + 100);
      console.log(
        `Processing batch ${Math.floor(i / 100) + 1} (${batch.length} entries)`
      );
      // For each entry in the batch, generate both fields in parallel
      const batchResults = await Promise.all(
        batch.map(async (meta) => {
          if (!meta.company_name) return null; // skip if no company_name
          const prompt = `\n## Job Title: ${meta.job_title}\n${meta.company_name ? `## Company: ${meta.company_name}` : ""}\n${meta.company_description ? `## Company Description: ${meta.company_description}` : ""}\n## Job Description: ${meta.job_description}`;

          const [important_skills, important_work_experience] =
            await Promise.all([
              generateObjectWithFallback({
                systemPrompt: prompt,
                prompt: `From job description, identify and generate some important skills that would be relevant for a candidate to have when applying to this job. Return as many skills as you can but limit it to 10.`,
                schema: z.array(z.string()),
                loggingContext: {
                  path: "api/admin/seo/demo-job-resumes",
                  dataToExtract: "important skills",
                },
              }),
              generateObjectWithFallback({
                systemPrompt: prompt,
                prompt: `From job description, identify and generate some important work experience that would be relevant for a candidate to have when applying to this job. Return as many work experiences as you can but limit it to 10.`,
                schema: z.array(z.string()),
                loggingContext: {
                  path: "api/admin/seo/demo-job-resumes",
                  dataToExtract: "important work experience",
                },
              }),
            ]);

          // Generate the slug
          const kebabCaseSlug = `${meta.company_name}-${meta.job_title}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

          // Find the demo_job_id
          const { data: demoJob, error: demoJobError } = await supabase
            .from("demo_jobs")
            .select("id")
            .eq("slug", kebabCaseSlug)
            .maybeSingle();

          if (demoJobError || !demoJob) {
            return {
              id: meta.id,
              important_skills,
              important_work_experience,
            };
          }

          return {
            id: meta.id,
            important_skills,
            important_work_experience,
            demo_job_id: demoJob.id,
          };
        })
      );

      // Filter out nulls (skipped entries)
      const validResults = batchResults.filter(Boolean) as {
        id: string;
        important_skills: string[];
        important_work_experience: string[];
        demo_job_id?: string;
      }[];

      if (validResults.length > 0) {
        const updateResults = await Promise.all(
          validResults.map((result) =>
            supabase
              .from("resume_metadata")
              .update({
                important_skills: result.important_skills,
                important_work_experience: result.important_work_experience,
                demo_job_id: result.demo_job_id,
              })
              .eq("id", result.id)
          )
        );
        // Count successes and failures
        updateResults.forEach((res) => {
          if (res.error) {
            totalFail++;
          } else {
            totalSuccess++;
          }
        });
      }
    }

    return new Response(
      JSON.stringify({ success: totalSuccess, failed: totalFail }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
