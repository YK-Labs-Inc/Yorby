import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SubmitButton } from "@/components/submit-button";
import AnswerGuideline from "./AnswerGuideline";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import AnswerForm from "./AnswerForm";

const fetchQuestion = async (jobId: string, questionId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_job_questions")
    .select("*")
    .eq("id", questionId)
    .eq("custom_job_id", jobId)
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
  const question = await fetchQuestion(jobId, questionId);
  const t = await getTranslations("interviewQuestion");

  return (
    <div className="max-w-[1080px] w-full mx-auto p-6 space-y-6">
      <Link
        href={`/dashboard/jobs/${jobId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-8 w-8 mr-2" />
      </Link>

      <AnswerForm jobId={jobId} question={question} />
      <AnswerGuideline question={question} />
    </div>
  );
}
