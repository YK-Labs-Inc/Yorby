import { createSupabaseServerClient } from "@/utils/supabase/server";
import { PathHeader } from "@/components/marketing/PathHeader";
import PersonaMockInterviewClient from "./[persona]/PersonaMockInterviewClient";

export default async function MockInterviews() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      {!user && <PathHeader />}
      <PersonaMockInterviewClient />
    </div>
  );
}
