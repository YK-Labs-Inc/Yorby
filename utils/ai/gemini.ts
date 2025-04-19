import { Logger } from "next-axiom";
import { z } from "zod";
import {
  generateObject,
  CoreMessage,
  streamText,
  generateText,
  streamObject,
} from "ai";
import { google } from "@ai-sdk/google";
import { withTracing } from "@posthog/ai";
import { posthog } from "../tracking/serverUtils";
import { createSupabaseServerClient } from "../supabase/server";
import { OpenAI } from "@posthog/ai";
import { Speechify } from "@speechify/api-sdk";
import { UploadResponse } from "../types";

export type GeminiModelName =
  | "gemini-2.5-pro-preview-03-25"
  | "gemini-2.5-flash-preview-04-17"
  | "gemini-2.0-flash";

type ModelConfig = {
  primaryModel?: GeminiModelName;
  fallbackModel?: GeminiModelName;
};

// Default model configuration
const DEFAULT_MODEL_CONFIG: ModelConfig = {
  primaryModel: "gemini-2.5-flash-preview-04-17",
  fallbackModel: "gemini-2.0-flash",
};

type BaseParams = {
  systemPrompt?: string;
  loggingContext?: Record<string, any>;
  enableLogging?: boolean;
  modelConfig?: ModelConfig;
};

type MessagesOnlyParams = BaseParams & {
  messages: CoreMessage[];
  prompt?: never;
};

type PromptOnlyParams = BaseParams & {
  messages?: never;
  prompt: string;
};

type MutuallyExclusiveParams = MessagesOnlyParams | PromptOnlyParams;

type GenerateObjectParams<T extends z.ZodType> = MutuallyExclusiveParams & {
  schema: T;
};

/**
 * Execute a generateObject function call with automatic fallback to a secondary model
 */
export const generateObjectWithFallback = async <T extends z.ZodType>({
  messages,
  prompt,
  systemPrompt,
  schema,
  loggingContext = {},
  enableLogging = true,
  modelConfig = DEFAULT_MODEL_CONFIG,
}: GenerateObjectParams<T>): Promise<z.infer<T>> => {
  const logger = new Logger().with(loggingContext);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  try {
    const model = withTracing(google(modelConfig.primaryModel!), posthog, {
      posthogDistinctId: user?.id,
      posthogProperties: loggingContext,
    });
    const result = await generateObject({
      model,
      messages: messages?.filter((message) => message.content),
      prompt,
      system: systemPrompt,
      schema,
    });
    await logger.flush();
    const jsonResponse = result.object;
    if (enableLogging) {
      logger
        .with({ jsonResponse })
        .info("Primary model completed successfully");
    }
    return jsonResponse;
  } catch (error) {
    logger.error(`Primary model failed, trying fallback model`, {
      error: error instanceof Error ? error.message : String(error),
    });
    await logger.flush();
    try {
      const model = withTracing(google(modelConfig.fallbackModel!), posthog, {
        posthogDistinctId: user?.id,
        posthogProperties: loggingContext,
      });
      const result = await generateObject({
        model,
        messages: messages?.filter((message) => message.content),
        prompt,
        system: systemPrompt,
        schema,
      });
      if (enableLogging) {
        logger.info("Fallback model completed successfully");
      }
      await logger.flush();
      const jsonResponse = result.object;
      if (enableLogging) {
        logger
          .with({ jsonResponse })
          .info("Fallback model completed successfully");
      }
      return jsonResponse;
    } catch (fallbackError) {
      logger.error("Both primary and fallback models failed", {
        error:
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError),
      });
      await logger.flush();
      throw fallbackError;
    }
  }
};

/**
 * Execute a generateText function call with automatic fallback to a secondary model
 */
export const generateTextWithFallback = async ({
  messages,
  prompt,
  systemPrompt,
  loggingContext = {},
  modelConfig = DEFAULT_MODEL_CONFIG,
}: MutuallyExclusiveParams): Promise<string> => {
  const logger = new Logger().with(loggingContext);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  try {
    const model = withTracing(google(modelConfig.primaryModel!), posthog, {
      posthogDistinctId: user?.id,
      posthogProperties: loggingContext,
    });
    const { text } = await generateText({
      model,
      messages: messages?.filter((message) => message.content),
      prompt,
      system: systemPrompt,
    });
    logger.with({ result: text }).info("Primary model completed successfully");
    await logger.flush();
    return text;
  } catch (error) {
    logger.error(`Primary model failed, trying fallback model`, {
      error: error instanceof Error ? error.message : String(error),
    });
    await logger.flush();
    try {
      const model = withTracing(google(modelConfig.fallbackModel!), posthog, {
        posthogDistinctId: user?.id,
        posthogProperties: loggingContext,
      });
      const { text } = await generateText({
        model,
        messages: messages?.filter((message) => message.content),
        prompt,
        system: systemPrompt,
      });
      logger
        .with({ result: text })
        .info("Fallback model completed successfully");
      await logger.flush();
      return text;
    } catch (fallbackError) {
      logger.error("Both primary and fallback models failed", {
        error:
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError),
      });
      await logger.flush();
      throw fallbackError;
    }
  }
};

