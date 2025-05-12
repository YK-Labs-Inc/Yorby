import { AxiomRequest, withAxiom } from "next-axiom";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
const { parse } = require("csv-parse/sync");
import { generateTextWithFallback } from "@/utils/ai/gemini";
import {
    createAdminClient,
    createSupabaseServerClient,
} from "@/utils/supabase/server";
import { Database } from "@/utils/supabase/database.types";

interface Entry {
    question: string;
    answer_guidelines: string;
}

interface ParsedAudioInfo {
    fileName: string;
    questionNumber: number; // 1-based from filename
    responseIndex: number; // 1-based from filename
    buffer: Buffer; // Node.js Buffer
    transcription?: string;
    transcriptionError?: string;
}

interface MappedEntry extends Entry {
    associated_audio: {
        fileName: string;
        responseIndex: number;
        hasTranscription: boolean;
        transcriptionError?: string;
        // We won't include the buffer in the logged/returned JSON for brevity,
        // but it's available in ParsedAudioInfo if needed for DB operations.
    }[];
}

// Ensure GEMINI_API_KEY is available, similar to transcribe/route.ts
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

// Type aliases for clarity
type CustomJobQuestionInsert =
    Database["public"]["Tables"]["custom_job_questions"]["Insert"];
type CustomJobQuestionSampleAnswerInsert =
    Database["public"]["Tables"]["custom_job_question_sample_answers"][
        "Insert"
    ];

// --- Start: Transcription Helper Function ---
interface TranscriptionResult {
    transcription?: string;
    transcriptionError?: string;
}

async function transcribeAudioBuffer(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    logger: AxiomRequest["log"],
): Promise<TranscriptionResult> {
    if (!GEMINI_API_KEY) {
        logger.warn(
            "(TranscriptionHelper) GEMINI_API_KEY not set. Skipping transcription.",
            { fileName },
        );
        return { transcriptionError: "API key not configured" };
    }

    try {
        const arrayBuffer = new Uint8Array(fileBuffer).buffer as ArrayBuffer;
        logger.info("(TranscriptionHelper) Transcribing audio file", {
            fileName,
            mimeType,
        });

        const transcriptionResultText = await generateTextWithFallback({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text:
                                'Please transcribe the following audio accurately. Maintain proper punctuation and paragraph breaks. If you are unable to provide a transcription, please return "Unable to transcribe audio. Please try again.".',
                        },
                        {
                            type: "file",
                            mimeType: mimeType,
                            data: arrayBuffer,
                        },
                    ],
                },
            ],
            systemPrompt: "",
            loggingContext: {
                fileName,
                source: "admin/techsalesjack/transcribe_helper",
                mimeType,
            },
        });
        logger.info("(TranscriptionHelper) Transcription successful", {
            fileName,
            transcriptionLength: transcriptionResultText?.length,
        });
        return { transcription: transcriptionResultText };
    } catch (transcriptionError: any) {
        logger.error("(TranscriptionHelper) Transcription failed", {
            fileName,
            error: transcriptionError.message,
        });
        return { transcriptionError: transcriptionError.message };
    }
}
// --- End: Transcription Helper Function ---

