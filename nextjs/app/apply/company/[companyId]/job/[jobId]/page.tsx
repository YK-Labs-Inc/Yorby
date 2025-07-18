import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Briefcase } from "lucide-react";
import { Logger } from "next-axiom";

interface PageProps {
  params: Promise<{
    companyId: string;
    jobId: string;
  }>;
}

export default async function ApplyPage({ params }: PageProps) {
  const { companyId, jobId } = await params;
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "ApplyPage",
    companyId,
    jobId,
  });

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch company info
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (companyError || !company) {
    logger.error("Company not found", { companyId });
    redirect("/");
  }

  // Fetch job info
  const { data: job, error: jobError } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("company_id", companyId)
    .single();

  if (jobError || !job) {
    logger.error("Job not found", { jobId });
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Company Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {company.name}
              </h1>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                >
                  {company.website}
                </a>
              )}
              <div className="flex flex-wrap gap-4 mt-3">
                {company.industry && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {company.industry}
                  </div>
                )}
                {company.company_size && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-1" />
                    {company.company_size}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {job.job_title}
            </h2>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              Posted {new Date(job.created_at).toLocaleDateString()}
            </div>
          </div>

          {job.job_description && (
            <div className="prose prose-gray max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Job Description
              </h3>
              <div className="text-gray-700 whitespace-pre-wrap">
                {job.job_description}
              </div>
            </div>
          )}

          {job.company_description && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                About {company.name}
              </h3>
              <p className="text-gray-700">{job.company_description}</p>
            </div>
          )}
        </div>

        {/* Apply Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            {user ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Ready to apply for this position?
                </p>
                <Button size="lg" className="w-full sm:w-auto">
                  Apply Now
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Application functionality coming soon
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">
                  Sign in to apply for this position
                </p>
                <Link href={`/auth/login?redirect=/apply/company/${companyId}/job/${jobId}`}>
                  <Button size="lg" className="w-full sm:w-auto">
                    Sign In to Apply
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
