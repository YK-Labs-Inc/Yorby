"use server";

import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { CollapsibleJobDescription } from "@/components/CollapsibleJobDescription";
import { Logger } from "next-axiom";
import ApplyButton from "./ApplyButton";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{
    companyId: string;
    jobId: string;
  }>;
}) {
  const { companyId, jobId } = await params;
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "ApplyPage",
    companyId,
    jobId,
  });
  const t = await getTranslations("apply");

  // Fetch company data
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (companyError || !company) {
    logger.error("Company not found", { companyId, error: companyError });
    notFound();
  }

  // Fetch job data
  const { data: job, error: jobError } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("company_id", companyId)
    .single();

  if (jobError || !job) {
    logger.error("Job not found", { jobId, error: jobError });
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Card>
        {/* Company Section */}
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">{company.name}</CardTitle>
        </CardHeader>

        {/* Job Details Section */}
        <CardContent className="pt-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">{job.job_title}</h2>
            <CardDescription className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {t("jobPage.postedDate", {
                date: new Date(job.created_at).toLocaleDateString(),
              })}
            </CardDescription>
          </div>

          {/* Job Description Section */}
          {job.job_description && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {t("jobPage.jobDescription.title")}
              </h3>
              <div className="prose prose-gray max-w-none">
                <CollapsibleJobDescription description={job.job_description} />
              </div>
            </div>
          )}
        </CardContent>

        {/* Apply Button Section */}
        <CardFooter className="border-t p-6">
          <ApplyButton companyId={companyId} jobId={jobId} />
        </CardFooter>
      </Card>
    </div>
  );
}
