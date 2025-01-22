import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { UploadResponse } from "@/utils/types";
import { AxiomRequest, withAxiom } from "next-axiom";

// Initialize Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
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

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    let transcription: string;

    if (audioFile.size < MAX_INLINE_SIZE) {
      logger.info("Processing audio in line");
      const bytes = await audioFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await model.generateContent([
        {
          text: "Please transcribe the following audio accurately. Maintain proper punctuation and paragraph breaks.",
        },
        {
          inlineData: {
            mimeType: audioFile.type,
            data: buffer.toString("base64"),
          },
        },
      ]);

      transcription = result.response.text();
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
      const result = await model.generateContent([
        {
          text: "Please transcribe the following audio accurately. Maintain proper punctuation and paragraph breaks.",
        },
        {
          fileData: {
            fileUri: geminiUploadResponse.file.uri,
            mimeType: geminiUploadResponse.file.mimeType,
          },
        },
      ]);

      transcription = result.response.text();
      logger = logger.with({ transcription });
      // Clean up - delete the uploaded file from Gemini
      await fileManager.deleteFile(geminiUploadResponse.file.name);
    }

    logger.info("Transcription complete");
    return NextResponse.json({ transcription });
  } catch (error: any) {
    logger.error("Transcription error:", { error: error.message });
    return NextResponse.error();
  }
});