/**
 * Execute a streaming content generation with automatic fallback
 */
export const streamTextResponseWithFallback = async <T extends z.ZodType>({
  messages,
  prompt,
  systemPrompt,
  loggingContext = {},
  modelConfig = DEFAULT_MODEL_CONFIG,
}: MutuallyExclusiveParams): Promise<z.infer<T>> => {
  const logger = new Logger().with(loggingContext);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  try {
    const model = withTracing(google(modelConfig.primaryModel!), posthog, {
      posthogDistinctId: user?.id,
      posthogProperties: loggingContext,
    });
    const result = streamText({
      model,
      messages: messages?.filter((message) => message.content),
      prompt,
      system: systemPrompt,
    });
    logger.info("Primary model completed successfully");
    await logger.flush();
    return result.textStream;
  } catch (error) {
    logger.error(`Primary model failed, trying fallback model`, {
      error: error instanceof Error ? error.message : String(error),
    });
    await logger.flush();

    try {
      const model = withTracing(google(modelConfig.fallbackModel!), posthog, {
        posthogDistinctId: user?.id,
        posthogProperties: loggingContext,
      });
      const result = streamText({
        model,
        messages: messages?.filter((message) => message.content),
        prompt,
        system: systemPrompt,
      });

      logger.info("Fallback model completed successfully");
      await logger.flush();
      return result.textStream;
    } catch (fallbackError) {
      logger.error("Both primary and fallback models failed", {
        error:
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError),
      });
      await logger.flush();
      throw fallbackError;
    }
  }
};

/**
 * Generate streaming text-to-speech audio using OpenAI's latest models
 */
export const generateStreamingTTS = async ({
  text,
  voice,
  provider,
  speakingStyle,
}: {
  text: string;
  voice: string;
  provider: "openai" | "speechify";
  speakingStyle?: string;
}) => {
  try {
    if (provider === "openai") {
      return generateOpenAITTS({ text, voice });
    } else if (provider === "speechify") {
      return generateSpeechifyTTS({ text, voice });
    }
  } catch (error: any) {
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
};

const generateOpenAITTS = async ({
  text,
  voice,
}: {
  text: string;
  voice: string;
}): Promise<ReadableStream<Uint8Array>> => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    posthog,
  });
  const response = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: voice as "alloy" | "onyx",
    input: text,
    response_format: "mp3",
  });

  if (!response.body) {
    throw new Error("Failed to generate speech: Response body is null");
  }

  return response.body;
};

const generateSpeechifyTTS = async ({
  text,
  voice,
}: {
  text: string;
  voice: string;
}) => {
  const speechify = new Speechify({
    apiKey: process.env.SPEECHIFY_API_KEY!,
  });
  return await speechify.audioStream({
    input: text,
    voiceId: voice,
    audioFormat: "mp3",
  });
};

export const streamObjectWithFallback = async <T extends z.ZodType>({
  messages,
  prompt,
  systemPrompt,
  schema,
  loggingContext = {},
  enableLogging = true,
  modelConfig = DEFAULT_MODEL_CONFIG,
}: GenerateObjectParams<T>) => {
  const logger = new Logger().with(loggingContext);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const model = withTracing(google(modelConfig.primaryModel!), posthog, {
      posthogDistinctId: user?.id,
      posthogProperties: loggingContext,
    });
    const result = streamObject({
      model,
      messages: messages?.filter((message) => message.content),
      prompt,
      system: systemPrompt,
      schema,
    });
    if (enableLogging) {
      logger.info("Primary model streaming started successfully");
    }
    await logger.flush();
    return result.partialObjectStream;
  } catch (error) {
    logger.error(`Primary model failed, trying fallback model`, {
      error: error instanceof Error ? error.message : String(error),
    });
    await logger.flush();

    try {
      const model = withTracing(google(modelConfig.fallbackModel!), posthog, {
        posthogDistinctId: user?.id,
        posthogProperties: loggingContext,
      });
      const result = streamObject({
        model,
        messages: messages?.filter((message) => message.content),
        prompt,
        system: systemPrompt,
        schema,
      });
      if (enableLogging) {
        logger.info("Fallback model streaming started successfully");
      }
      await logger.flush();
      return result.partialObjectStream;
    } catch (fallbackError) {
      logger.error("Both primary and fallback models failed", {
        error:
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError),
      });
      await logger.flush();
      throw fallbackError;
    }
  }
};

export const uploadFileToGemini = async ({
  blob,
  displayName,
}: {
  blob: Blob;
  displayName: string;
}) => {
  const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
  const formData = new FormData();
  const metadata = {
    file: { mimeType: blob.type, displayName: displayName },
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
  return geminiUploadResponse;
};
