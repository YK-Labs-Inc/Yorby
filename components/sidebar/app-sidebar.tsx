import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { H3 } from "../typography";
import SidebarMenuItemClient from "./SideBarMenuItemClient";

const fetchJobs = async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("custom_jobs").select("*");
  if (error) {
    throw error;
  }
  return data;
};

export async function AppSidebar() {
  const jobs = await fetchJobs();
  return (
    <Sidebar>
      <SidebarHeader>
        <H3>Perfect Interview</H3>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {jobs.map((job) => (
                <SidebarMenuItemClient key={job.id} job={job} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
