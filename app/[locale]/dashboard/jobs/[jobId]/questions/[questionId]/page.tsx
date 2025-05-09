import QuestionComponent from "./QuestionComponent";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string; questionId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { jobId, questionId } = await params;
  const { submissionId } = (await searchParams) as {
    submissionId?: string;
  };
  return (
    <QuestionComponent
      questionId={questionId}
      jobId={jobId}
      submissionId={submissionId}
    />
  );
}
