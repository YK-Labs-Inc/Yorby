import { AxiomRequest, withAxiom } from "next-axiom";
import { generateStreamingTTS } from "@/utils/ai/gemini";
import { NextResponse } from "next/server";

const DEFAULT_VOICE = "alloy";

const VOICE_MAP = {
  alloy: "alloy",
  onyx: "onyx",
  lbj: process.env.SPEECHIFY_LEBRON_JAMES_VOICE_ID,
  dg: process.env.SPEECHIFY_DAVID_GOGGINS_VOICE_ID,
  cw: process.env.SPEECHIFY_CHAEWON_VOICE_ID,
};

export const POST = withAxiom(async (request: AxiomRequest) => {
  let logger = request.log.with({
    method: request.method,
    path: "/api/tts",
  });

  try {
    const { text, voiceId, provider, speakingStyle } =
      (await request.json()) as {
        text: string;
        voiceId?: "alloy" | "onyx" | "lbj" | "dg" | "cw";
        provider?: "openai" | "speechify";
        speakingStyle?: string;
      };
    logger = logger.with({
      voiceId,
      provider,
      speakingStyle,
      text,
    });

    if (!text) {
      logger.error("Missing text");
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
      });
    }

    logger.info("Starting text to speech generation");

    // Get the audio buffer from OpenAI
    const response = await generateStreamingTTS({
      text,
      voice: VOICE_MAP[voiceId || DEFAULT_VOICE]!,
      provider: provider || "openai",
      speakingStyle,
    });

    // Create headers for streaming audio
    const headers = new Headers();
    headers.set("Content-Type", "audio/mpeg");
    headers.set("Transfer-Encoding", "chunked");
    logger.info("Text to speech complete");

    // Return audio response
    return new NextResponse(response, {
      headers,
      status: 200,
    });
  } catch (error: any) {
    logger.error("Text to speech error:", { error: error.message });
    await logger.flush();
    return new Response(
      JSON.stringify({ error: "Failed to generate speech" }),
      { status: 500 }
    );
  }
});
