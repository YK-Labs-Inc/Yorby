import { NextResponse } from "next/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { uploadFileToGemini } from "@/app/[locale]/landing2/actions";
import { UploadResponse } from "@/utils/types";

export const POST = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    function: "/interview-copilot-demo/upload",
  });
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      logger.error("No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      logger.error("Only PDF files are allowed");
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (4MB = 4 * 1024 * 1024 bytes)
    if (file.size > 4 * 1024 * 1024) {
      logger.error("File size must be less than 4MB");
      return NextResponse.json(
        { error: "File size must be less than 4MB" },
        { status: 400 }
      );
    }
    const supabase = await createSupabaseServerClient();
    const filePath = `${crypto.randomUUID()}.pdf`;

    const [supabaseUpload, geminiUpload] = await Promise.all([
      supabase.storage
        .from("interview_copilot_demo_files")
        .upload(filePath, file),
      uploadFileToGemini({
        blob: file,
        displayName: filePath,
      }),
    ]);

    if (supabaseUpload.error) {
      logger.error("Failed to upload file to Supabase", {
        error: supabaseUpload.error,
      });
      return NextResponse.json(
        { error: supabaseUpload.error.message },
        { status: 500 }
      );
    }
    await writeUploadResponseToDatabase(filePath, geminiUpload);
    return NextResponse.json({ uploadResponse: geminiUpload });
  } catch (error) {
    logger.error("Failed to upload file", { error });
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
});

const writeUploadResponseToDatabase = async (
  filePath: string,
  uploadResponse: UploadResponse
) => {
  const supabase = await createSupabaseServerClient();
  await supabase.from("interview_copilot_demo_files").insert({
    file_path: filePath,
    google_file_mime_type: uploadResponse.file.mimeType,
    google_file_name: uploadResponse.file.name,
  });
};
