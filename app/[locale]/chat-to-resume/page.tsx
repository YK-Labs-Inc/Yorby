import { createSupabaseServerClient } from "@/utils/supabase/server";
import LandingPage from "./LandingPage";
export default async function ChatToResume() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <LandingPage user={user} />;
}
