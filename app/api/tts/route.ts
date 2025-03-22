import { AxiomRequest, withAxiom } from "next-axiom";
import { generateStreamingTTS } from "@/utils/ai/gemini";

// We'll use alloy by default as it's a good balance of quality and speed
const DEFAULT_VOICE = "alloy";
const DEFAULT_MODEL = "gpt-4o-mini-tts";

export const POST = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    method: request.method,
    path: "/api/tts",
  });

  try {
    const {
      text,
      voice = DEFAULT_VOICE,
      model = DEFAULT_MODEL,
    } = await request.json();

    if (!text) {
      logger.error("Text is required");
      await logger.flush();
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
      });
    }

    logger.info("Starting text to speech", { voice, model });

    // Get the audio buffer from OpenAI
    const response = await generateStreamingTTS({
      text,
      voice,
      model,
    });
    const audioData = await response.arrayBuffer();

    // Create headers for streaming audio
    const headers = new Headers();
    headers.set("Content-Type", "audio/mpeg");
    headers.set("Transfer-Encoding", "chunked");
    logger.info("Text to speech complete");
    await logger.flush();

    // Return audio response
    return new Response(audioData, {
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
