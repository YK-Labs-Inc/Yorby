import { createSupabaseServerClient } from "@/utils/supabase/server";
import AnswerGuideline from "./AnswerGuideline";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import AnswerForm from "./AnswerForm";

const fetchQuestion = async (questionId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_job_questions")
    .select(
      `*, 
      custom_job_question_submissions(*)`
    )
    .eq("id", questionId)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string; questionId: string }>;
}) {
  const { jobId, questionId } = await params;
  const question = await fetchQuestion(questionId);

  return (
    <div className="max-w-[1080px] w-full mx-auto p-6 space-y-6">
      <Link
        href={`/dashboard/jobs/${jobId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-8 w-8 mr-2" />
      </Link>

      <AnswerForm
        jobId={jobId}
        question={question}
        submissions={question.custom_job_question_submissions}
      />
      <AnswerGuideline question={question} />
    </div>
  );
}
