"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import Mux from "@mux/mux-node";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

interface MockInterviewData {
  mockInterview: any;
  messages: any[];
  feedback: any;
  questionFeedback: any[];
  recordingUrl: string | null;
}

interface MockInterviewDataV2 {
  mockInterview: any;
  messages: any[];
  feedback: any;
  questionFeedback: any[];
  muxMetadata: any | null;
}

export const getMockInterviewData = async (mockInterviewId: string): Promise<MockInterviewData> => {
    const logger = new Logger().with({ function: "getMockInterviewData", mockInterviewId });
    
    try {
        const supabase = await createSupabaseServerClient();

        // Fetch mock interview data
        const { data: mockInterview, error: mockInterviewError } =
            await supabase
                .from("custom_job_mock_interviews")
                .select("*")
                .eq("id", mockInterviewId)
                .single();

        if (mockInterviewError) {
            logger.error("Error fetching mock interview data", {
                mockInterviewError,
                mockInterviewId,
            });
            await logger.flush();
            throw mockInterviewError;
        }

        // Fetch messages
        const { data: messages, error: messagesError } = await supabase
            .from("mock_interview_messages")
            .select("*, mux_metadata:mock_interview_message_mux_metadata(*)")
            .eq("mock_interview_id", mockInterviewId)
            .order("created_at", { ascending: true });

        if (messagesError) {
            logger.error("Error fetching mock interview messages", {
                messagesError,
                mockInterviewId,
            });
            await logger.flush();
            throw messagesError;
        }

        // Fetch feedback
        const { data: feedback, error: feedbackError } = await supabase
            .from("custom_job_mock_interview_feedback")
            .select("*")
            .eq("mock_interview_id", mockInterviewId)
            .single();

        if (feedbackError && feedbackError.code !== "PGRST116") {
            logger.error("Error fetching mock interview feedback", {
                feedbackError,
                mockInterviewId,
            });
            await logger.flush();
            throw feedbackError;
        }

        // Fetch question feedback
        const { data: questionFeedback, error: questionFeedbackError } =
            await supabase
                .from("mock_interview_question_feedback")
                .select("*")
                .eq("mock_interview_id", mockInterviewId)
                .order("created_at", { ascending: true });

        if (questionFeedbackError) {
            logger.error("Error fetching mock interview question feedback", {
                questionFeedbackError,
                mockInterviewId,
            });
            await logger.flush();
            throw questionFeedbackError;
        }

        // Generate signed URL for the recording only if recording_file_path exists
        let signedUrl: string | null = null;
        if (mockInterview.recording_file_path) {
            const { data: urlData } = await supabase.storage
                .from("mock_interviews")
                .createSignedUrl(mockInterview.recording_file_path, 60 * 60); // 1 hour expiry
            signedUrl = urlData?.signedUrl ?? null;
        }

        const result = {
            mockInterview,
            messages: messages || [],
            feedback: feedback || null,
            questionFeedback: questionFeedback || [],
            recordingUrl: signedUrl,
        };

        logger.info("Mock interview data fetched successfully", { mockInterviewId });
        await logger.flush();
        
        return result;
    } catch (error) {
        logger.error("Failed to fetch mock interview data", { error });
        await logger.flush();
        throw error;
    }
};