async function processAndParseAudioFiles(
    audioDir: string,
    logger: AxiomRequest["log"], // Using AxiomRequest["log"] for a more specific type if available
): Promise<ParsedAudioInfo[]> {
    const parsedAudioDataList: ParsedAudioInfo[] = [];
    const audioFileRegex = /^tsj-q(\d+)-(\d+)\.(mp4|m4a)$/i;

    try {
        const filesInAudioDir = await fs.readdir(audioDir);
        logger.info("(Helper) Found files in audio directory", {
            count: filesInAudioDir.length,
            files: filesInAudioDir.length < 20
                ? filesInAudioDir
                : filesInAudioDir.slice(0, 20).concat([
                    `... and ${filesInAudioDir.length - 20} more`,
                ]), // Avoid overly long logs
        });

        for (const fileName of filesInAudioDir) {
            const match = fileName.match(audioFileRegex);
            if (match) {
                const questionNumber = parseInt(match[1], 10);
                const responseIndex = parseInt(match[2], 10);
                const audioFilePath = path.join(audioDir, fileName);

                try {
                    const fileBuffer = await fs.readFile(audioFilePath);
                    const audioInfo: ParsedAudioInfo = {
                        fileName,
                        questionNumber,
                        responseIndex,
                        buffer: fileBuffer,
                    };

                    // --- Call new Transcription Helper ---
                    const fileExtension = path.extname(fileName).toLowerCase();
                    let mimeType = "application/octet-stream"; // Default if not mp4 or m4a
                    if (fileExtension === ".mp4") {
                        mimeType = "audio/mp4";
                    } else if (fileExtension === ".m4a") {
                        mimeType = "audio/m4a";
                    }

                    const transcriptionData = await transcribeAudioBuffer(
                        fileBuffer,
                        fileName,
                        mimeType,
                        logger,
                    );

                    if (transcriptionData.transcription) {
                        audioInfo.transcription =
                            transcriptionData.transcription;
                    }
                    if (transcriptionData.transcriptionError) {
                        audioInfo.transcriptionError =
                            transcriptionData.transcriptionError;
                    }
                    // --- End Call Transcription Helper ---

                    parsedAudioDataList.push(audioInfo);
                } catch (fileReadError) {
                    logger.error("(Helper) Error reading audio file", {
                        fileName,
                        path: audioFilePath,
                        error: fileReadError,
                    });
                }
            } else {
                // Optional: Log skipped files if needed for debugging, can be noisy
                // logger.warn("(Helper) Skipping file not matching pattern", { fileName });
            }
        }
        logger.info("(Helper) Finished processing audio files", {
            processedCount: parsedAudioDataList.length,
        });
    } catch (dirReadError) {
        logger.error("(Helper) Error reading audio directory", {
            audioDir,
            error: dirReadError,
        });
        // Depending on requirements, might want to throw or return empty/partial list
    }
    return parsedAudioDataList;
}

