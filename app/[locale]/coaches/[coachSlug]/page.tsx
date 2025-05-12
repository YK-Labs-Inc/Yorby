import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import React from "react";
import CoachSignInForm from "./CoachSignInForm";
import CoachRegistrationButton from "./CoachRegistrationButton";

interface CoachPortalLandingPageProps {
  params: Promise<{
    coachSlug: string;
    locale: string;
  }>;
}

const fetchCoach = async (coachSlug: string) => {
  const logger = new Logger().with({
    coachSlug,
  });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("slug", coachSlug)
    .single();
  if (error) {
    logger.error("Error fetching coach", { error });
    await logger.flush();
    return null;
  }
  return data;
};

export default async function CoachPortalLandingPage({
  params,
}: CoachPortalLandingPageProps) {
  const { coachSlug } = await params;
  const coach = await fetchCoach(coachSlug);
  if (!coach) {
    return <div>Coach not found</div>;
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1>Welcome to {coach.name}&apos;s portal</h1>
      {user ? (
        <CoachRegistrationButton coachId={coach.id} coachName={coach.name} />
      ) : (
        <CoachSignInForm coachId={coach.id} />
      )}
    </div>
  );
}
