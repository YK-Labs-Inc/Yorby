import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface CoachAdminLayoutProps {
  children: ReactNode;
}

const CoachAdminLayout = async ({ children }: CoachAdminLayoutProps) => {
  const origin = (await headers()).get("x-forwarded-host");

  if (!origin?.includes("yorby")) {
    redirect("/");
  }

  return <>{children}</>;
};

export default CoachAdminLayout;
