import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface CoachesLayoutProps {
  children: ReactNode;
}

const CoachesLayout = async ({ children }: CoachesLayoutProps) => {
  const origin = (await headers()).get("x-forwarded-host");

  if (!origin?.includes("yorby")) {
    redirect("/");
  }

  return <>{children}</>;
};

export default CoachesLayout;
