import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { uploadFileToGemini } from "@/utils/ai/gemini";
import { AxiomRequest, withAxiom } from "next-axiom";

export const POST = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    method: request.method,
    path: "/api/job-knowledge-base/upload",
  });

  try {
    const supabase = await createSupabaseServerClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const programId = formData.get("programId") as string;
    const coachId = formData.get("coachId") as string;
    const files = formData.getAll("files") as File[];

    if (!programId || !coachId || files.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, {
        status: 400,
      });
    }

    // Verify coach owns the program
    const { data: program, error: programError } = await supabase
      .from("custom_jobs")
      .select("id")
      .eq("id", programId)
      .eq("coach_id", coachId)
      .single();

    if (programError || !program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Upload files to Gemini
    const uploadPromises = files.map(async (file) => {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const uploadResponse = await uploadFileToGemini({
        blob,
        displayName: file.name,
      });
      return {
        file,
        uploadResponse,
      };
    });

    const uploadResults = await Promise.all(uploadPromises);

    // Save file records to database
    const fileRecords = uploadResults.map(({ file, uploadResponse }) => ({
      custom_job_id: programId,
      coach_id: coachId,
      display_name: file.name,
      file_path: `${user.id}/${programId}/${uploadResponse.file.name}`,
      bucket_name: "custom-job-knowledge-base-files",
      mime_type: uploadResponse.file.mimeType,
      google_file_name: uploadResponse.file.name,
      google_file_uri: uploadResponse.file.uri,
    }));

    const { data: savedFiles, error: saveError } = await supabase
      .from("custom_job_knowledge_base_files")
      .insert(fileRecords)
      .select();

    if (saveError) {
      logger.error("Error saving file records", {
        error: saveError,
        programId,
      });
      return NextResponse.json({ error: "Failed to save files" }, {
        status: 500,
      });
    }

    logger.info("Files uploaded successfully", {
      programId,
      coachId,
      fileCount: savedFiles.length,
    });

    return NextResponse.json({ files: savedFiles });
  } catch (error) {
    logger.error("Error in file upload", { error });
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }
});
