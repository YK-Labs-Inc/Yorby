import OpenAI from "openai";
import { AxiomRequest, withAxiom } from "next-axiom";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// We'll use alloy by default as it's a good balance of quality and speed
const DEFAULT_VOICE = "alloy";
const DEFAULT_MODEL = "tts-1";

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

    const response = await openai.audio.speech.create({
      model,
      voice,
      input: text,
      response_format: "mp3",
    });

    // Get the audio data as an ArrayBuffer
    const audioData = await response.arrayBuffer();

    // Create headers for streaming audio
    const headers = new Headers();
    headers.set("Content-Type", "audio/mpeg");
    headers.set("Transfer-Encoding", "chunked");

    logger.info("Text to speech complete");

    // Return the streaming response
    return new Response(audioData, {
      headers,
      status: 200,
    });
  } catch (error: any) {
    logger.error("Text to speech error:", { error: error.message });
    return new Response(
      JSON.stringify({ error: "Failed to generate speech" }),
      { status: 500 }
    );
  }
});
