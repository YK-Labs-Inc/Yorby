import { createSupabaseServerClient } from "@/utils/supabase/server";
import { FileUploadComponent } from "./FileUploadComponent";
import { H1 } from "@/components/typography";
import { FormMessage, Message } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const fetchJob = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

const fetchCustomJobFiles = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_job_files")
    .select("*")
    .eq("custom_job_id", jobId);

  if (error) {
    throw error;
  }

  return data;
};

export default async function FilesPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const jobId = (await params).jobId;
  const job = await fetchJob(jobId);
  const existingFiles = await fetchCustomJobFiles(jobId);

  const successMessage = (await searchParams)?.success as string | undefined;
  const errorMessage = (await searchParams)?.error as string | undefined;
  const message = (await searchParams)?.message as string | undefined;

  let formMessage: Message | undefined;
  if (successMessage) {
    formMessage = { success: successMessage };
  } else if (errorMessage) {
    formMessage = { error: errorMessage };
  } else if (message) {
    formMessage = { message: message };
  }

  return (
    <div className="w-full flex flex-col justify-center items-center p-8 gap-6">
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/jobs/${jobId}`}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <H1>
          {job.job_title
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}{" "}
          Documents
        </H1>
        {formMessage && <FormMessage message={formMessage} />}
      </div>
      <FileUploadComponent jobId={jobId} existingFiles={existingFiles} />
    </div>
  );
}
