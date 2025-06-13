import { headers } from "next/headers";
import { AxiomRequest, withAxiom } from "next-axiom";
import Mux from "@mux/mux-node";
import { createAdminClient } from "@/utils/supabase/server";

const mux = new Mux({
    webhookSecret: process.env.MUX_WEBHOOK_SECRET,
});

export const POST = withAxiom(async (request: AxiomRequest) => {
    const headersList = await headers();
    const body = await request.text();
    mux.webhooks.verifySignature(
        body,
        headersList,
        process.env.MUX_WEBHOOK_SECRET,
    );
    const event = mux.webhooks.unwrap(body, headersList);
    const supabase = await createAdminClient();
    let updateError = null;
    const logger = request.log.with({
        function: "muxWebhook",
        event,
    });

    switch (event.type) {
        case "video.asset.created": {
            const asset = event.data;
            const table = asset.passthrough as
                | "custom_job_question_submission_mux_metadata"
                | "mock_interview_message_mux_metadata";
            if (!table) {
                logger.error(
                    "Missing passthrough (table) in asset.created event",
                    { asset },
                );
                break;
            }
            const messageId = asset.meta?.external_id;
            if (!messageId) {
                logger.error(
                    "Missing external_id (messageId) in asset.created event",
                    { asset },
                );
                break;
            }
            // Fetch current row for idempotency check
            const { data: row, error: fetchError } = await supabase
                .from(table)
                .select("status")
                .eq("id", messageId)
                .maybeSingle();
            if (fetchError) {
                logger.error("Failed to fetch metadata row", {
                    error: fetchError,
                });
                break;
            }
            if (row?.status !== "ready") {
                const { error } = await supabase
                    .from(table)
                    .update({
                        asset_id: asset.id,
                        status: "preparing",
                    })
                    .eq("id", messageId);
                if (error) updateError = error;
            }
            break;
        }
        case "video.asset.ready": {
            const asset = event.data;
            const table = asset.passthrough as
                | "custom_job_question_submission_mux_metadata"
                | "mock_interview_message_mux_metadata";
            if (!table) {
                logger.error(
                    "Missing passthrough (table) in asset.ready event",
                    { asset },
                );
                break;
            }
            const messageId = asset.meta?.external_id;
            if (!messageId) {
                logger.error(
                    "Missing external_id (messageId) in asset.ready event",
                    { asset },
                );
                break;
            }
            const playbackId = asset.playback_ids?.[0]?.id || null;
            const { error } = await supabase
                .from(table)
                .update({
                    asset_id: asset.id,
                    playback_id: playbackId,
                    status: "ready",
                })
                .eq("id", messageId);
            if (error) updateError = error;
            break;
        }
        case "video.asset.errored": {
            const asset = event.data;
            const table = asset.passthrough as
                | "custom_job_question_submission_mux_metadata"
                | "mock_interview_message_mux_metadata";
            if (!table) {
                logger.error(
                    "Missing passthrough (table) in asset.errored event",
                    { asset },
                );
                break;
            }
            const messageId = asset.meta?.external_id;
            if (!messageId) {
                logger.error(
                    "Missing external_id (messageId) in asset.errored event",
                    { asset },
                );
                break;
            }
            const { error } = await supabase
                .from(table)
                .update({
                    asset_id: asset.id,
                    status: "errored",
                })
                .eq("id", messageId);
            if (error) updateError = error;
            break;
        }
        default:
            logger.info("Unhandled Mux event", {
                type: event.type,
                data: event.data,
            });
            break;
    }

    if (updateError) {
        logger.error("Failed to update mock_interview_message_mux_metadata", {
            error: updateError.message,
        });
        return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({ message: "ok" });
});
