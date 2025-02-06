"use server";
import { uploadFileToGemini } from "@/app/[locale]/landing2/actions";
import { Tables } from "@/utils/supabase/database.types";
import {
  createSupabaseServerClient,
  downloadFile,
} from "@/utils/supabase/server";
import { UploadResponse } from "@/utils/types";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/dist/server/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Initialize both models
const answerModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        answer: { type: SchemaType.STRING },
      },
      required: ["answer"],
    },
  },
});

export const generateCopilotAnswer = async (data: FormData) => {
  const interviewCopilotId = data.get("copilotId") as string;
  const interviewCopilot = await fetchInterviewCopilot(interviewCopilotId);
};

const fetchInterviewCopilot = async (interviewCopilotId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_copilots")
    .select("*, interview_copilot_files(*)")
    .eq("id", interviewCopilotId)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const startInterviewCopilot = async (prevState: any, data: FormData) => {
  const interviewCopilotId = data.get("interviewCopilotId") as string;
  const logger = new Logger().with({
    function: "startInterviewCopilot",
    interviewCopilotId,
  });
  try {
    logger.info("Starting interview copilot");
    await getAllInterviewCopilotFiles(interviewCopilotId);
    logger.info("Interview copilot started");
    await logger.flush();
    return { success: true };
  } catch (error) {
    logger.error("Error starting interview copilot", { error });
    await logger.flush();
    const t = await getTranslations("");
    return { error: t("errors.pleaseTryAgain") };
  }
};

const getAllInterviewCopilotFiles = async (interviewCopilotId: string) => {
  const interviewCopilot = await fetchInterviewCopilot(interviewCopilotId);
  const fileStatuses = await Promise.all(
    interviewCopilot.interview_copilot_files.map(checkFileExists)
  );
  return await Promise.all(
    fileStatuses.map(async ({ file, status }) => {
      if (!status) {
        const uploadResponse = await processMissingFile({ file });
        return {
          fileData: {
            fileUri: uploadResponse.file.uri,
            mimeType: uploadResponse.file.mimeType,
          },
        };
      }
      return {
        fileData: {
          fileUri: file.google_file_uri,
          mimeType: file.mime_type,
        },
      };
    })
  );
};

const checkFileExists = async (file: Tables<"interview_copilot_files">) => {
  try {
    const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);
    await fileManager.getFile(file.google_file_name);
    return { file, status: true };
  } catch {
    return { file, status: false };
  }
};

const processMissingFile = async ({
  file,
}: {
  file: Tables<"interview_copilot_files">;
}) => {
  const { file_path } = file;
  const display_name = file_path.split("/").pop()!;
  const data = await downloadFile({
    filePath: file_path,
    bucket: "interview_copilot_files",
  });
  const uploadResponse = await uploadFileToGemini({
    blob: data,
    displayName: display_name,
  });
  await updateFileInDatabase({
    uploadResponse,
    fileId: file.id,
  });
  return uploadResponse;
};

const updateFileInDatabase = async ({
  uploadResponse,
  fileId,
}: {
  uploadResponse: UploadResponse;
  fileId: string;
}) => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("interview_copilot_files")
    .update({
      google_file_uri: uploadResponse.file.uri,
      google_file_name: uploadResponse.file.name,
    })
    .eq("id", fileId);
  if (error) {
    throw error;
  }
};
