import { CheckCircle, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface FeedbackData {
  pros: string[];
  cons: string[];
}

interface QuestionFeedbackProps {
  feedback: FeedbackData;
  className?: string;
  correctnessScore?: number;
}

export default function QuestionFeedback({
  feedback,
  correctnessScore,
}: QuestionFeedbackProps) {
  const t = useTranslations("interviewQuestion");

  if (feedback.pros.length === 0 && feedback.cons.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Image 
            src="/assets/light-logo.png" 
            alt="Yorby AI" 
            width={20} 
            height={20} 
            className="w-5 h-5"
          />
          <h2 className="text-lg font-medium text-slate-900">
            {t("feedbackLabel")}
          </h2>
          {typeof correctnessScore === "number" && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-slate-600">
                {t("correctnessScore")}
              </span>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-md
                  ${
                    correctnessScore >= 80
                      ? "bg-emerald-100 text-emerald-700"
                      : correctnessScore >= 50
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  }
                `}
              >
                {correctnessScore}%
              </span>
            </div>
          )}
        </div>
        <p className="text-slate-500 text-sm">{t("noFeedback")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Image 
          src="/assets/light-logo.png" 
          alt="Yorby AI" 
          width={20} 
          height={20} 
          className="w-5 h-5"
        />
        <h2 className="text-lg font-medium text-slate-900">
          {t("feedbackLabel")}
        </h2>
        {typeof correctnessScore === "number" && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-slate-600">
              {t("correctnessScore")}
            </span>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-md
                ${
                  correctnessScore >= 80
                    ? "bg-emerald-100 text-emerald-700"
                    : correctnessScore >= 50
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }
              `}
            >
              {correctnessScore}%
            </span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <h3 className="font-medium text-slate-900">{t("pros")}</h3>
          </div>
          <div className="space-y-2 bg-emerald-50/50 rounded-lg p-4 border border-emerald-100 min-h-[120px]">
            {feedback.pros.length === 0 ? (
              <p className="text-slate-500 text-sm italic">
                {t("noPros")}
              </p>
            ) : (
              feedback.pros.map((pro: string, index: number) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-slate-700 text-sm leading-relaxed">{pro}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Areas to Improve */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-medium text-slate-900">{t("areasToImprove")}</h3>
          </div>
          <div className="space-y-2 bg-amber-50/50 rounded-lg p-4 border border-amber-100 min-h-[120px]">
            {feedback.cons.length === 0 ? (
              <p className="text-slate-500 text-sm italic">
                {t("noAreasToImprove")}
              </p>
            ) : (
              feedback.cons.map((con: string, index: number) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-slate-700 text-sm leading-relaxed">{con}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
