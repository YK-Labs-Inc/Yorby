import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { uploadFileToGemini } from "@/utils/ai/gemini";
import { Logger } from "next-axiom";
import type { Database } from "@/utils/supabase/database.types";

type UserFile = Database["public"]["Tables"]["user_files"]["Row"];

export async function POST(req: NextRequest) {
  const logger = new Logger().with({
    function: "POST /api/apply/upload",
  });

  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    logger.info("Processing file uploads", { fileCount: files.length });

    const uploadedFiles: UserFile[] = [];
    const errors: { fileName: string; error: string }[] = [];

    // Process all files
    for (const file of files) {
      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("user-files")
          .upload(fileName, file);

        if (uploadError) {
          logger.error("Supabase upload error", {
            error: uploadError,
            fileName: file.name,
          });
          errors.push({ fileName: file.name, error: uploadError.message });
          continue;
        }

        // Upload to Gemini
        const geminiResponse = await uploadFileToGemini({
          blob: file,
          displayName: file.name,
        });

        if (!geminiResponse.file) {
          errors.push({
            fileName: file.name,
            error: "Failed to upload to Gemini",
          });
          continue;
        }

        // Create user_files entry with Gemini info
        const { data: fileRecord, error: dbError } = await supabase
          .from("user_files")
          .insert({
            user_id: user.id,
            display_name: file.name,
            file_path: uploadData.path,
            bucket_name: "user-files",
            mime_type: file.type,
            google_file_name: geminiResponse.file.name,
            google_file_uri: geminiResponse.file.uri,
            added_to_memory: false,
          })
          .select()
          .single();

        if (dbError) {
          logger.error("Database insert error", {
            error: dbError,
            fileName: file.name,
          });
          errors.push({ fileName: file.name, error: dbError.message });
          continue;
        }

        uploadedFiles.push(fileRecord);
        logger.info("File uploaded successfully", {
          fileId: fileRecord.id,
          fileName: file.name,
          geminiFileName: geminiResponse.file.name,
        });
      } catch (error) {
        logger.error("File upload error", {
          error,
          fileName: file.name,
        });
        errors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Return results
    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "All file uploads failed",
          errors,
        },
        { status: 500 }
      );
    }

    logger.info("Batch upload completed", {
      totalFiles: files.length,
      successCount: uploadedFiles.length,
      errorCount: errors.length,
    });

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error("Upload files error", { error });
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to upload files",
      },
      { status: 500 }
    );
  }
}
