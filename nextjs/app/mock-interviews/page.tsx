import { createSupabaseServerClient } from "@/utils/supabase/server";
import { PathHeader } from "@/components/marketing/PathHeader";
import PersonaMockInterviewClient from "./[persona]/PersonaMockInterviewClient";
import { getServerUser } from "@/utils/auth/server";

export default async function MockInterviews() {
  const user = await getServerUser();

  return (
    <div className="min-h-screen">
      {!user && <PathHeader />}
      <PersonaMockInterviewClient />
    </div>
  );
}
