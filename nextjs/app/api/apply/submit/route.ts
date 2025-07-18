import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { fetchFilesFromGemini, FileEntry } from "@/utils/ai/gemini";

export async function POST(req: NextRequest) {
  const logger = new Logger().with({
    function: "submitApplication",
    endpoint: "/api/apply/submit",
  });

  try {
    const { companyId, jobId, selectedFileIds } = await req.json();

    if (
      !companyId ||
      !jobId ||
      !selectedFileIds ||
      selectedFileIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    logger.info("Processing application submission", {
      companyId,
      jobId,
      fileCount: selectedFileIds.length,
    });

    const supabase = await createSupabaseServerClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      logger.error("User not authenticated", { error: userError });
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Fetch the files to check if they need Gemini upload
    const { data: userFiles, error: filesError } = await supabase
      .from("user_files")
      .select("*")
      .in("id", selectedFileIds);

    if (filesError || !userFiles) {
      logger.error("Failed to fetch user files", { error: filesError });
      return NextResponse.json(
        { error: "Failed to fetch application files" },
        { status: 500 }
      );
    }

    // Convert user files to FileEntry format and upload to Gemini if needed
    const fileEntries: FileEntry[] = userFiles.map((file) => ({
      id: file.id,
      supabaseBucketName: file.bucket_name,
      supabaseFilePath: file.file_path,
      supabaseTableName: "user_files",
      googleFileUri: file.google_file_uri,
      googleFileName: file.google_file_name,
      mimeType: file.mime_type,
    }));

    try {
      const geminiFiles = await fetchFilesFromGemini({ files: fileEntries });
      logger.info("Files processed for Gemini", {
        filesCount: geminiFiles.length,
        fileIds: fileEntries.map((f) => f.id),
      });
    } catch (error) {
      logger.error("Failed to process files for Gemini", {
        error,
        fileIds: fileEntries.map((f) => f.id),
      });
      // Continue with application submission even if file upload fails
    }

    // Create candidate application
    const { data: candidate, error: candidateError } = await supabase
      .from("company_job_candidates")
      .insert({
        company_id: companyId,
        custom_job_id: jobId,
        candidate_user_id: user.id,
        candidate_email: user.email!,
        candidate_name:
          user.user_metadata.full_name || user.email!.split("@")[0],
        status: "applied",
      })
      .select()
      .single();

    if (candidateError) {
      logger.error("Failed to create candidate", { error: candidateError });
      return NextResponse.json(
        { error: "Failed to create candidate application" },
        { status: 500 }
      );
    }

    // Create candidate_application_files entries
    const selectedFileEntries = selectedFileIds.map((fileId: string) => ({
      candidate_id: candidate.id,
      file_id: fileId,
    }));

    const { error: linkFilesError } = await supabase
      .from("candidate_application_files")
      .insert(selectedFileEntries);

    if (linkFilesError) {
      logger.error("Failed to link files", { error: linkFilesError });
      return NextResponse.json(
        { error: "Failed to link application files" },
        { status: 500 }
      );
    }

    logger.info("Application submitted successfully", {
      candidateId: candidate.id,
      fileCount: selectedFileIds.length,
    });

    return NextResponse.json({
      success: true,
      candidateId: candidate.id,
    });
  } catch (error) {
    logger.error("Application submission error", { error });
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
