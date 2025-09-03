"use server";

import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Calendar } from "lucide-react";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { Logger } from "next-axiom";
import ApplyButton from "./ApplyButton";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    companyId: string;
    jobId: string;
  }>;
}): Promise<Metadata> {
  const { companyId, jobId } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch job data for metadata
  const { data: job } = await supabase
    .from("custom_jobs")
    .select("job_title")
    .eq("id", jobId)
    .eq("company_id", companyId)
    .single();

  // Fetch company data for metadata
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .single();

  const jobTitle = job?.job_title || "Join Our Team";
  const companyName = company?.name || "Company";
  const title = `${jobTitle} - ${companyName}`;
  const description = `Apply for ${jobTitle} role at ${companyName}. Start your application process today.`;

  const ogImageUrl = new URL(
    "/api/og/job",
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  );
  ogImageUrl.searchParams.set("title", jobTitle);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: `${jobTitle} at ${companyName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl.toString()],
    },
  };
}

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-lg font-medium text-gray-700">{company.name}</h1>
        </div>
      </div>

      {/* Hero Section with Job Title */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="max-w-3xl">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              {job.job_title}
            </h2>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5" />
                {t("jobPage.postedDate", {
                  date: new Date(job.created_at).toLocaleDateString(),
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Job Description - Main Column */}
          <div className="flex-1 max-w-3xl">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {job.job_description && (
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                    {t("jobPage.jobDescription.title")}
                  </h3>
                  <div className="text-gray-700 leading-relaxed">
                    <RichTextDisplay
                      content={job.job_description}
                      prose="prose"
                      className="max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Apply Section - Sidebar (Desktop) */}
          <div className="hidden lg:block w-80">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("jobPage.applySection.readyToApply")}
                </h3>
                <ApplyButton companyId={companyId} jobId={jobId} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Apply Button - Fixed at Bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-20">
        <ApplyButton companyId={companyId} jobId={jobId} />
      </div>
    </div>
  );
}
