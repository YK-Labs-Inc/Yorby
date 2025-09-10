import { headers } from "next/headers";
import { AxiomRequest, withAxiom } from "next-axiom";
import Mux from "@mux/mux-node";
import { Asset } from "@mux/mux-node/resources/video/assets";
import { createAdminClient } from "@/utils/supabase/server";

const mux = new Mux({
  webhookSecret: process.env.MUX_WEBHOOK_SECRET,
});

type muxSupportedTables =
  | "custom_job_question_submission_mux_metadata"
  | "mock_interview_message_mux_metadata"
  | "course_lesson_files_mux_metadata"
  | "mock_interview_mux_metadata"
  | "candidate_job_interview_recordings";

async function getMessageId(asset: Asset, tableName: muxSupportedTables) {
  // Try external_id first
  const messageId = asset.meta?.external_id;
  if (messageId) {
    return messageId;
  }

  // If external_id not available, try upload_id
  if (asset.upload_id) {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from(tableName)
      .select("id")
      .eq("upload_id", asset.upload_id)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to find entry with upload_id ${asset.upload_id}: ${error.message}`
      );
    }

    if (!data) {
      throw new Error(
        `No entry found with upload_id ${asset.upload_id} in table ${tableName}`
      );
    }

    return data?.id;
  }

  throw new Error("Missing both external_id and upload_id in asset");
}

export const POST = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    function: "muxWebhook",
    endpoint: "/api/webhooks/mux",
  });

  logger.info("Mux webhook received");

  const headersList = await headers();
  const body = await request.text();

  // Log webhook signature verification
  try {
    mux.webhooks.verifySignature(
      body,
      headersList,
      process.env.MUX_WEBHOOK_SECRET
    );
    logger.info("Webhook signature verified successfully");
  } catch (error) {
    logger.error("Webhook signature verification failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      headers: Object.fromEntries(headersList.entries()),
    });
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = mux.webhooks.unwrap(body, headersList);
    // Enhanced logger with event details
    const eventLogger = logger.with({
      eventType: event.type,
      eventId: event.id,
      timestamp: event.created_at,
      event,
    });

    eventLogger.info("Processing Mux webhook event", {
      eventType: event.type,
    });

    const supabase = await createAdminClient();
    let updateError = null;

    switch (event.type) {
      case "video.asset.created": {
        const asset = event.data;
        eventLogger.info("Processing video.asset.created event", {
          assetId: asset.id,
          duration: asset.duration,
          videoQuality: asset.video_quality,
          passthrough: asset.passthrough,
          externalId: asset.meta?.external_id,
        });

        const table = asset.passthrough as muxSupportedTables;
        if (!table) {
          eventLogger.error(
            "Missing passthrough (table) in asset.created event",
            { asset }
          );
          break;
        }
        let messageId;
        try {
          messageId = await getMessageId(asset, table);
        } catch (error) {
          eventLogger.error("Missing messageId in asset.created event", {
            asset,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          break;
        }

        eventLogger.info("Upserting metadata to preparing status", {
          table,
          messageId,
          assetId: asset.id,
        });

        const { error } = await supabase
          .from(table)
          .upsert({
            id: messageId,
            asset_id: asset.id,
            upload_id: asset.upload_id,
            status: "preparing",
          });

        if (error) {
          updateError = error;
          eventLogger.error("Failed to upsert metadata to preparing", {
            error: error.message,
            table,
            messageId,
          });
        } else {
          eventLogger.info("Successfully upserted metadata to preparing", {
            table,
            messageId,
            assetId: asset.id,
          });
        }
        break;
      }
      case "video.asset.ready": {
        const asset = event.data;
        eventLogger.info("Processing video.asset.ready event", {
          assetId: asset.id,
          duration: asset.duration,
          videoQuality: asset.video_quality,
          playbackIds: asset.playback_ids,
          passthrough: asset.passthrough,
          externalId: asset.meta?.external_id,
        });

        const table = asset.passthrough as muxSupportedTables;
        if (!table) {
          eventLogger.error(
            "Missing passthrough (table) in asset.ready event",
            {
              asset,
            }
          );
          break;
        }
        let messageId;
        try {
          messageId = await getMessageId(asset, table);
        } catch (error) {
          eventLogger.error("Missing messageId in asset.ready event", {
            asset,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          break;
        }
        const playbackId = asset.playback_ids?.[0]?.id || null;

        eventLogger.info("Upserting metadata to ready status", {
          table,
          messageId,
          assetId: asset.id,
          playbackId,
        });

        const { error } = await supabase
          .from(table)
          .upsert({
            id: messageId,
            asset_id: asset.id,
            playback_id: playbackId,
            upload_id: asset.upload_id,
            status: "ready",
          });

        if (error) {
          updateError = error;
          eventLogger.error("Failed to upsert metadata to ready", {
            error: error.message,
            table,
            messageId,
            assetId: asset.id,
          });
        } else {
          eventLogger.info("Successfully upserted metadata to ready", {
            table,
            messageId,
            assetId: asset.id,
            playbackId,
          });
        }
        break;
      }
      case "video.asset.errored": {
        const asset = event.data;
        eventLogger.error("Processing video.asset.errored event", {
          assetId: asset.id,
          errors: asset.errors,
          passthrough: asset.passthrough,
          externalId: asset.meta?.external_id,
          errorMessages: asset.errors?.messages,
          errorType: asset.errors?.type,
        });

        const table = asset.passthrough as muxSupportedTables;
        if (!table) {
          eventLogger.error(
            "Missing passthrough (table) in asset.errored event",
            { asset }
          );
          break;
        }
        let messageId;
        try {
          messageId = await getMessageId(asset, table);
        } catch (error) {
          eventLogger.error("Missing messageId in asset.errored event", {
            asset,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          break;
        }

        eventLogger.info("Upserting metadata to errored status", {
          table,
          messageId,
          assetId: asset.id,
        });

        const { error } = await supabase
          .from(table)
          .upsert({
            id: messageId,
            asset_id: asset.id,
            upload_id: asset.upload_id,
            status: "errored",
          });

        if (error) {
          updateError = error;
          eventLogger.error("Failed to upsert metadata to errored", {
            error: error.message,
            table,
            messageId,
            assetId: asset.id,
          });
        } else {
          eventLogger.info("Successfully upserted metadata to errored", {
            table,
            messageId,
            assetId: asset.id,
          });
        }
        break;
      }
      default:
        eventLogger.info("Unhandled Mux event", {
          type: event.type,
          data: event.data,
        });
        break;
    }

    if (updateError) {
      eventLogger.error("Failed to update Mux metadata", {
        error: updateError.message,
        errorCode: updateError.code,
        errorDetails: updateError.details,
        eventType: event.type,
      });
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    eventLogger.info("Mux webhook processed successfully", {
      eventType: event.type,
      processingTime:
        Date.now() -
        (event.created_at ? new Date(event.created_at).getTime() : Date.now()),
    });

    return Response.json({ message: "ok" });
  } catch (error) {
    logger.error("Failed to unwrap Mux webhook event", {
      error: error instanceof Error ? error.message : "Unknown error",
      headers: Object.fromEntries(headersList.entries()),
    });
    return Response.json(
      { error: "Error processing Mux webhook" },
      { status: 500 }
    );
  }
});
