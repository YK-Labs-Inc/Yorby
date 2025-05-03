import { NextResponse } from "next/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { createAdminClient } from "@/utils/supabase/server";
import { Client } from "@notionhq/client";
import { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { promises as fs } from "fs";
import path from "path";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { z } from "zod";

// Use require for csv-parse as it doesn't have TypeScript types
const { parse } = require("csv-parse/sync");

interface JobRecord {
  jobTitle: string;
  jobDescription: string;
  companyName?: string;
  companyDescription?: string;
}

interface ProcessingResult {
  success: boolean;
  error?: string;
  message?: string;
}

// Helper function to process a batch of jobs
const processBatch = async (batch: JobRecord[], logger: any) => {
  const results = await Promise.all(
    batch.map(async (job) => {
      try {
        const { jobTitle, jobDescription, companyName, companyDescription } =
          job;

        if (!jobTitle || !jobDescription) {
          logger.info("Skipping job due to missing title or description", {
            jobTitle,
          });
          return { success: false, error: "Missing title or description" };
        }

        // Normalize job title and clean company name
        const [normalizedJobTitle, cleanedCompanyName] = await Promise.all([
          normalizeJobTitle(jobTitle),
          companyName ? cleanupText(companyName) : undefined,
        ]);

        logger.info("Normalized job title and cleaned company name", {
          normalizedJobTitle,
          cleanedCompanyName,
        });

        // Check existing entries in demo_jobs
        const supabase = await createAdminClient();
        const [genericJobResult, companySpecificJobResult] = await Promise.all([
          supabase
            .from("demo_jobs")
            .select()
            .eq("job_title", normalizedJobTitle)
            .is("company_name", null)
            .maybeSingle(),
          cleanedCompanyName
            ? supabase
                .from("demo_jobs")
                .select()
                .eq("job_title", normalizedJobTitle)
                .eq("company_name", cleanedCompanyName)
                .maybeSingle()
            : null,
        ]);

        const existingGenericJob = genericJobResult.data;
        const existingCompanyJob = companySpecificJobResult?.data;

        // Process jobs that don't exist
        const tasks: Promise<void>[] = [];

        if (!existingGenericJob) {
          logger.info("Processing generic job", { normalizedJobTitle });
          tasks.push(
            generateDemoJobQuestions({
              jobTitle: normalizedJobTitle,
              jobDescription,
            })
          );
        }

        if (cleanedCompanyName && companyDescription && !existingCompanyJob) {
          logger.info("Processing company-specific job", {
            normalizedJobTitle,
            cleanedCompanyName,
          });
          tasks.push(
            generateDemoJobQuestions({
              jobTitle: normalizedJobTitle,
              jobDescription,
              companyName: cleanedCompanyName,
              companyDescription,
            })
          );
        }

        if (tasks.length > 0) {
          await Promise.all(tasks);
          return { success: true };
        } else {
          return { success: true, message: "Jobs already exist" };
        }
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        logger.error("Error processing job", { error: error.message });
        return { success: false, error: error.message };
      }
    })
  );

  return results;
};

export const POST = withAxiom(async (req: AxiomRequest) => {
  const logger = req.log.with({
    path: "/api/admin/seo/demo-jobs",
  });

  try {
    // Read and parse the CSV file
    const csvPath = path.join(
      process.cwd(),
      "app/api/admin/seo/demo-jobs/jobs-to-process.csv"
    );
    const fileContent = await fs.readFile(csvPath, "utf-8");

    // Parse CSV with header row mapping and type casting
    let records = parse(fileContent, {
      columns: true, // Use first row as headers
      skip_empty_lines: true,
      trim: true, // Trim whitespace from values
      cast: true, // Automatically convert strings to appropriate types
    }) as JobRecord[];

    // Validate required fields
    records = records.filter(
      (record) => record.jobTitle && record.jobDescription
    );

    logger.info(`Found ${records.length} valid jobs to process`);

    // Process in batches of 5
    const BATCH_SIZE = 5;
    const results: ProcessingResult[] = [];

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      logger.info(
        `Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(
          records.length / BATCH_SIZE
        )}`,
        {
          batchSize: batch.length,
          startIndex: i,
        }
      );

      // Process current batch and wait for all jobs to complete (success or failure)
      const batchPromises = batch.map((job) => processBatch([job], logger));
      const batchResults = await Promise.allSettled(batchPromises);

      // Process the results
      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          results.push(...result.value);
        } else {
          logger.error(`Failed to process job in batch ${i / BATCH_SIZE + 1}`, {
            error: result.reason,
            jobIndex: i + index,
          });
          results.push({
            success: false,
            error: `Batch processing failed: ${result.reason}`,
          });
        }
      });

      logger.info(`Completed batch ${i / BATCH_SIZE + 1}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    logger.info("Finished processing all jobs", {
      totalProcessed: results.length,
      successCount,
      failureCount,
    });

    return NextResponse.json({
      message: "Processing complete",
      totalProcessed: results.length,
      successCount,
      failureCount,
      results,
    });
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error("Failed to process CSV file", { error: error.message });
    return NextResponse.json(
      { error: "Failed to process CSV file", details: error.message },
      { status: 500 }
    );
  }
});

const normalizeJobTitle = async (jobTitle: string) => {
  const systemPrompt = `Normalize the following job title to a standard format that can be used to identify similar job titles across different companies.
    Remove company-specific terms, standardize common variations, and use the most common industry-standard job title.
    For example:
    - "Senior Software Engineer (Python)" -> "Senior Software Engineer"
    - "Sr. Full Stack Developer" -> "Senior Full Stack Developer"
    - "Marketing Manager - Digital" -> "Digital Marketing Manager"
    - "Software Development Engineer II" -> "Senior Software Engineer"
    
    Return only the normalized title in JSON format.
    
    Input job title: ${jobTitle}`;

  const result = await generateObjectWithFallback({
    prompt: "Normalize the job title",
    schema: z.object({
      normalizedTitle: z.string(),
    }),
    systemPrompt,
  });
  const { normalizedTitle } = result;
  return normalizedTitle;
};

const generateDemoJobQuestions = async ({
  jobTitle,
  jobDescription,
  companyName,
  companyDescription,
}: {
  jobTitle: string;
  jobDescription: string;
  companyName?: string;
  companyDescription?: string;
}) => {
  const isCompanySpecific = !!companyName;
  const promptPrefix = isCompanySpecific
    ? `You are given a job title, job description, company name and company description.
       You are an expert job interviewer for the job title and description at the specific company with the given company description.
       Generate questions that are specifically tailored to this company, its values, and its specific needs.`
    : `You are given a job title and job description.
       You are an expert job interviewer for this type of role.
       Generate general questions that would be applicable for this type of role at any company.`;

  const systemPrompt = `${promptPrefix}

    Use all of this information to generate 10 job interview questions that will help you understand the candidate's skills and experience and their fit for the job.

    Include a variety of questions that will help you understand the candidate's skills and experience and their fit for the job such as behavioral questions, 
    situational questions, technical questions, domain specific questions, past experience questions, and other questions that will help you understand the candidate's skills 
    and experience and their fit for the job.

    With each question, provide an answer guideline that determines whether the answer is correct or not.
    
    For open ended questions (such as behavioral questions or past experience questions), provide a list of criteria that the answer must meet to be considered correct.

    For questions that have specific, correct answers (such as a calculation or technical question), make the answer guidelines be the correct answer.

    For each question, provide 3 example answers that are correct and incorrect. When generating your correct/incorrect answers, make sure that they are realistic
    and that they reflect the answer guidelines. 

    Return your response in JSON format with the following schema:
    {
      "questions": [
        {
          "question": string,
          "answerGuidelines": string,
          "correctExampleAnswers": string[]
          "incorrectExampleAnswers": string[]
        }
      ]
    }

    ## Job Title
    ${jobTitle}

    ## Job Description
    ${jobDescription}

    ${isCompanySpecific ? `## Company Name\n${companyName}\n\n## Company Description\n${companyDescription}` : ""}
    `;

  const MAX_RETRIES = 3;
  const INITIAL_BACKOFF = 1000; // 1 second

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await generateObjectWithFallback({
        prompt: "Generate the job interview questions",
        systemPrompt,
        schema: z.object({
          questions: z.array(
            z.object({
              question: z.string(),
              answerGuidelines: z.string(),
              correctExampleAnswers: z.array(z.string()),
              incorrectExampleAnswers: z.array(z.string()),
            })
          ),
        }),
        loggingContext: {
          path: "api/resume/generate",
          dataToExtract: "interview questions",
        },
      });

      const { questions } = result;

      try {
        // If we get here, both the API call and JSON parsing succeeded
        const demoJobId = await createDemoJob({
          jobTitle,
          jobDescription,
          companyName: isCompanySpecific ? companyName : undefined,
          companyDescription: isCompanySpecific
            ? companyDescription
            : undefined,
        });

        await writeDemoJobQuestionsToDb({
          customJobId: demoJobId,
          questions,
        });

        if (!isCompanySpecific) {
          // Format for generic jobs
          const kebabCaseSlug = jobTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

          const title = `${jobTitle} Practice Interview Questions`;
          const metaDescription = `Here are some practice interview questions for ${jobTitle} job interview.`;
          const metaTitle = `${jobTitle} Practice Interview Questions`;

          await writeDemoJobToNotion({
            title,
            slug: `${kebabCaseSlug}-practice-interview-questions`,
            metaDescription,
            metaTitle,
            blogIntro: metaDescription,
            questions: questions.slice(0, 4),
            demoJobId,
          });
        } else if (companyName) {
          // Format for company-specific jobs
          const kebabCaseSlug = `${companyName}-${jobTitle}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

          const title = `${companyName} ${jobTitle} Practice Interview Questions`;
          const metaDescription = `Here are some practice interview questions for a ${jobTitle} job interview at ${companyName}`;
          const metaTitle = `${companyName} ${jobTitle} Practice Interview Questions`;

          await writeDemoJobToNotion({
            title,
            slug: `${kebabCaseSlug}-practice-interview-questions`,
            metaDescription,
            metaTitle,
            blogIntro: metaDescription,
            questions: questions.slice(0, 5),
            demoJobId,
          });
          await generateResumeFromJob({
            demoJobId,
            jobTitle,
            jobDescription,
            companyName,
          });
        }

        return; // Success! Exit the function
      } catch (e) {
        // JSON parsing failed, throw error to trigger retry
        const parseError = e instanceof Error ? e : new Error(String(e));
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));

      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Failed after ${MAX_RETRIES} attempts. Last error: ${error.message}`
        );
      }

      // Exponential backoff with jitter
      const backoff = INITIAL_BACKOFF * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000; // Random delay between 0-1000ms
      await new Promise((resolve) => setTimeout(resolve, backoff + jitter));
    }
  }
};

const createDemoJob = async ({
  jobTitle,
  jobDescription,
  companyName,
  companyDescription,
}: {
  jobTitle: string;
  jobDescription: string;
  companyName?: string;
  companyDescription?: string;
}) => {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("demo_jobs")
    .insert({
      job_title: jobTitle,
      job_description: jobDescription,
      company_name: companyName,
      company_description: companyDescription,
    })
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data.id;
};

const writeDemoJobQuestionsToDb = async ({
  customJobId,
  questions,
}: {
  customJobId: string;
  questions: { question: string; answerGuidelines: string }[];
}) => {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("demo_job_questions").insert(
    questions.map((question) => ({
      question: question.question,
      answer_guidelines: question.answerGuidelines,
      custom_job_id: customJobId,
    }))
  );
  if (error) {
    throw new Error(error.message);
  }
};

const writeDemoJobToNotion = async ({
  title,
  slug,
  metaDescription,
  metaTitle,
  blogIntro,
  questions,
  demoJobId,
}: {
  title: string;
  slug: string;
  metaDescription: string;
  metaTitle: string;
  blogIntro: string;
  questions: {
    question: string;
    answerGuidelines: string;
    correctExampleAnswers: string[];
    incorrectExampleAnswers: string[];
  }[];
  demoJobId: string;
}) => {
  const databaseId = "18271566997b813b822ef00c7aa00c3a";
  const notion = new Client({
    auth: process.env.NOTION_API_KEY!,
  });
  const questionBlocks: BlockObjectRequest[] = questions.flatMap(
    (question, index) => {
      const blocks: BlockObjectRequest[] = [];

      // Add CTA blocks before the second question
      if (index === 1) {
        blocks.push(
          {
            object: "block" as const,
            quote: {
              rich_text: [
                {
                  text: {
                    content:
                      "Want to practice answering these questions? Try our AI-powered mock interviews that provides instant feedback on your answers.\n\n",
                  },
                },
                {
                  text: {
                    content: "Click here to practice these interview questions",
                    link: {
                      url: `https://perfectinterview.ai/clone-demo-job/${demoJobId}`,
                    },
                  },
                },
              ],
            },
          },
          {
            object: "block" as const,
            divider: {},
          }
        );
      }

      // Add question blocks
      blocks.push(
        {
          object: "block" as const,
          heading_2: {
            rich_text: [
              {
                text: {
                  content: `Question #${index + 1}: ${question.question}`,
                },
              },
            ],
          },
        },
        {
          object: "block" as const,
          heading_3: {
            rich_text: [
              {
                text: {
                  content: "Answer Guideline",
                },
              },
            ],
          },
        },
        {
          object: "block" as const,
          paragraph: {
            rich_text: [{ text: { content: question.answerGuidelines } }],
          },
        },
        {
          object: "block" as const,
          heading_3: {
            rich_text: [{ text: { content: "Examples of Good Answers" } }],
          },
        },
        ...question.correctExampleAnswers.map((answer) => ({
          object: "block" as const,
          numbered_list_item: {
            rich_text: [{ text: { content: answer } }],
          },
        }))
        // {
        //   object: "block" as const,
        //   heading_3: {
        //     rich_text: [{ text: { content: "Examples of Bad Answers" } }],
        //   },
        // },
        // ...question.incorrectExampleAnswers.map((answer) => ({
        //   object: "block" as const,
        //   numbered_list_item: {
        //     rich_text: [{ text: { content: answer } }],
        //   },
        // }))
      );

      if (index !== questions.length - 1) {
        blocks.push({
          object: "block" as const,
          divider: {},
        });
      }

      return blocks;
    }
  );
  await notion.pages.create({
    parent: {
      type: "database_id",
      database_id: databaseId,
    },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      },
      Slug: {
        rich_text: [
          {
            text: {
              content: slug,
            },
          },
        ],
      },
      "Ready to Publish": {
        checkbox: true,
      },
      "Hide Cover": {
        checkbox: true,
      },
      "Meta Description": {
        rich_text: [
          {
            text: {
              content: metaDescription,
            },
          },
        ],
      },
      "Meta Title": {
        rich_text: [
          {
            text: {
              content: metaTitle,
            },
          },
        ],
      },
    },
    children: [
      {
        object: "block",
        heading_1: {
          rich_text: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
      {
        object: "block",
        paragraph: {
          rich_text: [
            {
              text: {
                content: blogIntro,
              },
            },
          ],
        },
      },
      {
        object: "block",
        divider: {},
      },
      ...questionBlocks,
    ],
  });
};

