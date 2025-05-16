import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tables } from "@/utils/supabase/database.types";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
}

export default async function StudentQuestionSubmissions({
  question,
  submissions,
  currentSubmissionId,
  studentId,
  jobId,
  questionId,
}: {
  question: Tables<"custom_job_questions">;
  submissions: Tables<"custom_job_question_submissions">[];
  currentSubmissionId?: string;
  studentId: string;
  jobId: string;
  questionId: string;
}) {
  const t = await getTranslations(
    "AdminStudentView.studentQuestionSubmissions"
  );
  const currentSubmission =
    submissions.find((s) => s.id === currentSubmissionId) ||
    (submissions.length > 0 ? submissions[0] : null);

  if (!currentSubmission) {
    return notFound();
  }

  // Feedback structure: { pros: string[], cons: string[] }
  const feedback = currentSubmission?.feedback as {
    pros: string[];
    cons: string[];
  } | null;

  return (
    <div className="flex flex-col gap-6">
      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle>{t("question")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium text-gray-900 mb-2">
            {question.question}
          </p>
        </CardContent>
      </Card>

      {/* Current Submission */}
      <Card>
        <CardHeader>
          <CardTitle>{t("submissionDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentSubmission ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {t("submitted", {
                    date: formatDate(currentSubmission.created_at),
                  })}
                </span>
              </div>
              <p className="whitespace-pre-line text-gray-800 border rounded p-3 bg-gray-50">
                {currentSubmission.answer}
              </p>
              <Separator />
              <div>
                <h3 className="font-semibold text-base mb-2">
                  {t("aiFeedback")}
                </h3>
                {feedback &&
                (feedback.pros.length > 0 || feedback.cons.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-2">
                        {t("pros")}
                      </h4>
                      {feedback.pros.length === 0 ? (
                        <p className="italic text-green-700">{t("noPros")}</p>
                      ) : (
                        <ul className="list-disc ml-5 space-y-1">
                          {feedback.pros.map((pro, idx) => (
                            <li key={idx} className="text-green-800">
                              {pro}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">
                        {t("cons")}
                      </h4>
                      {feedback.cons.length === 0 ? (
                        <p className="italic text-red-700">{t("noCons")}</p>
                      ) : (
                        <ul className="list-disc ml-5 space-y-1">
                          {feedback.cons.map((con, idx) => (
                            <li key={idx} className="text-red-800">
                              {con}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="italic text-gray-500">{t("noFeedback")}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="italic text-gray-500">{t("noSubmissionsYet")}</p>
          )}
        </CardContent>
      </Card>

      {/* Submission History */}
      <Card>
        <CardHeader>
          <CardTitle>{t("submissionHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="italic text-gray-500">{t("noPreviousSubmissions")}</p>
          ) : (
            <ul className="space-y-4">
              {submissions.map((submission) => (
                <li
                  key={submission.id}
                  className={`border rounded-lg p-3 bg-white cursor-pointer transition-colors ${
                    submission.id === currentSubmission.id
                      ? "ring-2 ring-primary border-primary bg-primary/10"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <Link
                    href={`/dashboard/coach-admin/students/${studentId}/jobs/${jobId}/questions/${questionId}?submissionId=${submission.id}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        {formatDate(submission.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-800 line-clamp-3">
                      {submission.answer}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
