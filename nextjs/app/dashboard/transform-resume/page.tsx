import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TransformResumeClient from "./components/TransformResumeClient";
import { Logger } from "next-axiom";
import { trackServerEvent } from "@/utils/tracking/serverUtils";

const fetchFiles = async (userId: string) => {
  const logger = new Logger().with({ function: "fetchFiles", userId });
  const supabase = await createSupabaseServerClient();
  const { data: userFiles, error: filesError } = await supabase
    .from("user_files")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filesError) {
    logger.error("Error fetching user files:", filesError);
    return [];
  }

  // Generate signed URLs for each file
  const filesWithUrls = await Promise.all(
    userFiles?.map(async (file) => {
      const { data: signedUrl } = await supabase.storage
        .from(file.bucket_name)
        .createSignedUrl(file.file_path, 3600); // 1 hour expiry

      return {
        ...file,
        signedUrl: signedUrl?.signedUrl,
      };
    }) || []
  );

  return filesWithUrls;
};

const fetchResumes = async (userId: string) => {
  const logger = new Logger().with({ function: "fetchResumes", userId });
  const supabase = await createSupabaseServerClient();
  // Fetch resumes
  const { data: resumes, error: resumesError } = await supabase
    .from("resumes")
    .select(
      `*, 
        resume_sections(
          *, 
          resume_list_items(*), 
          resume_detail_items(
            *,
            resume_item_descriptions(*))
        )`
    )
    .order("created_at", { ascending: false })
    .eq("user_id", userId);

  if (resumesError) {
    logger.error("Error fetching resumes:", resumesError);
    return [];
  }

  return resumes;
};

export default async function TransformResumePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  void trackServerEvent({
    userId: user.id,
    email: user.email,
    eventName: "transform-resume-page-viewed",
  });

  const userFiles = await fetchFiles(user.id);
  const resumes = await fetchResumes(user.id);

  return (
    <TransformResumeClient
      userFiles={userFiles || []}
      resumes={resumes || []}
    />
  );
}
