import { NextResponse } from "next/server";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { UploadResponse } from "@/utils/types";
import { AxiomRequest, withAxiom } from "next-axiom";
import { trackServerEvent } from "@/utils/tracking/serverUtils";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { generateTextWithFallback } from "@/utils/ai/gemini";

// Initialize Gemini
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);

const MAX_INLINE_SIZE = 15 * 1024 * 1024; // 15MB in bytes

export const POST = withAxiom(async (request: AxiomRequest) => {
  let logger = request.log.with({
    method: request.method,
    path: "/api/transcribe",
  });
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const source = formData.get("source") as string;
    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    let transcription: string;

    if (audioFile.size < MAX_INLINE_SIZE) {
      logger.info("Processing audio in line");
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
                mimeType: audioFile.type,
                data: await audioFile.arrayBuffer(),
              },
            ],
          },
        ],
        systemPrompt: "",
        loggingContext: {
          audioFile,
          source,
        },
      });
      transcription = result;
      logger = logger.with({ transcription });
    } else {
      logger.info("Processing audio in file upload");
      const blob = new Blob([audioFile], { type: audioFile.type });
      const formData = new FormData();
      const metadata = {
        file: { mimeType: audioFile.type, displayName: audioFile.name },
      };
      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      formData.append("file", blob);
      const res2 = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=multipart&key=${GEMINI_API_KEY}`,
        { method: "post", body: formData }
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
          audioFile,
          source,
        },
      });

      transcription = result;
      logger = logger.with({ transcription });
      // Clean up - delete the uploaded file from Gemini
      await fileManager.deleteFile(geminiUploadResponse.file.name);
    }

    logger.info("Transcription complete");

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
