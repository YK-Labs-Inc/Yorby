import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObjectWithFallback } from "@/utils/ai/gemini";
import { AxiomRequest, withAxiom } from "next-axiom";

const textTransformationSchema = z.object({
  transformedText: z
    .string()
    .describe("The input text rewritten in the specified speaking style"),
});

export const POST = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    method: request.method,
    path: "/api/transform-text",
  });

  try {
    const { text, speakingStyle } = (await request.json()) as {
      text: string;
      speakingStyle: string;
    };

    if (!text || !speakingStyle) {
      return new Response(
        JSON.stringify({ error: "Text and speaking style are required" }),
        { status: 400 }
      );
    }

    logger.info("Starting text transformation", { speakingStyle });

    const result = await generateObjectWithFallback({
      prompt: `Rewrite the following text in a ${speakingStyle} speaking style, maintaining the same meaning but adjusting the tone and word choice to match the style: "${text}"`,
      schema: textTransformationSchema,
      loggingContext: { speakingStyle },
    });

    logger.info("Text transformation complete");

    return NextResponse.json({ transformedText: result.transformedText });
  } catch (error: any) {
    logger.error("Text transformation error:", { error: error.message });
    return new Response(JSON.stringify({ error: "Failed to transform text" }), {
      status: 500,
    });
  }
});
