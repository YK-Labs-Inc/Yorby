"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import Mux from "@mux/mux-node";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

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
