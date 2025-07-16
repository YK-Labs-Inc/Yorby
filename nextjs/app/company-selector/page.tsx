"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, Plus } from "lucide-react";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  company_size: string | null;
}

interface CompanyMembership {
  company_id: string;
  role: string;
  companies: Company;
}

export default function CompanySelectorPage() {
  const [memberships, setMemberships] = useState<CompanyMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { logInfo, logError } = useAxiomLogging();
  const supabase = createClient();

  useEffect(() => {
    fetchUserCompanies();
  }, []);

  const fetchUserCompanies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/sign-in");
        return;
      }

      const { data, error } = await supabase
        .from("company_members")
        .select(`
          company_id,
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
        .not("accepted_at", "is", null);

      if (error) throw error;

      if (!data || data.length === 0) {
        // No companies, redirect to onboarding
        router.push("/company-onboarding");
        return;
      }

      if (data.length === 1) {
        // Only one company, redirect directly
        router.push("/dashboard/company");
        return;
      }

      setMemberships(data as CompanyMembership[]);
      logInfo("Fetched user companies", { count: data.length });
    } catch (error: any) {
      logError("Failed to fetch companies", { error: error.message });
      toast.error("Failed to load your companies");
    } finally {
      setIsLoading(false);
    }
  };

  const selectCompany = async (companyId: string) => {
    // TODO: Store the selected company in session/cookie
    // For now, we'll just redirect to the dashboard
    logInfo("Company selected", { companyId });
    router.push("/dashboard/company");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Select a Company
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose which company you'd like to work with
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {memberships.map((membership) => (
            <Card 
              key={membership.company_id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => selectCompany(membership.company_id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {membership.companies.name}
                </CardTitle>
                <CardDescription>
                  {membership.role.charAt(0).toUpperCase() + membership.role.slice(1)}
                  {membership.companies.industry && ` • ${membership.companies.industry}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {membership.companies.company_size || "Size not specified"}
                  </span>
                  <Button variant="ghost" size="sm">
                    Select →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => router.push("/company-onboarding")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Company
          </Button>
        </div>
      </div>
    </div>
  );
}