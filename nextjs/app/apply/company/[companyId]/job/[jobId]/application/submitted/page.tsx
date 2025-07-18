import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

interface PageProps {
  params: Promise<{
    companyId: string;
    jobId: string;
  }>;
}

export default async function ApplicationSubmittedPage({ params }: PageProps) {
  const { companyId, jobId } = await params;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Application Submitted!</CardTitle>
            <CardDescription>
              Your application has been successfully submitted. The hiring team will review it and get back to you soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={`/apply/company/${companyId}/job/${jobId}`}>
              <Button variant="outline" className="w-full">
                Back to Job Posting
              </Button>
            </Link>
            <Link href="/dashboard/jobs">
              <Button className="w-full">
                Browse More Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}