"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import Mux from "@mux/mux-node";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { GoogleGenAI } from "@google/genai";

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
                | "custom_job_question_submission_mux_metadata",
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

export const getGeminiEphemeralToken = async () => {
    const logger = new Logger().with({
        function: "getGeminiEphemeralToken",
    });
    const t = await getTranslations("errors");
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
        logger.error(
            "Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable",
        );
        await logger.flush();
        return { error: t("pleaseTryAgain") };
    }

    try {
        const client = new GoogleGenAI({ apiKey });

        // Token expires in 30 minutes
        const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        const token = await client.authTokens.create({
            config: {
                uses: 1, // Single use token
                expireTime,
                newSessionExpireTime: new Date(Date.now() + (1 * 60 * 1000))
                    .toISOString(), // 1 minute for new session
                httpOptions: { apiVersion: "v1alpha" },
            },
        });

        logger.info("Gemini ephemeral token created successfully");
        await logger.flush();

        return {
            token: token.name?.split("/")[1],
        };
    } catch (error) {
        logger.error("Failed to create Gemini ephemeral token", {
            error: error instanceof Error ? error.message : "Unknown error",
        });
        await logger.flush();
        return { error: t("pleaseTryAgain") };
    }
};
