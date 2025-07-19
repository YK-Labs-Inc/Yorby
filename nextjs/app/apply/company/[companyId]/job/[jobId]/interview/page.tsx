import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Mic, Clock, ArrowRight } from "lucide-react";

interface PageProps {
  params: Promise<{
    companyId: string;
    jobId: string;
  }>;
}

export default async function InterviewPage({ params }: PageProps) {
  const { companyId, jobId } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Interview Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">AI Interview Ready</CardTitle>
            <CardDescription>
              Your application has been submitted successfully. Now let's proceed with a quick AI interview to complete your application.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Interview Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Interview Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Camera & Microphone Setup</h4>
                  <p className="text-sm text-gray-600">Ensure your camera and microphone are working properly before starting.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Interview Duration</h4>
                  <p className="text-sm text-gray-600">The interview will take approximately 10-15 minutes.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium">AI-Powered Questions</h4>
                  <p className="text-sm text-gray-600">You'll be asked relevant questions based on the job requirements and your application.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Requirements */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Technical Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Browser Requirements</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Chrome, Firefox, or Safari (latest version)</li>
                  <li>• Stable internet connection</li>
                  <li>• Camera and microphone permissions</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Environment Setup</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Quiet, well-lit space</li>
                  <li>• Minimal background distractions</li>
                  <li>• Professional appearance</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" size="lg">
            <Clock className="h-4 w-4 mr-2" />
            Schedule for Later
          </Button>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Video className="h-4 w-4 mr-2" />
            Start Interview Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Placeholder Notice */}
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-800">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <p className="text-sm font-medium">
                This is a placeholder interview page. The actual interview functionality will be implemented next.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}