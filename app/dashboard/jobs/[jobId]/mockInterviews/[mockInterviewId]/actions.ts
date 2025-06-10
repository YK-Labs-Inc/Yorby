"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import Mux from "@mux/mux-node";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export const generateMuxUploadUrl = async (messageId: string) => {
    const mux = new Mux();
    const origin = (await headers()).get("origin");
    const t = await getTranslations("errors");
    const logger = new Logger().with({
        function: "generateMuxUploadUrl",
        messageId,
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
                passthrough: messageId,
            },
        });
        const { url, id } = resp;
        await writeMuxMetadataEntry(messageId, id);
        logger.info("Mux upload URL generated", { url, id });
        await logger.flush();
        return { uploadUrl: url };
    } catch (error) {
        logger.error("Error generating Mux upload URL", { error });
        await logger.flush();
        return { error: t("pleaseTryAgain") };
    }
};

const writeMuxMetadataEntry = async (messageId: string, uploadId: string) => {
    const supabase = await createSupabaseServerClient();
    const logger = new Logger().with({
        function: "writeMuxMetadataEntry",
        messageId,
        uploadId,
    });
    const { error } = await supabase
        .from("mock_interview_message_mux_metadata")
        .insert({
            id: messageId,
            upload_id: uploadId,
            status: "preparing",
        });
    if (error) {
        logger.error("Error writing Mux metadata entry", { error });
        await logger.flush();
        throw error;
    }
    logger.info("Mux metadata entry written", { messageId, uploadId });
    await logger.flush();
};
