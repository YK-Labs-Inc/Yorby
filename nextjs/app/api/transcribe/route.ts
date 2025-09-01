import { NextResponse } from "next/server";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { UploadResponse } from "@/utils/types";
import { AxiomRequest, withAxiom } from "next-axiom";
import { trackServerEvent } from "@/utils/tracking/serverUtils";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { generateTextWithFallback } from "@/utils/ai/gemini";
import { getServerUser } from "@/utils/auth/server";

// Initialize Gemini
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);

export const POST = withAxiom(async (request: AxiomRequest) => {
  let logger = request.log.with({
    method: request.method,
    path: "/api/transcribe",
  });
  try {
    const formData = await request.formData();
    const audioFileToTranscribe = formData.get(
      "audioFileToTranscribe"
    ) as File | null;
    const filePath = formData.get("filePath") as string | null;
    const source = formData.get("source") as string;
    const supabase = await createSupabaseServerClient();
    if (!audioFileToTranscribe && !filePath) {
      logger.error("No audio file or file path provided");
      return NextResponse.json(
        { error: "No audio file or file path provided" },
        { status: 400 }
      );
    }

    let transcription: string = "";

    if (audioFileToTranscribe) {
      logger.info("Processing audio in line");
      const result = await generateTextWithFallback({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please transcribe the following audio accurately. Maintain proper punctuation and paragraph breaks.
                If you are unable to provide a transcription, please return "Unable to transcribe audio. Please try again.".
                 `,
              },
              {
                type: "file",
                mimeType: audioFileToTranscribe.type,
                data: await audioFileToTranscribe.arrayBuffer(),
              },
            ],
          },
        ],
        systemPrompt: "",
        loggingContext: {
          audioFileToTranscribe,
          source,
        },
      });
      transcription = result;
      logger = logger.with({ transcription });
    } else if (filePath) {
      const { data: audioFile, error: downloadError } = await supabase.storage
        .from("temp-audio-recordings")
        .download(filePath);

      if (downloadError) {
        logger.error("Error downloading audio file:", { error: downloadError });
        return NextResponse.json(
          { error: "Failed to download audio file" },
          { status: 500 }
        );
      }

      logger.info("Processing audio in file upload");
      const blob = new Blob([audioFile], { type: audioFile.type });
      const geminiFormData = new FormData();
      const metadata = {
        file: {
          mimeType: audioFile.type,
          displayName: filePath.split("/").pop() || "audio.webm",
        },
      };
      geminiFormData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      geminiFormData.append("file", blob);
      const res2 = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=multipart&key=${GEMINI_API_KEY}`,
        { method: "post", body: geminiFormData }
      );
      const geminiUploadResponse = (await res2.json()) as UploadResponse;

      // Generate transcription
      const result = await generateTextWithFallback({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please transcribe the following audio accurately. Maintain proper punctuation and paragraph breaks.",
              },
              {
                type: "file",
                data: geminiUploadResponse.file.uri,
                mimeType: geminiUploadResponse.file.mimeType,
              },
            ],
          },
        ],
        systemPrompt: "",
        loggingContext: {
          source,
        },
      });

      transcription = result;
      logger = logger.with({ transcription });
      // Clean up - delete the uploaded file from Gemini
      await fileManager.deleteFile(geminiUploadResponse.file.name);
    }

    logger.info("Transcription complete");

    const user = await getServerUser();
    if (user?.id) {
      await trackServerEvent({
        eventName: "transcription_generated",
        userId: user.id,
        args: {
          source,
          transcription,
        },
      });
    }
    return NextResponse.json({ transcription });
  } catch (error: any) {
    logger.error("Transcription error:", { error: error.message });
    return NextResponse.error();
  }
});
