import { NextResponse } from "next/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { SchemaType } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/utils/supabase/server";
import { Client } from "@notionhq/client";
import { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { promises as fs } from "fs";
import path from "path";

// Use require for csv-parse as it doesn't have TypeScript types
const { parse } = require("csv-parse/sync");

export const maxDuration = 300;

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
    const records = parse(fileContent, {
      columns: true, // Use first row as headers
      skip_empty_lines: true,
      trim: true, // Trim whitespace from values
      cast: true, // Automatically convert strings to appropriate types
    }) as JobRecord[];

    // Validate required fields
    const invalidRecords = records.filter(
      (record) => !record.jobTitle || !record.jobDescription
    );

    if (invalidRecords.length > 0) {
      throw new Error(
        `Found ${invalidRecords.length} records with missing required fields`
      );
    }

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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const normalizeJobTitle = async (jobTitle: string) => {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          normalizedTitle: { type: SchemaType.STRING },
        },
        required: ["normalizedTitle"],
      },
    },
  });

  const result = await model.generateContent([
    `Normalize the following job title to a standard format that can be used to identify similar job titles across different companies.
    Remove company-specific terms, standardize common variations, and use the most common industry-standard job title.
    For example:
    - "Senior Software Engineer (Python)" -> "Senior Software Engineer"
    - "Sr. Full Stack Developer" -> "Senior Full Stack Developer"
    - "Marketing Manager - Digital" -> "Digital Marketing Manager"
    - "Software Development Engineer II" -> "Senior Software Engineer"
    
    Return only the normalized title in JSON format.
    
    Input job title: ${jobTitle}`,
  ]);

  const response = result.response.text();
  const { normalizedTitle } = JSON.parse(response);
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
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                question: { type: SchemaType.STRING },
                answerGuidelines: { type: SchemaType.STRING },
                correctExampleAnswers: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                },
                incorrectExampleAnswers: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                },
              },
              required: [
                "question",
                "answerGuidelines",
                "correctExampleAnswers",
                "incorrectExampleAnswers",
              ],
            },
          },
        },
        required: ["questions"],
      },
    },
  });

  const isCompanySpecific = !!companyName;
  const promptPrefix = isCompanySpecific
    ? `You are given a job title, job description, company name and company description.
       You are an expert job interviewer for the job title and description at the specific company with the given company description.
       Generate questions that are specifically tailored to this company, its values, and its specific needs.`
    : `You are given a job title and job description.
       You are an expert job interviewer for this type of role.
       Generate general questions that would be applicable for this type of role at any company.`;

  const prompt = `${promptPrefix}

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
      const result = await model.generateContent([prompt]);
      const response = result.response.text();

      try {
        const { questions } = JSON.parse(response) as {
          questions: {
            question: string;
            answerGuidelines: string;
            correctExampleAnswers: string[];
            incorrectExampleAnswers: string[];
          }[];
        };

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
            questions: questions.slice(0, 5),
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
        })),
        {
          object: "block" as const,
          heading_3: {
            rich_text: [{ text: { content: "Examples of Bad Answers" } }],
          },
        },
        ...question.incorrectExampleAnswers.map((answer) => ({
          object: "block" as const,
          numbered_list_item: {
            rich_text: [{ text: { content: answer } }],
          },
        }))
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
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          cleanedText: { type: SchemaType.STRING },
        },
        required: ["cleanedText"],
      },
    },
  });

  const result = await model.generateContent([
    `Clean up and format the following text as a proper English title/name. 
    The first letter of each major word should be capitalized, and everything else should be lowercase.
    Remove any unnecessary spaces, special characters, or formatting.
    Return only the cleaned text in JSON format.
    
    Input text: ${text}`,
  ]);

  const response = result.response.text();
  const { cleanedText } = JSON.parse(response);
  return cleanedText;
};
