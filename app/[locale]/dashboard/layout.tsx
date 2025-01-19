import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const fetchJobs = async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("custom_jobs").select("*");
  if (error) {
    throw error;
  }
  return data;
};

const getUser = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jobs, user] = await Promise.all([fetchJobs(), getUser()]);

  if (!user) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <AppSidebar jobs={jobs} user={user} />
      <SidebarTrigger />
      {children}
    </SidebarProvider>
  );
}
