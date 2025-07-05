import { Tables } from "@/utils/supabase/database.types";
import {
  createSupabaseServerClient,
  downloadFile,
} from "@/utils/supabase/server";
import { UploadResponse } from "@/utils/types";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { uploadFileToGemini } from "@/utils/ai/gemini";

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

export const getAllFiles = async (fileIds: string[]) => {
  const userFiles = await fetchUserFiles(fileIds);
  const fileStatuses = await Promise.all(userFiles.map(checkFileExists));
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

const fetchUserFiles = async (fileIds: string[]) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_files")
    .select("*")
    .in("id", fileIds);
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const checkFileExists = async (file: Tables<"user_files">) => {
  try {
    const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);
    await fileManager.getFile(file.google_file_name);
    return { file, status: true };
  } catch {
    return { file, status: false };
  }
};

const processMissingFile = async ({ file }: { file: Tables<"user_files"> }) => {
  const { display_name, file_path } = file;
  const data = await downloadFile({
    filePath: file_path,
    bucket: "user-files",
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
    .from("user_files")
    .update({
      google_file_uri: uploadResponse.file.uri,
      google_file_name: uploadResponse.file.name,
      mime_type: uploadResponse.file.mimeType,
    })
    .eq("id", fileId);
  if (error) {
    throw new Error(error.message);
  }
};