export const POST = withAxiom(async (req: AxiomRequest) => {
    const logger = req.log.with({
        path: "/api/admin/techsalesjack",
    });

    try {
        // 1. Parse CSV
        const csvPath = path.join(
            process.cwd(),
            "app/api/admin/techsalesjack/data.csv",
        );
        const fileContent = await fs.readFile(csvPath, "utf-8");
        let records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            cast: true,
        }) as Entry[];
        logger.info("Parsed CSV file", { record_count: records.length });

        // 2. Get Associated Audio Files & Transcribe
        const audioDir = path.join(
            process.cwd(),
            "app/api/admin/techsalesjack/audio",
        );
        const parsedAudioDataList = await processAndParseAudioFiles(
            audioDir,
            logger,
        );
        logger.info("Processed audio files via helper", {
            count: parsedAudioDataList.length,
        });

        // --- Start: Database Insertion Logic ---
        const supabase = await createAdminClient();
        const targetCustomJobId = "45679815-8fd7-41ca-8da5-c941d264159b";
        let questionsInsertedCount = 0;
        let sampleAnswersInsertedCount = 0;
        const insertionErrors: { questionIndex: number; error: any }[] = [];

        logger.info("Starting database insertions...", { targetCustomJobId });

        for (let i = 0; i < records.length; i++) {
            const csvRecord = records[i];
            const currentQuestionNumberInFile = i + 1; // 1-based question number
            logger.info(
                `Processing question index ${i} (Q#: ${currentQuestionNumberInFile})`,
                { question: csvRecord.question },
            );

            try {
                // 3. Insert into custom_job_questions
                const questionInsertData: CustomJobQuestionInsert = {
                    question: csvRecord.question,
                    answer_guidelines: csvRecord.answer_guidelines,
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
                        questionIndex: i,
                        question: csvRecord.question,
                        error: questionError,
                    });
                    insertionErrors.push({
                        questionIndex: i,
                        error: questionError ||
                            new Error("No data returned after question insert"),
                    });
                    continue; // Skip to next question if insertion failed
                }

                const newQuestionId = questionData.id;
                questionsInsertedCount++;
                logger.info("Successfully inserted question", {
                    questionIndex: i,
                    newQuestionId,
                });

                // 4. Find transcribed answers and insert into custom_job_question_sample_answer
                const transcribedAnswers = parsedAudioDataList
                    .filter((audio) =>
                        audio.questionNumber === currentQuestionNumberInFile &&
                        audio.transcription &&
                        audio.transcription.trim() !== "" &&
                        audio.transcription !==
                            "Unable to transcribe audio. Please try again."
                    )
                    .map((audio) =>
                        ({
                            question_id: newQuestionId,
                            answer: audio.transcription!,
                        }) as CustomJobQuestionSampleAnswerInsert
                    ); // Asserting non-null transcription here based on filter

                if (transcribedAnswers.length > 0) {
                    logger.info(
                        `Found ${transcribedAnswers.length} transcribed answers for question ${newQuestionId}`,
                        { questionIndex: i },
                    );
                    const { error: answerError } = await supabase
                        .from("custom_job_question_sample_answers")
                        .insert(transcribedAnswers);

                    if (answerError) {
                        logger.error("Error inserting sample answers", {
                            questionIndex: i,
                            questionId: newQuestionId,
                            numberOfAnswers: transcribedAnswers.length,
                            error: answerError,
                        });
                        // Log error but potentially continue? Or add to errors list?
                        insertionErrors.push({
                            questionIndex: i,
                            error:
                                `Sample answer insert failed: ${answerError.message}`,
                        });
                    } else {
                        sampleAnswersInsertedCount += transcribedAnswers.length;
                        logger.info(
                            `Successfully inserted ${transcribedAnswers.length} sample answers`,
                            { questionIndex: i, questionId: newQuestionId },
                        );
                    }
                } else {
                    logger.warn("No valid transcriptions found for question", {
                        questionIndex: i,
                        questionId: newQuestionId,
                    });
                }
            } catch (loopError) {
                logger.error("Unhandled error during insertion loop", {
                    questionIndex: i,
                    error: loopError,
                });
                insertionErrors.push({ questionIndex: i, error: loopError });
            }
        }
        // --- End: Database Insertion Logic ---

        logger.info("Finished database insertions.", {
            questionsInserted: questionsInsertedCount,
            sampleAnswersInserted: sampleAnswersInsertedCount,
            errorsEncountered: insertionErrors.length,
        });

        // // Previous logging of mapped records (can be re-enabled if needed for debug)
        // logger.info("Mapped CSV records...", { ... });

        return NextResponse.json({
            success: insertionErrors.length === 0,
            message: insertionErrors.length === 0
                ? "CSV parsed, audio processed, and data inserted successfully."
                : `Processing complete with ${insertionErrors.length} errors.`,
            totalCsvRecords: records.length,
            totalAudioFilesProcessed: parsedAudioDataList.length,
            questionsInserted: questionsInsertedCount,
            sampleAnswersInserted: sampleAnswersInsertedCount,
            transcriptionsAttempted: parsedAudioDataList.filter((a) =>
                GEMINI_API_KEY
            ).length,
            transcriptionsSucceeded: parsedAudioDataList.filter((a) =>
                !!a.transcription
            ).length,
            transcriptionsFailed: parsedAudioDataList.filter((a) =>
                !!a.transcriptionError
            ).length,
            insertionErrors: insertionErrors, // Include details of errors
        });
    } catch (error) {
        logger.error("Fatal error in POST /api/admin/techsalesjack", { error });
        return NextResponse.json({
            success: false,
            message: "Error processing request",
            error: error instanceof Error ? error.message : String(error),
        }, { status: 500 }); // Return 500 for fatal errors
    }
});