export const getMockInterviewDataV2 = async (mockInterviewId: string): Promise<MockInterviewDataV2> => {
    const logger = new Logger().with({ function: "getMockInterviewDataV2", mockInterviewId });
    
    try {
        const supabase = await createSupabaseServerClient();

        // Fetch mock interview data
        const { data: mockInterview, error: mockInterviewError } =
            await supabase
                .from("custom_job_mock_interviews")
                .select("*")
                .eq("id", mockInterviewId)
                .single();

        if (mockInterviewError) {
            logger.error("Error fetching mock interview data", {
                mockInterviewError,
                mockInterviewId,
            });
            await logger.flush();
            throw mockInterviewError;
        }

        // Fetch messages
        const { data: messages, error: messagesError } = await supabase
            .from("mock_interview_messages")
            .select("*, mux_metadata:mock_interview_message_mux_metadata(*)")
            .eq("mock_interview_id", mockInterviewId)
            .order("created_at", { ascending: true });

        if (messagesError) {
            logger.error("Error fetching mock interview messages", {
                messagesError,
                mockInterviewId,
            });
            await logger.flush();
            throw messagesError;
        }

        // Fetch feedback
        const { data: feedback, error: feedbackError } = await supabase
            .from("custom_job_mock_interview_feedback")
            .select("*")
            .eq("mock_interview_id", mockInterviewId)
            .single();

        if (feedbackError && feedbackError.code !== "PGRST116") {
            logger.error("Error fetching mock interview feedback", {
                feedbackError,
                mockInterviewId,
            });
            await logger.flush();
            throw feedbackError;
        }

        // Fetch question feedback
        const { data: questionFeedback, error: questionFeedbackError } =
            await supabase
                .from("mock_interview_question_feedback")
                .select("*")
                .eq("mock_interview_id", mockInterviewId)
                .order("created_at", { ascending: true });

        if (questionFeedbackError) {
            logger.error("Error fetching mock interview question feedback", {
                questionFeedbackError,
                mockInterviewId,
            });
            await logger.flush();
            throw questionFeedbackError;
        }

        // Fetch mock interview mux metadata
        const { data: muxMetadata, error: muxMetadataError } = await supabase
            .from("mock_interview_mux_metadata")
            .select("*")
            .eq("id", mockInterviewId)
            .single();

        if (muxMetadataError && muxMetadataError.code !== "PGRST116") {
            logger.error("Error fetching mock interview mux metadata", {
                muxMetadataError,
                mockInterviewId,
            });
            await logger.flush();
            throw muxMetadataError;
        }

        const result = {
            mockInterview,
            messages: messages || [],
            feedback: feedback || null,
            questionFeedback: questionFeedback || [],
            muxMetadata: muxMetadata || null,
        };

        logger.info("Mock interview data V2 fetched successfully", { mockInterviewId });
        await logger.flush();
        
        return result;
    } catch (error) {
        logger.error("Failed to fetch mock interview data V2", { error });
        await logger.flush();
        throw error;
    }
};

export const generateMuxUploadUrl = async (
    { databaseId, table }: { databaseId: string; table: string },
) => {
    const mux = new Mux();
    const origin = (await headers()).get("origin");
    const t = await getTranslations("errors");
    const logger = new Logger().with({
        function: "generateMuxUploadUrl",
        databaseId,
    });
    if (!origin) {
        logger.error("No origin found");
        await logger.flush();
        return { error: t("pleaseTryAgain") };
    }

    try {
        const resp = await mux.video.uploads.create({
            cors_origin: origin,
            new_asset_settings: {
                playback_policy: ["public"],
                video_quality: "basic",
                passthrough: table,
                meta: {
                    external_id: databaseId,
                },
            },
        });
        const { url, id } = resp;
        await writeMuxMetadataEntry({ databaseId, uploadId: id, table });
        logger.info("Mux upload URL generated", { url, id });
        await logger.flush();
        return { uploadUrl: url };
    } catch (error: any) {
        logger.error("Error generating Mux upload URL", {
            error: error instanceof Error ? error.message : "Unknown error",
        });
        await logger.flush();
        return { error: t("pleaseTryAgain") };
    }
};

const writeMuxMetadataEntry = async (
    { databaseId, uploadId, table }: {
        databaseId: string;
        uploadId: string;
        table: string;
    },
) => {
    const supabase = await createSupabaseServerClient();
    const logger = new Logger().with({
        function: "writeMuxMetadataEntry",
        databaseId,
        uploadId,
    });
    const { error } = await supabase
        .from(
            table as
                | "mock_interview_message_mux_metadata"
                | "custom_job_question_submission_mux_metadata"
                | "course_lesson_files_mux_metadata",
        )
        .insert({
            id: databaseId,
            upload_id: uploadId,
            status: "preparing",
        });
    if (error) {
        logger.error("Error writing Mux metadata entry", {
            error: error.message,
        });
        await logger.flush();
        throw error;
    }
    logger.info("Mux metadata entry written", { databaseId, uploadId });
    await logger.flush();
};
