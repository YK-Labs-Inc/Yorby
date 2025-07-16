import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Briefcase, BarChart } from "lucide-react";
import Link from "next/link";

export default async function CompanyDashboardPage() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Get user's company membership
  const { data: membership } = await supabase
    .from("company_members")
    .select(`
      role,
      companies (
        id,
        name,
        slug,
        industry,
        company_size
      )
    `)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect("/company-onboarding");
  }

  const company = membership.companies;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Company Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back to {company.name}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No active job postings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No candidates yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Just you for now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No interviews conducted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with hiring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/company-jobs/new">
              <Button className="w-full" variant="outline">
                <Briefcase className="mr-2 h-4 w-4" />
                Create New Job Posting
              </Button>
            </Link>
            <Link href="/dashboard/company-team">
              <Button className="w-full" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Invite Team Members
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Your company details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{company.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Industry: {company.industry}
            </div>
            <div className="text-sm text-muted-foreground">
              Size: {company.company_size}
            </div>
            <div className="text-sm text-muted-foreground">
              Your role: {membership.role}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}