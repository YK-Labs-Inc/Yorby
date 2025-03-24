import { VOICE_OPTIONS } from "@/app/types/tts";
import PersonaMockInterviewClient from "./PersonaMockInterviewClient";
import { redirect } from "next/navigation";

export default async function MockInterviews({
  params,
}: {
  params: Promise<{ persona: string }>;
}) {
  const { persona } = await params;
  const selectedVoice = VOICE_OPTIONS.find(
    (voice) => voice.voiceId === persona
  );

  if (!selectedVoice) {
    redirect("/mock-interviews/lbj");
  }

  return (
    <div className="min-h-screen bg-background">
      <PersonaMockInterviewClient selectedVoice={selectedVoice} />
    </div>
  );
}
