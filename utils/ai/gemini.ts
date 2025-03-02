import { ChatMessage } from "@/app/api/chat/route";
import {
  GoogleGenerativeAI,
  GenerativeModel,
  Part,
  GenerateContentResult,
  GenerateContentStreamResult,
  Content,
  ModelParams,
} from "@google/generative-ai";
import { Logger } from "next-axiom";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

/**
 * Creates a generative model with the specified configuration
 */
export const createGeminiModel = (
  modelParams: ModelParams
): GenerativeModel => {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  return genAI.getGenerativeModel(modelParams);
};

/**
 * Execute a generateContent function call with automatic fallback to a secondary model if the primary fails
 *
 * @param contentParts The content to send to the model
 * @param modelConfig The model configuration to use
 * @param loggingContext Additional context to include in error logs
 * @returns The processed response
 */
export const generateContentWithFallback = async ({
  contentParts,
  responseSchema,
  responseMimeType,
  loggingContext = {},
}: {
  contentParts: (string | Part)[];
  responseSchema?: any;
  responseMimeType?: string;
  loggingContext?: Record<string, any>;
}): Promise<GenerateContentResult> => {
  const logger = new Logger().with(loggingContext);
  try {
    const primaryModel = createGeminiModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseSchema,
        responseMimeType,
      },
    });
    const result = await primaryModel.generateContent(contentParts);
    logger.info("Primary model completed successfully");
    await logger.flush();
    return result;
  } catch (error: any) {
    // Log the primary model failure
    logger.error(`Primary model failed, trying fallback model now`, {
      error: error.message,
    });
    await logger.flush();

    try {
      // Create and try the fallback model
      const fallbackModel = createGeminiModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType,
          responseSchema,
        },
      });

      const result = await fallbackModel.generateContent(contentParts);
      return result;
    } catch (fallbackError: any) {
      // Log that both models failed
      logger.error("Both primary and fallback models failed", {
        error: fallbackError.message,
      });
      await logger.flush();

      // Re-throw the error
      throw fallbackError;
    }
  }
};

/**
 * Execute a generateContentStream function call with automatic fallback to a secondary model if the primary fails
 *
 * @param contentParts The content to send to the model
 * @param modelConfig The model configuration to use
 * @param loggingContext Additional context to include in error logs
 * @returns The processed response
 */
export const generateContentStreamWithFallback = async ({
  contentParts,
  responseSchema,
  responseMimeType,
  loggingContext = {},
}: {
  contentParts: (string | Part)[];
  responseSchema?: any;
  responseMimeType?: string;
  loggingContext?: Record<string, any>;
}): Promise<GenerateContentStreamResult> => {
  const logger = new Logger().with(loggingContext);
  try {
    const primaryModel = createGeminiModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseSchema,
        responseMimeType,
      },
    });
    const result = await primaryModel.generateContentStream(contentParts);
    logger.info("Primary model completed successfully");
    await logger.flush();
    return result;
  } catch (error: any) {
    // Log the primary model failure
    logger.error(`Primary model failed, trying fallback model now`, {
      error: error.message,
    });
    await logger.flush();

    try {
      // Create and try the fallback model
      const fallbackModel = createGeminiModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType,
          responseSchema,
        },
      });

      const result = await fallbackModel.generateContentStream(contentParts);
      logger.info("Primary model completed successfully");
      await logger.flush();
      return result;
    } catch (fallbackError: any) {
      // Log that both models failed
      logger.error("Both primary and fallback models failed", {
        error: fallbackError.message,
      });
      await logger.flush();

      // Re-throw the error
      throw fallbackError;
    }
  }
};

/**
 * Execute a sendMessage function call with automatic fallback to a secondary model if the primary fails
 *
 * @param contentParts The content to send to the model
 * @param modelConfig The model configuration to use
 * @param loggingContext Additional context to include in error logs
 * @returns The processed response
 */
export const sendMessageWithFallback = async ({
  contentParts,
  responseMimeType,
  responseSchema,
  loggingContext = {},
  history,
}: {
  contentParts: string | Array<string | Part>;
  history: Content[];
  responseMimeType?: string;
  responseSchema?: any;
  loggingContext?: Record<string, any>;
}): Promise<GenerateContentResult> => {
  const logger = new Logger().with(loggingContext);
  try {
    const primaryModel = createGeminiModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType,
        responseSchema,
      },
    });
    const chat = primaryModel.startChat({
      history,
    });
    const result = await chat.sendMessage(contentParts);
    return result;
  } catch (error: any) {
    logger.error(`Primary model failed, trying fallback model now`, {
      error: error.message,
    });
    await logger.flush();
    try {
      const fallbackModel = createGeminiModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType,
          responseSchema,
        },
      });
      const chat = fallbackModel.startChat({
        history,
      });
      const result = await chat.sendMessage(contentParts);
      return result;
    } catch (fallbackError: any) {
      logger.error("Both primary and fallback models failed", {
        error: fallbackError.message,
      });
      await logger.flush();
      throw fallbackError;
    }
  }
};
