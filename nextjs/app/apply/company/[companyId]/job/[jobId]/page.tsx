import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Users, Calendar, Briefcase } from "lucide-react";
import { Logger } from "next-axiom";
import { CollapsibleJobDescription } from "@/components/CollapsibleJobDescription";

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
              Posted {new Date(job.created_at).toLocaleDateString()}
            </CardDescription>
          </div>

          {/* Job Description Section */}
          {job.job_description && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Job Description</h3>
              <div className="prose prose-gray max-w-none">
                <CollapsibleJobDescription description={job.job_description} />
              </div>
            </div>
          )}
        </CardContent>

        {/* Apply Button Section */}
        <CardFooter className="border-t p-6">
          {user ? (
            <Link href={`/apply/company/${companyId}/job/${jobId}/application`}>
              <Button size="lg" className="w-full sm:w-auto">
                Apply Now
              </Button>
            </Link>
          ) : (
            <Link
              href={`/auth/login?redirect=/apply/company/${companyId}/job/${jobId}`}
            >
              <Button size="lg" className="w-full sm:w-auto">
                Sign In to Apply
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
