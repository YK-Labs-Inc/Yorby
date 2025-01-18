import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { H3 } from "../typography";
import SidebarMenuItemClient from "./SideBarMenuItemClient";
import { ThemeSwitcher } from "../theme-switcher";
import { Button } from "../ui/button";
import { PlusIcon } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("sidebar");
  return (
    <Sidebar>
      <SidebarHeader>
        <H3>Perfect Interview</H3>
        <Button>
          <Link
            href={`/dashboard/jobs?newJob=true`}
            className="flex items-center gap-2"
          >
            <p>{t("addJob")}</p>
            <PlusIcon />
          </Link>
        </Button>
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
      <SidebarFooter>
        <div className="px-3 py-2">
          <ThemeSwitcher />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
