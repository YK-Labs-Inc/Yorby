import { VOICE_OPTIONS } from "@/app/types/tts";
import PersonaMockInterviewClient from "./PersonaMockInterviewClient";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { PathHeader } from "@/components/marketing/PathHeader";

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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      {!user && <PathHeader />}
      <PersonaMockInterviewClient selectedVoice={selectedVoice} />
    </div>
  );
}
