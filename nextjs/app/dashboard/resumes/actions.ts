"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { UploadResponse } from "@/utils/types";

export async function uploadUserFile(
  file: File,
  userId: string,
  addedToMemory: boolean = false,
  pathToRevalidate?: string
) {
  const supabase = await createSupabaseServerClient();

  // Upload to Supabase storage
  const fileName = `${new Date().getTime()}.${file.type.split("/")[1]}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("user-files")
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  // Upload to Gemini
  const blob = new Blob([file], { type: file.type });
  const formData = new FormData();
  const metadata = {
    file: { mimeType: file.type, displayName: fileName },
  };
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  formData.append("file", blob);

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=multipart&key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
    { method: "post", body: formData }
  );

  if (!geminiResponse.ok) {
    // If Gemini upload fails, clean up the Supabase file
    await supabase.storage.from("user-files").remove([filePath]);
    throw new Error(`Failed to upload to Gemini: ${geminiResponse.statusText}`);
  }

  const geminiUploadResponse = (await geminiResponse.json()) as UploadResponse;

  // Insert into user_files table with Gemini information
  const { error: dbError } = await supabase.from("user_files").insert({
    user_id: userId,
    file_path: filePath,
    bucket_name: "user-files",
    mime_type: file.type,
    google_file_name: geminiUploadResponse.file.name,
    google_file_uri: geminiUploadResponse.file.uri,
    display_name: file.name,
    added_to_memory: addedToMemory,
  });

  if (dbError) {
    // If DB insert fails, clean up both uploaded files
    await supabase.storage.from("user-files").remove([filePath]);
    // Note: Gemini files are automatically cleaned up after their expiration time
    throw dbError;
  }

  if (pathToRevalidate) {
    revalidatePath(pathToRevalidate);
  }
}
