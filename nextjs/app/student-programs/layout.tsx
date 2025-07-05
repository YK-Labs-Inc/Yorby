import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function StudentProgramsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const origin = (await headers()).get("x-forwarded-host");
  if (
    !origin?.includes("yorby") &&
    process.env.NEXT_PUBLIC_IS_YORBY !== "true"
  ) {
    redirect("/");
  }
  return <div className="min-h-screen bg-background">{children}</div>;
}