const cleanupText = async (text: string) => {
  const prompt = [
    `Clean up and format the following text as a proper English title/name. 
    The first letter of each major word should be capitalized, and everything else should be lowercase.
    Remove any unnecessary spaces, special characters, or formatting.
    Return only the cleaned text in JSON format.
    
    Input text: ${text}`,
  ];

  const result = await generateObjectWithFallback({
    prompt: prompt[0],
    schema: z.object({
      cleanedText: z.string(),
    }),
    loggingContext: {
      path: "api/resume/generate",
      dataToExtract: "cleaned text",
    },
  });

  return result.cleanedText;
};

const saveGeneratedResume = async ({
  resumeData,
  resumeMetadata,
  jobTitle,
  jobDescription,
  companyName,
  companyDescription,
}: {
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
  };
  resumeMetadata: {
    demo_job_id: string;
    important_skills: string[];
    important_work_experience: string[];
  };
  jobTitle: string;
  jobDescription: string | null;
  companyName?: string | null;
  companyDescription?: string | null;
}) => {
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
      ...resumeMetadata,
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

const generateResumeFromJob = async ({
  jobTitle,
  jobDescription,
  companyName,
  demoJobId,
}: {
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  demoJobId: string;
}) => {
  const prompt = `
    ## Job Title: ${jobTitle}
    ## Company: ${companyName}
    ## Job Description: ${jobDescription}

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

  const [
    personalInfo,
    educationHistory,
    workExperience,
    skills,
    importantSkills,
    importantWorkExperience,
  ] = await Promise.all([
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
    generateObjectWithFallback({
      systemPrompt: prompt,
      prompt: `From job description, identify and generate some important skills that would be relevant
        for a candidate to have when applying to this job. Return as many skills as you can but limit it to 10.`,
      schema: z.array(z.string()),
      loggingContext: {
        path: "api/admin/seo/demo-job-resumes",
        dataToExtract: "important skills",
      },
    }),
    generateObjectWithFallback({
      systemPrompt: prompt,
      prompt: `From job description, identify and generate some important work experience that would be relevant
        for a candidate to have when applying to this job. Return as many work experiences as you can but limit it to 10.`,
      schema: z.array(z.string()),
      loggingContext: {
        path: "api/admin/seo/demo-job-resumes",
        dataToExtract: "important work experience",
      },
    }),
  ]);

  const generatedData = {
    personalInfo,
    educationHistory,
    workExperience,
    skills,
  };

  await saveGeneratedResume({
    resumeData: generatedData,
    jobTitle,
    jobDescription,
    companyName,
    resumeMetadata: {
      demo_job_id: demoJobId,
      important_skills: importantSkills,
      important_work_experience: importantWorkExperience,
    },
  });
};

const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .replace(/--+/g, "-"); // Replace multiple hyphens with single hyphen
