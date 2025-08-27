import { getServerUser } from "@/utils/auth/server";
import { redirect } from "next/navigation";
import OnboardingFlow from "./OnboardingFlow";

export default async function RecruitingOnboardingPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <OnboardingFlow />;
}
