import { AxiomRequest, withAxiom } from "next-axiom";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
const { parse } = require("csv-parse/sync");
import { generateTextWithFallback } from "@/utils/ai/gemini";
import { createAdminClient } from "@/utils/supabase/server";
import { Database } from "@/utils/supabase/database.types";

interface CSVEntry {
    question: string;
    sample_answer: string;
}

interface ProcessedEntry extends CSVEntry {
    generated_answer_guidelines?: string;
    guidelineGenerationError?: string;
}

// Type aliases for clarity
type CustomJobQuestionInsert =
    Database["public"]["Tables"]["custom_job_questions"]["Insert"];
type CustomJobQuestionSampleAnswerInsert =
    Database["public"]["Tables"]["custom_job_question_sample_answers"][
        "Insert"
    ];

// --- Start: Answer Guidelines Generation Helper Function ---
interface GuidelineGenerationResult {
    guidelines?: string;
    error?: string;
}

async function generateAnswerGuidelines(
    question: string,
    sampleAnswer: string,
    logger: AxiomRequest["log"],
): Promise<GuidelineGenerationResult> {
    try {
        logger.info("Generating answer guidelines using AI", {
            questionPreview: question.substring(0, 100),
            sampleAnswerPreview: sampleAnswer.substring(0, 100),
        });

        const guidelines = await generateTextWithFallback({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text:
                                `Given the following interview question and a sample answer, please generate comprehensive answer guidelines that would help someone craft a strong response to this question.

**Interview Question:**
${question}

**Sample Answer:**
${sampleAnswer}

**Instructions:**
Please analyze the sample answer and create detailed answer guidelines that:

1. **Structure & Format**: Explain the ideal structure and format for answering this question
2. **Key Elements**: Identify the essential components that should be included in any response
3. **Best Practices**: Highlight what makes the sample answer effective
4. **Common Pitfalls**: Note what to avoid when answering this question
5. **Specific Tips**: Provide actionable advice for crafting a compelling response

Format your response as clear, actionable guidelines that a job candidate could follow to prepare their own answer to this question. Focus on the underlying principles and techniques demonstrated in the sample answer rather than just repeating the content.

Your response should be the guidelines and only the guidelines and nothing else.
`,
                        },
                    ],
                },
            ],
            systemPrompt:
                "You are an expert career coach and interview preparation specialist. Analyze the provided question and sample answer to create comprehensive, actionable guidelines that help candidates understand how to structure and deliver effective responses. Focus on transferable principles rather than specific content.",
            loggingContext: {
                source: "admin/jesse/generate_guidelines",
                questionLength: question.length,
                sampleAnswerLength: sampleAnswer.length,
            },
        });

        logger.info("Successfully generated answer guidelines", {
            guidelinesLength: guidelines?.length,
        });

        return { guidelines };
    } catch (error: any) {
        logger.error("Failed to generate answer guidelines", {
            error: error.message,
            questionPreview: question.substring(0, 50),
        });
        return { error: error.message };
    }
}
// --- End: Answer Guidelines Generation Helper Function ---

async function processCSVEntries(
    csvEntries: CSVEntry[],
    logger: AxiomRequest["log"],
): Promise<ProcessedEntry[]> {
    const processedEntries: ProcessedEntry[] = [];

    logger.info("Starting AI processing of CSV entries", {
        totalEntries: csvEntries.length,
    });

    for (let i = 0; i < csvEntries.length; i++) {
        const entry = csvEntries[i];
        logger.info(`Processing entry ${i + 1}/${csvEntries.length}`, {
            questionPreview: entry.question.substring(0, 50),
        });

        const processedEntry: ProcessedEntry = { ...entry };

        // Generate answer guidelines using AI
        const guidelineResult = await generateAnswerGuidelines(
            entry.question,
            entry.sample_answer,
            logger,
        );

        if (guidelineResult.guidelines) {
            processedEntry.generated_answer_guidelines =
                guidelineResult.guidelines;
        }
        if (guidelineResult.error) {
            processedEntry.guidelineGenerationError = guidelineResult.error;
        }

        processedEntries.push(processedEntry);
    }

    logger.info("Completed AI processing of CSV entries", {
        totalProcessed: processedEntries.length,
        successfulGuidelines: processedEntries.filter((e) =>
            !!e.generated_answer_guidelines
        ).length,
        failedGuidelines: processedEntries.filter((e) =>
            !!e.guidelineGenerationError
        ).length,
    });

    return processedEntries;
}

