import ResumeBuilder from "../components/ResumeBuilder";

export default async function ResumePage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const resumeId = (await params).resumeId;
  return <ResumeBuilder resumeId={resumeId} />;
}
