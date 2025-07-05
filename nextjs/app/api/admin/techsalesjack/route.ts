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
        logger.info(
            "(TranscriptionHelper) Transcribing audio file with speaker diarization",
            {
                fileName,
                mimeType,
            },
        );

        const transcriptionResultText = await generateTextWithFallback({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text:
                                `Please transcribe the following audio with speaker diarization and format the output in markdown. 

Requirements:
1. Identify different speakers and label them as **Speaker 1**, **Speaker 2**, etc.
2. Format each speaker's contribution with their label as a markdown heading
3. Maintain proper punctuation, paragraph breaks, and natural speech flow
4. If there are pauses or interruptions, indicate them appropriately
5. Use markdown formatting for emphasis, lists, or other structural elements as appropriate

Format example:
## Speaker 1
This is what the first speaker says...

## Speaker 2  
This is the response from the second speaker...

## Speaker 1
Continuation from speaker 1...

If you are unable to provide a transcription, please return "Unable to transcribe audio. Please try again.".`,
                        },
                        {
                            type: "file",
                            mimeType: mimeType,
                            data: arrayBuffer,
                        },
                    ],
                },
            ],
            systemPrompt:
                "You are an expert audio transcriptionist with speaker diarization capabilities. Focus on accuracy, proper speaker identification, and clear markdown formatting.",
            loggingContext: {
                fileName,
                source:
                    "admin/techsalesjack/transcribe_helper_with_diarization",
                mimeType,
            },
        });
        logger.info(
            "(TranscriptionHelper) Speaker diarization transcription successful",
            {
                fileName,
                transcriptionLength: transcriptionResultText?.length,
            },
        );
        return { transcription: transcriptionResultText };
    } catch (transcriptionError: any) {
        logger.error(
            "(TranscriptionHelper) Speaker diarization transcription failed",
            {
                fileName,
                error: transcriptionError.message,
            },
        );
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
        const targetCustomJobId = "aa51353e-600a-465f-8b1f-29ea58062e7e";
        let questionsInsertedCount = 0;
        let sampleAnswersInsertedCount = 0;
        let audioFilesUploadedCount = 0;
        const insertionErrors: { questionIndex: number; error: any }[] = [];

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

                // 4. Find audio files for this question and upload them to storage
                const relevantAudioFiles = parsedAudioDataList.filter((audio) =>
                    audio.questionNumber === currentQuestionNumberInFile &&
                    audio.transcription &&
                    audio.transcription.trim() !== "" &&
                    audio.transcription !==
                        "Unable to transcribe audio. Please try again."
                );

                const transcribedAnswersWithStorage:
                    CustomJobQuestionSampleAnswerInsert[] = [];

                for (const audioFile of relevantAudioFiles) {
                    try {
                        // Generate timestamp-based filename
                        const timestamp = Date.now();
                        const fileExtension = path.extname(audioFile.fileName);
                        const timestampFileName =
                            `${timestamp}${fileExtension}`;

                        // Define storage path
                        const storagePath =
                            `${userId}/programs/${targetCustomJobId}/questions/${newQuestionId}/sample-answer/${timestampFileName}`;

                        logger.info("Uploading audio file to storage", {
                            originalFileName: audioFile.fileName,
                            storagePath,
                            questionId: newQuestionId,
                        });

                        // Upload to Supabase storage
                        const { error: uploadError } = await supabase.storage
                            .from("coach_files")
                            .upload(storagePath, audioFile.buffer, {
                                contentType: audioFile.fileName.endsWith(".mp4")
                                    ? "audio/mp4"
                                    : "audio/m4a",
                                upsert: false, // Don't overwrite if exists
                            });

                        if (uploadError) {
                            logger.error("Error uploading audio file", {
                                questionIndex: i,
                                questionId: newQuestionId,
                                fileName: audioFile.fileName,
                                storagePath,
                                error: uploadError,
                            });
                            insertionErrors.push({
                                questionIndex: i,
                                error:
                                    `Audio upload failed for ${audioFile.fileName}: ${uploadError.message}`,
                            });
                            continue; // Skip this audio file but continue with others
                        }

                        logger.info("Successfully uploaded audio file", {
                            questionIndex: i,
                            questionId: newQuestionId,
                            fileName: audioFile.fileName,
                            storagePath,
                        });

                        audioFilesUploadedCount++;

                        // Add to transcribed answers with storage info
                        transcribedAnswersWithStorage.push({
                            question_id: newQuestionId,
                            answer: audioFile.transcription!,
                            bucket: "coach_files",
                            file_path: storagePath,
                        });
                    } catch (uploadLoopError) {
                        logger.error("Unhandled error during audio upload", {
                            questionIndex: i,
                            questionId: newQuestionId,
                            fileName: audioFile.fileName,
                            error: uploadLoopError,
                        });
                        insertionErrors.push({
                            questionIndex: i,
                            error:
                                `Audio upload error for ${audioFile.fileName}: ${uploadLoopError}`,
                        });
                    }
                }

                // 5. Insert sample answers with storage references
                if (transcribedAnswersWithStorage.length > 0) {
                    logger.info(
                        `Inserting ${transcribedAnswersWithStorage.length} sample answers with storage references for question ${newQuestionId}`,
                        { questionIndex: i },
                    );

                    const { error: answerError } = await supabase
                        .from("custom_job_question_sample_answers")
                        .insert(transcribedAnswersWithStorage);

                    if (answerError) {
                        logger.error("Error inserting sample answers", {
                            questionIndex: i,
                            questionId: newQuestionId,
                            numberOfAnswers:
                                transcribedAnswersWithStorage.length,
                            error: answerError,
                        });
                        insertionErrors.push({
                            questionIndex: i,
                            error:
                                `Sample answer insert failed: ${answerError.message}`,
                        });
                    } else {
                        sampleAnswersInsertedCount +=
                            transcribedAnswersWithStorage.length;
                        logger.info(
                            `Successfully inserted ${transcribedAnswersWithStorage.length} sample answers with storage references`,
                            { questionIndex: i, questionId: newQuestionId },
                        );
                    }
                } else {
                    logger.warn(
                        "No valid transcriptions with successful uploads found for question",
                        {
                            questionIndex: i,
                            questionId: newQuestionId,
                        },
                    );
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
            audioFilesUploaded: audioFilesUploadedCount,
            errorsEncountered: insertionErrors.length,
        });

        // // Previous logging of mapped records (can be re-enabled if needed for debug)
        // logger.info("Mapped CSV records...", { ... });

        return NextResponse.json({
            success: insertionErrors.length === 0,
            message: insertionErrors.length === 0
                ? "CSV parsed, audio processed, uploaded to storage, and data inserted successfully."
                : `Processing complete with ${insertionErrors.length} errors.`,
            totalCsvRecords: records.length,
            totalAudioFilesProcessed: parsedAudioDataList.length,
            questionsInserted: questionsInsertedCount,
            sampleAnswersInserted: sampleAnswersInsertedCount,
            audioFilesUploaded: audioFilesUploadedCount,
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