export const POST = withAxiom(async (req: AxiomRequest) => {
    const logger = req.log.with({
        path: "/api/admin/jesse",
    });

    try {
        // 1. Parse CSV
        const csvPath = path.join(
            process.cwd(),
            "app/api/admin/jesse/data.csv",
        );
        const fileContent = await fs.readFile(csvPath, "utf-8");
        let csvEntries = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            cast: true,
        }) as CSVEntry[];

        logger.info("Parsed CSV file", { record_count: csvEntries.length });

        // 2. Process entries with AI to generate answer guidelines
        const processedEntries = await processCSVEntries(csvEntries, logger);

        // --- Start: Database Insertion Logic ---
        const supabase = await createAdminClient();

        // TODO: Replace with Jesse's specific custom job ID
        const targetCustomJobId = "685279f7-e61d-417c-ac6b-c7f228fe027a";
        let questionsInsertedCount = 0;
        let sampleAnswersInsertedCount = 0;
        const insertionErrors: { entryIndex: number; error: any }[] = [];

        logger.info("Starting database insertions...", { targetCustomJobId });

        // Get the user_id from the target custom job
        const { data: customJobData, error: customJobError } = await supabase
            .from("custom_jobs")
            .select("user_id")
            .eq("id", targetCustomJobId)
            .single();

        if (customJobError || !customJobData) {
            logger.error("Error fetching custom job data", {
                targetCustomJobId,
                error: customJobError,
            });
            throw new Error(
                `Failed to fetch custom job: ${
                    customJobError?.message || "No data returned"
                }`,
            );
        }

        const userId = customJobData.user_id;
        logger.info("Found user_id for custom job", {
            userId,
            targetCustomJobId,
        });

        for (let i = 0; i < processedEntries.length; i++) {
            const entry = processedEntries[i];
            logger.info(`Processing entry index ${i}`, {
                question: entry.question.substring(0, 100),
                hasGuidelines: !!entry.generated_answer_guidelines,
                hasGuidelineError: !!entry.guidelineGenerationError,
            });

            try {
                // Skip entries where guideline generation failed
                if (!entry.generated_answer_guidelines) {
                    logger.warn("Skipping entry due to missing guidelines", {
                        entryIndex: i,
                        guidelineError: entry.guidelineGenerationError,
                    });
                    insertionErrors.push({
                        entryIndex: i,
                        error: `Missing guidelines: ${
                            entry.guidelineGenerationError || "Unknown error"
                        }`,
                    });
                    continue;
                }

                // 3. Insert into custom_job_questions
                const questionInsertData: CustomJobQuestionInsert = {
                    question: entry.question,
                    answer_guidelines: entry.generated_answer_guidelines,
                    custom_job_id: targetCustomJobId,
                    question_type: "user_generated", // Assuming these are user generated
                };

                const { data: questionData, error: questionError } =
                    await supabase
                        .from("custom_job_questions")
                        .insert(questionInsertData)
                        .select("id")
                        .single();

                if (questionError || !questionData) {
                    logger.error("Error inserting question", {
                        entryIndex: i,
                        question: entry.question.substring(0, 100),
                        error: questionError,
                    });
                    insertionErrors.push({
                        entryIndex: i,
                        error: questionError ||
                            new Error("No data returned after question insert"),
                    });
                    continue; // Skip to next entry if insertion failed
                }

                const newQuestionId = questionData.id;
                questionsInsertedCount++;
                logger.info("Successfully inserted question", {
                    entryIndex: i,
                    newQuestionId,
                });

                // 4. Insert sample answer
                const sampleAnswerInsertData:
                    CustomJobQuestionSampleAnswerInsert = {
                        question_id: newQuestionId,
                        answer: entry.sample_answer,
                        // No file storage for Jesse's endpoint
                    };

                const { error: answerError } = await supabase
                    .from("custom_job_question_sample_answers")
                    .insert(sampleAnswerInsertData);

                if (answerError) {
                    logger.error("Error inserting sample answer", {
                        entryIndex: i,
                        questionId: newQuestionId,
                        error: answerError,
                    });
                    insertionErrors.push({
                        entryIndex: i,
                        error:
                            `Sample answer insert failed: ${answerError.message}`,
                    });
                } else {
                    sampleAnswersInsertedCount++;
                    logger.info("Successfully inserted sample answer", {
                        entryIndex: i,
                        questionId: newQuestionId,
                    });
                }
            } catch (loopError) {
                logger.error("Unhandled error during insertion loop", {
                    entryIndex: i,
                    error: loopError,
                });
                insertionErrors.push({ entryIndex: i, error: loopError });
            }
        }
        // --- End: Database Insertion Logic ---

        logger.info("Finished database insertions.", {
            questionsInserted: questionsInsertedCount,
            sampleAnswersInserted: sampleAnswersInsertedCount,
            errorsEncountered: insertionErrors.length,
        });

        return NextResponse.json({
            success: insertionErrors.length === 0,
            message: insertionErrors.length === 0
                ? "CSV parsed, answer guidelines generated, and data inserted successfully."
                : `Processing complete with ${insertionErrors.length} errors.`,
            totalCsvEntries: csvEntries.length,
            processedEntries: processedEntries.length,
            questionsInserted: questionsInsertedCount,
            sampleAnswersInserted: sampleAnswersInsertedCount,
            guidelinesGenerated: processedEntries.filter((e) =>
                !!e.generated_answer_guidelines
            ).length,
            guidelineGenerationFailed: processedEntries.filter((e) =>
                !!e.guidelineGenerationError
            ).length,
            insertionErrors: insertionErrors, // Include details of errors
        });
    } catch (error) {
        logger.error("Fatal error in POST /api/admin/jesse", { error });
        return NextResponse.json({
            success: false,
            message: "Error processing request",
            error: error instanceof Error ? error.message : String(error),
        }, { status: 500 }); // Return 500 for fatal errors
    }
});
