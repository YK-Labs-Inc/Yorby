import { Logger } from "next-axiom";
import { z } from "zod";
import { generateObject, CoreMessage, streamText, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { withTracing } from "@posthog/ai";
import { posthog } from "../tracking/serverUtils";
import { createSupabaseServerClient } from "../supabase/server";

type BaseParams = {
  systemPrompt?: string;
  loggingContext?: Record<string, any>;
  enableLogging?: boolean;
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
}: GenerateObjectParams<T>): Promise<z.infer<T>> => {
  const logger = new Logger().with(loggingContext);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  try {
    const model = withTracing(google("gemini-2.0-flash"), posthog, {
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
      const model = withTracing(google("gemini-1.5-flash"), posthog, {
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
}: MutuallyExclusiveParams): Promise<string> => {
  const logger = new Logger().with(loggingContext);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  try {
    const model = withTracing(google("gemini-2.0-flash"), posthog, {
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
      const model = withTracing(google("gemini-1.5-flash"), posthog, {
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
}: MutuallyExclusiveParams): Promise<z.infer<T>> => {
  const logger = new Logger().with(loggingContext);
  try {
    const model = google("gemini-2.0-flash");
    const result = streamText({
      model,
      messages,
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
      const model = google("gemini-1.5-flash");
      const result = streamText({
        model,
        messages,
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
