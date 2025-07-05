import { NextResponse } from "next/server";
import { Tables } from "@/utils/supabase/database.types";
import { createAdminClient } from "@/utils/supabase/server";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { z } from "zod";

const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .replace(/--+/g, "-"); // Replace multiple hyphens with single hyphen

const saveGeneratedResume = async (
  resumeData: {
    personalInfo: {
      name: string;
      email: string | null;
      phone: string | null;
      location: string;
    };
    educationHistory: {
      name: string;
      degree: string;
      startDate: string;
      endDate: string;
      gpa: string | null;
      additionalInfo: string[];
    }[];
    workExperience: {
      companyName: string;
      jobTitle: string;
      startDate: string;
      endDate: string;
      description: string[];
    }[];
    skills: {
      category: string;
      skills: string[];
    }[];
  },
  jobTitle: string,
  jobDescription: string | null,
  companyName?: string | null,
  companyDescription?: string | null
) => {
  const supabase = await createAdminClient();

  // Save resume personal info
  const { data: resumeData_, error } = await supabase
    .from("resumes")
    .insert({
      title: companyName ? `${jobTitle} at ${companyName}` : jobTitle,
      name: resumeData.personalInfo.name,
      email: resumeData.personalInfo.email,
      phone: resumeData.personalInfo.phone,
      location: resumeData.personalInfo.location,
      user_id: "7823eb9a-62fc-4bbf-bd58-488f117c24e8",
      locked_status: "unlocked",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const resumeId = resumeData_.id;

  const slugText = companyName ? `${jobTitle} at ${companyName}` : jobTitle;

  // Save resume metadata
  const { error: metadataError } = await supabase
    .from("resume_metadata")
    .insert({
      resume_id: resumeId,
      job_title: jobTitle,
      job_description: jobDescription || "",
      ...(companyName ? { company_name: companyName } : {}),
      ...(companyDescription
        ? { company_description: companyDescription }
        : {}),
      slug: generateSlug(slugText),
    });

  if (metadataError) {
    throw new Error(metadataError.message);
  }

  // Save education section
  if (resumeData.educationHistory.length > 0) {
    const { data: educationSection, error: eduSectionError } = await supabase
      .from("resume_sections")
      .insert({
        title: "Education",
        resume_id: resumeId,
        display_order: 0,
      })
      .select("id")
      .single();

    if (eduSectionError) {
      throw new Error(eduSectionError.message);
    }

    await Promise.all(
      resumeData.educationHistory.map(async (education, index) => {
        const subtitle = education.gpa
          ? `${education.degree} - ${education.gpa}`
          : education.degree;

        const { data: detailItem, error: detailError } = await supabase
          .from("resume_detail_items")
          .insert({
            title: education.name,
            subtitle,
            date_range: `${education.startDate} - ${education.endDate}`,
            section_id: educationSection.id,
            display_order: index,
          })
          .select("id")
          .single();

        if (detailError) {
          console.error("Failed to insert education detail item", detailError);
          return;
        }

        if (education.additionalInfo.length > 0) {
          await Promise.all(
            education.additionalInfo.map(async (info, descIndex) => {
              const { error: descError } = await supabase
                .from("resume_item_descriptions")
                .insert({
                  detail_item_id: detailItem.id,
                  description: info,
                  display_order: descIndex,
                });

              if (descError) {
                console.error(
                  "Failed to insert education description",
                  descError
                );
              }
            })
          );
        }
      })
    );
  }

  // Save work experience section
  if (resumeData.workExperience.length > 0) {
    const { data: workSection, error: workSectionError } = await supabase
      .from("resume_sections")
      .insert({
        title: "Work Experience",
        resume_id: resumeId,
        display_order: 1,
      })
      .select("id")
      .single();

    if (workSectionError) {
      throw new Error(workSectionError.message);
    }

    await Promise.all(
      resumeData.workExperience.map(async (experience, index) => {
        const { data: detailItem, error: detailError } = await supabase
          .from("resume_detail_items")
          .insert({
            title: experience.companyName,
            subtitle: experience.jobTitle,
            date_range: `${experience.startDate} - ${experience.endDate}`,
            section_id: workSection.id,
            display_order: index,
          })
          .select("id")
          .single();

        if (detailError) {
          console.error(
            "Failed to insert work experience detail item",
            detailError
          );
          return;
        }

        await Promise.all(
          experience.description.map(async (desc, descIndex) => {
            const { error: descError } = await supabase
              .from("resume_item_descriptions")
              .insert({
                detail_item_id: detailItem.id,
                description: desc,
                display_order: descIndex,
              });

            if (descError) {
              console.error(
                "Failed to insert work experience description",
                descError
              );
            }
          })
        );
      })
    );
  }

  // Save skills section
  if (resumeData.skills.length > 0) {
    const { data: skillsSection, error: skillsSectionError } = await supabase
      .from("resume_sections")
      .insert({
        title: "Skills",
        resume_id: resumeId,
        display_order: 2,
      })
      .select("id")
      .single();

    if (skillsSectionError) {
      throw new Error(skillsSectionError.message);
    }

    await Promise.all(
      resumeData.skills.map(async (skillGroup, index) => {
        const { error: listError } = await supabase
          .from("resume_list_items")
          .insert({
            content: `${skillGroup.category}: ${skillGroup.skills.join(", ")}`,
            section_id: skillsSection.id,
            display_order: index,
          });

        if (listError) {
          console.error("Failed to insert skills list item", listError);
        }
      })
    );
  }

  return resumeId;
};

const generateResumeFromJob = async (job: Tables<"demo_jobs">) => {
  const prompt = `
    You are an expert resume writer. Given the following job description, create a fictional but realistic candidate profile.
    The candidate should be a strong candidate for the job requirements and qualifications. However, don't make it too perfect.
    The candidate should have some experience that is relevant to the job description, but it should not be exactly the same
    as no candidate would have exactly the same experience. Create similar experiences with different names and companies.
    
    ## Job Title: ${job.job_title}
    ## Company: ${job.company_name}
    ## Job Description: ${job.job_description}

    Create a candidate profile that includes:
    1. Personal information (name, location - make these realistic but fictional)
    2. Education history that matches the job requirements
    3. Work experience that demonstrates the required skills and experience
    4. Relevant skills mentioned in or implied by the job description

    Return the date in only YYYY format for the education history — do not return the months.

    Return all dates in MM/YYYY format for the work experience.

    Make the experience and qualifications strong but believable.

    For each work experience section, only include 4 description per work experience. Use your expertise as a resume writer to create realistic descriptions
    that demonstrate impact and results that will impress any hiring manager.

    When generating the skills section, generate only 2-3 categories of skills.
    `;

  const [personalInfo, educationHistory, workExperience, skills] =
    await Promise.all([
      generateObjectWithFallback({
        systemPrompt: prompt,
        prompt: "Generate only the personal information section.",
        schema: z.object({
          name: z.string(),
          email: z.string().nullable(),
          phone: z.string().nullable(),
          location: z.string(),
        }),
        loggingContext: {
          path: "api/admin/seo/demo-job-resumes",
          dataToExtract: "personal information",
        },
      }),

      generateObjectWithFallback({
        systemPrompt: prompt,
        prompt: "Generate only the education history section.",
        schema: z.array(
          z.object({
            name: z.string(),
            degree: z.string(),
            startDate: z.string(),
            endDate: z.string(),
            gpa: z.string().nullable(),
            additionalInfo: z.array(z.string()),
          })
        ),
        loggingContext: {
          path: "api/admin/seo/demo-job-resumes",
          dataToExtract: "education",
        },
      }),

      generateObjectWithFallback({
        systemPrompt: prompt,
        prompt: "Generate only the work experience section.",
        schema: z.array(
          z.object({
            companyName: z.string(),
            jobTitle: z.string(),
            startDate: z.string(),
            endDate: z.string(),
            description: z.array(z.string()),
          })
        ),
        loggingContext: {
          path: "api/admin/seo/demo-job-resumes",
          dataToExtract: "work experience",
        },
      }),

      generateObjectWithFallback({
        systemPrompt: prompt,
        prompt: "Generate only the skills section.",
        schema: z.array(
          z.object({
            category: z.string(),
            skills: z.array(z.string()),
          })
        ),
        loggingContext: {
          path: "api/admin/seo/demo-job-resumes",
          dataToExtract: "skills",
        },
      }),
    ]);

  const generatedData = {
    personalInfo,
    educationHistory,
    workExperience,
    skills,
  };

  // Save the resume to Supabase and get the ID
  const resumeId = await saveGeneratedResume(
    generatedData,
    job.job_title,
    job.job_description,
    job.company_name,
    job.company_description
  );

  return {
    resumeId,
    jobId: job.id,
    jobTitle: job.job_title,
    companyName: job.company_name,
  };
};

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const pageSize = 100;
    let allJobs: Tables<"demo_jobs">[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: jobs, error } = await supabase
        .from("demo_jobs")
        .select("*")
        .filter("company_name", "not.is", null)
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      if (jobs.length > 0) {
        allJobs = [...allJobs, ...jobs];
        page++;
      } else {
        hasMore = false;
      }
    }

    // Process jobs in batches of 10
    const batchSize = 10;
    const results: Awaited<ReturnType<typeof generateResumeFromJob>>[] = [];
    const totalBatches = Math.ceil(allJobs.length / batchSize);

    for (let i = 0; i < allJobs.length; i += batchSize) {
      const batchNumber = Math.floor(i / batchSize) + 1;
      const batch = allJobs.slice(i, i + batchSize);
      console.log(
        `Processing batch ${batchNumber} of ${totalBatches} (${batch.length} jobs)`
      );

      try {
        const batchStartTime = Date.now();
        const batchResults = await Promise.all(
          batch.map((job) => generateResumeFromJob(job))
        );
        const batchEndTime = Date.now();

        results.push(...batchResults);
        console.log(
          `Completed batch ${batchNumber}/${totalBatches} in ${(batchEndTime - batchStartTime) / 1000} seconds. ` +
            `Processed ${results.length}/${allJobs.length} total jobs.`
        );
      } catch (error) {
        console.error(`Error processing batch ${batchNumber}:`, error);
        throw error;
      }
    }

    return NextResponse.json({
      results,
      totalProcessed: results.length,
      totalJobs: allJobs.length,
      success: results.length === allJobs.length,
    });
  } catch (error) {
    console.error("Error fetching demo jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo jobs" },
      { status: 500 }
    );
  }
}
