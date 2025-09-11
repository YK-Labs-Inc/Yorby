import { Button } from "@/components/ui/button";
import Link from "next/link";
import { InterviewCompletionMessage } from "./InterviewCompletionMessage";
import { useTranslations } from "next-intl";

export default function RealInterviewCompletionComponent({
  nextInterviewId,
  nextUrl,
}: {
  nextInterviewId?: string | null;
  nextUrl: string;
}) {
  const tInterview = useTranslations("apply.candidateInterview");
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {tInterview("interviewComplete")}
            </h2>
            {nextInterviewId ? (
              <>
                <p className="text-gray-600 mb-6">
                  {tInterview("interviewProcessed.nextRound")}
                </p>
                <Button asChild>
                  <Link href={nextUrl}>
                    {tInterview("buttons.continueToNext")}
                  </Link>
                </Button>
              </>
            ) : (
              <InterviewCompletionMessage />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
