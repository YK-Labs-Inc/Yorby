"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
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
import { Calendar, Loader2 } from "lucide-react";
import { CollapsibleJobDescription } from "@/components/CollapsibleJobDescription";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { toast } from "sonner";
import type { Tables } from "@/utils/supabase/database.types";

type Company = Tables<"companies">;
type Job = Tables<"custom_jobs">;

interface ApplicationStatusResponse {
  success: boolean;
  hasApplied: boolean;
  hasCompletedInterview: boolean;
  application: {
    id: string;
    status: string;
    applied_at: string;
  } | null;
}

interface PageProps {
  params: Promise<{
    companyId: string;
    jobId: string;
  }>;
}

// Generic fetcher function for API endpoints
async function fetcher(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch data");
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "API request failed");
  }

  return result.data;
}

// Fetcher function for user data
async function fetchUser() {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Mutation function for checking application status
async function checkApplicationStatus(
  url: string,
  { arg }: { arg: { companyId: string; jobId: string } }
): Promise<ApplicationStatusResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to check application status");
  }

  return response.json();
}

export default function ApplyPage({ params }: PageProps) {
  const [companyId, setCompanyId] = useState<string>("");
  const [jobId, setJobId] = useState<string>("");
  const router = useRouter();
  const { logInfo, logError } = useAxiomLogging();

  // Initialize params
  useEffect(() => {
    async function initializeParams() {
      const { companyId, jobId } = await params;
      setCompanyId(companyId);
      setJobId(jobId);
    }
    initializeParams();
  }, [params]);

  // Fetch user data
  const { data: user, error: userError } = useSWR("/api/user", fetchUser);

  // Fetch company data using the new API endpoint
  const {
    data: company,
    error: companyError,
    isLoading: companyLoading,
  } = useSWR<Company>(
    companyId ? `/api/companies/${companyId}` : null,
    fetcher
  );

  // Fetch job data using the new API endpoint
  const {
    data: job,
    error: jobError,
    isLoading: jobLoading,
  } = useSWR<Job>(
    companyId && jobId ? `/api/jobs/${jobId}?companyId=${companyId}` : null,
    fetcher
  );

  // Application status check mutation
  const { trigger: checkApplication, isMutating: checkingApplication } =
    useSWRMutation("/api/apply/status", checkApplicationStatus);

  // Handle errors by redirecting
  useEffect(() => {
    if (companyError) {
      logError("Company not found", { companyId, error: companyError });
      router.push("/");
    }
    if (jobError) {
      logError("Job not found", { jobId, error: jobError });
      router.push("/");
    }
    if (userError) {
      logError("User fetch error", { error: userError });
    }
  }, [companyError, jobError, userError, companyId, jobId, router, logError]);

  const handleApplyClick = async () => {
    if (!user || !companyId || !jobId) return;

    try {
      const result = await checkApplication({ companyId, jobId });

      if (result.hasApplied) {
        if (result.hasCompletedInterview) {
          // User has already applied and completed interview, redirect to submitted page
          logInfo(
            "User redirected to submitted page - already applied and interviewed",
            {
              companyId,
              jobId,
              applicationId: result.application?.id,
            }
          );
          router.push(
            `/apply/company/${companyId}/job/${jobId}/application/submitted`
          );
        } else {
          // User has applied but hasn't completed interview, redirect to interview page
          logInfo(
            "User redirected to interview - already applied but not interviewed",
            {
              companyId,
              jobId,
              applicationId: result.application?.id,
            }
          );
          router.push(`/apply/company/${companyId}/job/${jobId}/interview`);
        }
      } else {
        // User hasn't applied yet, redirect to application page
        logInfo("User redirected to application form", { companyId, jobId });
        router.push(`/apply/company/${companyId}/job/${jobId}/application`);
      }
    } catch (error) {
      toast.error("Failed to check application status");
      logError("Application status check error", { error });
    }
  };

  // Show loading state
  if (companyLoading || jobLoading || !companyId || !jobId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show nothing if data is missing (error handling will redirect)
  if (!company || !job) {
    return notFound();
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
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={handleApplyClick}
              disabled={checkingApplication}
            >
              {checkingApplication ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Apply Now"
              )}
            </Button>
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
