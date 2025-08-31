import { VOICE_OPTIONS } from "@/app/types/tts";
import PersonaMockInterviewClient from "./PersonaMockInterviewClient";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { PathHeader } from "@/components/marketing/PathHeader";
import { getServerUser } from "@/utils/auth/server";

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

  const user = await getServerUser();

  return (
    <div className="min-h-screen">
      {!user && <PathHeader />}
      <PersonaMockInterviewClient selectedVoice={selectedVoice} />
    </div>
  );
}
