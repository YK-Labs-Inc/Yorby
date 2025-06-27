import { AxiomRequest, withAxiom } from "next-axiom";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { createAdminClient } from "@/utils/supabase/server";
import { Database } from "@/utils/supabase/database.types";

interface CSVEntry {
    Question: string;
    Answer: string;
    Rubric: string;
}

// Type aliases for clarity
type CustomJobQuestionInsert =
    Database["public"]["Tables"]["custom_job_questions"]["Insert"];
type CustomJobQuestionSampleAnswerInsert =
    Database["public"]["Tables"]["custom_job_question_sample_answers"][
        "Insert"
    ];

async function processCSVFile(
    csvPath: string,
    targetCustomJobId: string,
    logger: AxiomRequest["log"],
) {
    const supabase = await createAdminClient();
    let questionsInsertedCount = 0;
    let sampleAnswersInsertedCount = 0;
    const insertionErrors: { rowIndex: number; error: any }[] = [];

    try {
        // Read and parse CSV
        const fileContent = await fs.readFile(csvPath, "utf-8");
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as CSVEntry[];

        logger.info(`Parsed CSV file ${csvPath}`, {
            record_count: records.length,
            targetCustomJobId,
        });

        // Process each record
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const rowIndex = i + 2; // +2 because CSV has header row and is 1-indexed

            logger.info(`Processing row ${rowIndex}`, {
                question: record.Question?.substring(0, 100),
                hasAnswer: !!record.Answer,
                hasRubric: !!record.Rubric,
            });

            try {
                // Skip if no question
                if (!record.Question || record.Question.trim() === "") {
                    logger.warn(`Skipping row ${rowIndex} - no question`, {
                        rowIndex,
                    });
                    continue;
                }

                // Skip if no rubric
                if (!record.Rubric || record.Rubric.trim() === "") {
                    logger.warn(`Skipping row ${rowIndex} - no rubric`, {
                        rowIndex,
                        question: record.Question.substring(0, 100),
                    });
                    continue;
                }

                // Insert into custom_job_questions
                const questionInsertData: CustomJobQuestionInsert = {
                    question: record.Question,
                    answer_guidelines: record.Rubric,
                    custom_job_id: targetCustomJobId,
                    question_type: "user_generated",
                    publication_status: "published",
                };

                const { data: questionData, error: questionError } =
                    await supabase
                        .from("custom_job_questions")
                        .insert(questionInsertData)
                        .select("id")
                        .single();

                if (questionError || !questionData) {
                    logger.error("Error inserting question", {
                        rowIndex,
                        question: record.Question.substring(0, 100),
                        error: questionError,
                    });
                    insertionErrors.push({
                        rowIndex,
                        error: questionError ||
                            new Error("No data returned after question insert"),
                    });
                    continue;
                }

                const newQuestionId = questionData.id;
                questionsInsertedCount++;
                logger.info("Successfully inserted question", {
                    rowIndex,
                    newQuestionId,
                });

                // Insert sample answer if present
                if (record.Answer && record.Answer.trim() !== "") {
                    const sampleAnswerInsertData:
                        CustomJobQuestionSampleAnswerInsert = {
                            question_id: newQuestionId,
                            answer: record.Answer,
                        };

                    const { error: answerError } = await supabase
                        .from("custom_job_question_sample_answers")
                        .insert(sampleAnswerInsertData);

                    if (answerError) {
                        logger.error("Error inserting sample answer", {
                            rowIndex,
                            questionId: newQuestionId,
                            error: answerError,
                        });
                        insertionErrors.push({
                            rowIndex,
                            error:
                                `Sample answer insert failed: ${answerError.message}`,
                        });
                    } else {
                        sampleAnswersInsertedCount++;
                        logger.info("Successfully inserted sample answer", {
                            rowIndex,
                            questionId: newQuestionId,
                        });
                    }
                }
            } catch (loopError) {
                logger.error("Unhandled error during insertion loop", {
                    rowIndex,
                    error: loopError,
                });
                insertionErrors.push({ rowIndex, error: loopError });
            }
        }

        return {
            questionsInserted: questionsInsertedCount,
            sampleAnswersInserted: sampleAnswersInsertedCount,
            errors: insertionErrors,
            totalRecords: records.length,
        };
    } catch (error) {
        logger.error("Error processing CSV file", {
            csvPath,
            error,
        });
        throw error;
    }
}

export const POST = withAxiom(async (req: AxiomRequest) => {
    const logger = req.log.with({
        path: "/api/admin/firefighterrob",
    });

    try {
        logger.info("Starting firefighterrob data import");

        // Process real-questions.csv
        const realQuestionsPath = path.join(
            process.cwd(),
            "app/api/admin/firefighterrob/real-questions.csv",
        );
        const realQuestionsJobId = "236f6a36-17c9-418e-8519-861c6f32f915";

        logger.info("Processing real-questions.csv", {
            customJobId: realQuestionsJobId,
        });

        const realQuestionsResult = await processCSVFile(
            realQuestionsPath,
            realQuestionsJobId,
            logger,
        );

        // Process what-if-questions.csv
        const whatIfQuestionsPath = path.join(
            process.cwd(),
            "app/api/admin/firefighterrob/what-if-questions.csv",
        );
        const whatIfQuestionsJobId = "49ba1c1a-40d4-4320-8498-138984c7b893";

        logger.info("Processing what-if-questions.csv", {
            customJobId: whatIfQuestionsJobId,
        });

        const whatIfQuestionsResult = await processCSVFile(
            whatIfQuestionsPath,
            whatIfQuestionsJobId,
            logger,
        );

        // Compile results
        const totalQuestionsInserted = realQuestionsResult.questionsInserted +
            whatIfQuestionsResult.questionsInserted;
        const totalSampleAnswersInserted =
            realQuestionsResult.sampleAnswersInserted +
            whatIfQuestionsResult.sampleAnswersInserted;
        const totalErrors = [
            ...realQuestionsResult.errors,
            ...whatIfQuestionsResult.errors,
        ];

        logger.info("Finished firefighterrob data import", {
            totalQuestionsInserted,
            totalSampleAnswersInserted,
            totalErrors: totalErrors.length,
        });

        return NextResponse.json({
            success: totalErrors.length === 0,
            message: totalErrors.length === 0
                ? "Both CSV files processed and data inserted successfully."
                : `Processing complete with ${totalErrors.length} errors.`,
            realQuestions: {
                customJobId: realQuestionsJobId,
                totalRecords: realQuestionsResult.totalRecords,
                questionsInserted: realQuestionsResult.questionsInserted,
                sampleAnswersInserted:
                    realQuestionsResult.sampleAnswersInserted,
                errors: realQuestionsResult.errors,
            },
            whatIfQuestions: {
                customJobId: whatIfQuestionsJobId,
                totalRecords: whatIfQuestionsResult.totalRecords,
                questionsInserted: whatIfQuestionsResult.questionsInserted,
                sampleAnswersInserted:
                    whatIfQuestionsResult.sampleAnswersInserted,
                errors: whatIfQuestionsResult.errors,
            },
            summary: {
                totalQuestionsInserted,
                totalSampleAnswersInserted,
                totalErrors: totalErrors.length,
            },
        });
    } catch (error) {
        logger.error("Fatal error in POST /api/admin/firefighterrob", {
            error,
        });
        return NextResponse.json({
            success: false,
            message: "Error processing request",
            error: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
});
