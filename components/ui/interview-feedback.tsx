import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface FeedbackData {
  pros: string[];
  cons: string[];
}

interface InterviewFeedbackProps {
  feedback: FeedbackData;
  className?: string;
}

export default function InterviewFeedback({
  feedback,
  className = "",
}: InterviewFeedbackProps) {
  const t = useTranslations("interviewQuestion");

  if (feedback.pros.length === 0 && feedback.cons.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{t("feedbackLabel")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t("noFeedback")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t("feedbackLabel")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pros Section */}
          <div className="rounded-lg bg-green-50/50 dark:bg-green-950/20 p-6 overflow-y-auto border border-green-100 dark:border-green-900 max-h-[400px] relative">
            <div className="flex items-center gap-2 mb-4 sticky -top-6 -mx-6 -mt-6 px-6 pt-6 pb-2 bg-green-50 dark:bg-green-950 border-b border-green-100 dark:border-green-900">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-lg text-green-900 dark:text-green-100">
                {t("pros")}
              </h3>
            </div>
            <div className="space-y-3">
              {feedback.pros.length === 0 ? (
                <p className="text-green-800 dark:text-green-200 italic">
                  {t("noPros")}
                </p>
              ) : (
                feedback.pros.map((pro: string, index: number) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="text-green-600 dark:text-green-400 mt-1">
                      •
                    </span>
                    <p className="text-green-800 dark:text-green-200">{pro}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Areas to Improve Section */}
          <div className="rounded-lg bg-yellow-50/50 dark:bg-yellow-950/20 p-6 overflow-y-auto border border-yellow-100 dark:border-yellow-900 max-h-[400px] relative">
            <div className="flex items-center gap-2 mb-4 sticky -top-6 -mx-6 -mt-6 px-6 pt-6 pb-2 bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-100 dark:border-yellow-900">
              <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="font-semibold text-lg text-yellow-900 dark:text-yellow-100">
                {t("areasToImprove")}
              </h3>
            </div>
            <div className="space-y-3">
              {feedback.cons.length === 0 ? (
                <p className="text-yellow-800 dark:text-yellow-200 italic">
                  {t("noAreasToImprove")}
                </p>
              ) : (
                feedback.cons.map((con: string, index: number) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="text-yellow-600 dark:text-yellow-400 mt-1">
                      •
                    </span>
                    <p className="text-yellow-800 dark:text-yellow-200">
                      {con}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
